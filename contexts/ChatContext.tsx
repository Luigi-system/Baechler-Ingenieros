
import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { useSupabase } from './SupabaseContext';
import { useAiService } from './AiServiceContext';
import { 
    directSupabaseSystemInstruction, responseSchema, 
    executeQueryOnDatabase_Gemini, getAggregateData_Gemini, performAction_Gemini,
    callExternalAgentWithQuery_Gemini, callExternalAgentWithData_Gemini, // New Gemini agent tools
    executeQueryOnDatabase_OpenAI, getAggregateData_OpenAI, performAction_OpenAI,
    callExternalAgentWithQuery_OpenAI, callExternalAgentWithData_OpenAI, // New OpenAI agent tools
    handleFunctionExecution, agenteOrchestratorSystemInstruction
} from '../services/aiService';
import type { AIResponse, TableData, ConfirmationMessage } from '../types';

export interface Message {
  sender: 'user' | 'ai';
  content: string | AIResponse;
  // Add properties for OpenAI tool calls
  tool_calls?: any[];
  tool_call_id?: string;
  // Temporary ID to help with replacing loading messages
  tempId?: string;
}

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  hasUnreadMessage: boolean;
  sendMessage: (prompt: string) => Promise<void>;
  setHasUnreadMessage: (hasUnread: boolean) => void;
  clearUnread: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const WELCOME_MESSAGE: Message = { 
    sender: 'ai', 
    content: { 
        displayText: '¡Hola! Soy tu asistente de datos. ¿En qué puedo ayudarte hoy?',
        suggestions: ["Muéstrame los 5 reportes de servicio más recientes", "¿Cuántas empresas hay en total?", "Crea un gráfico de reportes por empresa"]
    } 
};

// Constants for retry logic
const MAX_AGENT_RETRIES = 4; // 1 initial attempt + 4 retries = 5 total attempts
const RETRY_DELAY_MS = 1000; // Base delay in milliseconds

// Helper for delays
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Extracts and parses a JSON object from a string.
 * It first tries to parse the string directly. If that fails, it looks for a JSON
 * objeto wrapped in markdown code fences (```json ... ```) and attempts to parse that.
 * @param text The string that may contain a JSON object.
 * @returns The parsed AIResponse object, or null if no valid JSON is found.
 */
const extractAndParseJson = (text: string): AIResponse | null => {
    try {
        return JSON.parse(text) as AIResponse;
    } catch (e) {
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            try {
                return JSON.parse(jsonMatch[2]) as AIResponse;
            } catch (innerError) {
                console.error("Failed to parse extracted JSON block:", innerError);
                return null;
            }
        }
    }
    return null;
};

/**
 * Maps a raw JSON response from the external agent into a standardized AIResponse format.
 * This is crucial for displaying agent results consistently in the chat UI.
 * @param rawAgentResponse The raw JSON object received from the webhook.
 * @returns An AIResponse object.
 */
const mapAgentResponseToAIResponse = (rawAgentResponse: any): AIResponse => {
    // If the raw response is already an AIResponse, return it directly.
    if (rawAgentResponse && typeof rawAgentResponse === 'object' && 'displayText' in rawAgentResponse) {
        return rawAgentResponse as AIResponse;
    }

    let displayText: string = "";
    let table: TableData | undefined;
    let chart: any | undefined; // Using 'any' as chart type is more complex.
    let suggestions: string[] = ["¿Hay algo más en lo que pueda ayudarte?"];
    let actions: any[] | undefined;
    let statusDisplay: ConfirmationMessage | undefined; // New field

    if (rawAgentResponse === null || typeof rawAgentResponse !== 'object') {
        displayText = `Recibí una respuesta inesperada del agente: ${String(rawAgentResponse)}.`;
        statusDisplay = { icon: 'error', title: 'Error Inesperado', message: 'La respuesta del agente no es válida o está vacía.' };
    } else if (rawAgentResponse.error) {
        // Handle explicit error messages from the agent
        displayText = `El agente reportó un error: ${rawAgentResponse.error.message || rawAgentResponse.error}`;
        statusDisplay = { icon: 'error', title: 'Error en la Operación', message: rawAgentResponse.error.message || String(rawAgentResponse.error) };
        suggestions = ["¿Puedes reformular la pregunta?", "Contactar a soporte"];
    } else if (rawAgentResponse.data && typeof rawAgentResponse.data === 'object' && Object.keys(rawAgentResponse.data).length > 0) {
        // SUCCESS: Agent returned structured data, likely a new or updated record (e.g., {"data": {"id": 32, "nombre": "inkakola", ...}})
        displayText = `¡Operación completada con éxito! Se ha registrado/actualizado el siguiente elemento:`;
        statusDisplay = { icon: 'success', title: '¡Éxito!', message: 'El registro se ha guardado correctamente.' };
        
        // Convert the single data object into a simple table for display
        const headers = Object.keys(rawAgentResponse.data);
        const rows = [headers.map(header => {
            const value = rawAgentResponse.data[header];
            // Format dates/timestamps if they look like them
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
                try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleString(); // Prettier date display
                    }
                } catch (e) { /* ignore */ }
            }
            return String(value);
        })];
        table = { headers, rows };

    } else if (rawAgentResponse.message) {
        // Handle generic success messages (e.g., {"message": "Company created successfully."})
        displayText = rawAgentResponse.message;
        statusDisplay = { icon: 'info', title: 'Información', message: rawAgentResponse.message };
    } else {
        // Attempt to find lists or data to display as tables/charts (for query results from agent)
        const keys = Object.keys(rawAgentResponse);
        let foundDataToDisplay = false;

        for (const key of keys) {
            const value = rawAgentResponse[key];
            if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                // Found an array of objects, assume it's tabular data
                displayText = `Aquí están los ${key.replace(/_/g, ' ')} solicitados:`;
                const headers = Object.keys(value[0]);
                const rows = value.map((item: any) => headers.map(header => item[header]));
                table = { headers, rows };
                suggestions = [`Ver detalles de ${key} específicos`, `Filtrar ${key} por...`];
                foundDataToDisplay = true;
                break;
            }
            // Add more specific handling for charts or other types if expected from agent
        }

        if (!foundDataToDisplay) {
            // If no recognizable data structure was found, stringify the whole response.
            displayText = `Recibí una respuesta del agente, pero no pude interpretarla completamente. Contenido: \`\`\`json\n${JSON.stringify(rawAgentResponse, null, 2)}\n\`\`\``;
            statusDisplay = { icon: 'warning', title: 'Respuesta Ambígüa', message: 'La respuesta del agente no se pudo interpretar completamente.' };
        }
    }

    return { displayText, table, chart, actions, suggestions, statusDisplay };
};


export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const { 
        service, geminiClient, openaiClient, agenteClient, isAgenteEnabled, agenteWebhookUrl 
    } = useAiService();
    const [chat, setChat] = useState<Chat | null>(null); // Only used for Gemini's stateful chat

    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

    // Effect to initialize or re-initialize chat session when service or isAgenteEnabled changes
    useEffect(() => {
        // Chat session (stateful) is only created for Gemini.
        // For 'openai' service, it's stateless, so no chat object is needed here.
        if (service === 'gemini' && geminiClient) {
            try {
                // Determine system instruction and tools based on whether the agent is enabled
                const geminiTools = isAgenteEnabled ?
                    [{ functionDeclarations: [callExternalAgentWithQuery_Gemini, callExternalAgentWithData_Gemini] }] :
                    [{ functionDeclarations: [executeQueryOnDatabase_Gemini, getAggregateData_Gemini, performAction_Gemini] }];

                const currentSystemInstruction = isAgenteEnabled ? agenteOrchestratorSystemInstruction : directSupabaseSystemInstruction;

                const newChat = geminiClient.chats.create({
                    model: 'gemini-2.5-pro', // Using a powerful model for reasoning.
                    config: {
                        tools: geminiTools,
                        systemInstruction: currentSystemInstruction,
                        temperature: 0.1,
                        responseMimeType: "application/json",
                        responseSchema: responseSchema,
                    }
                });
                setChat(newChat);
            } catch (e) {
                console.error("Failed to create Gemini chat session:", e);
                setChat(null);
            }
        } else {
            setChat(null); // Clear chat object if not Gemini
        }

        // Always reset messages to welcome message on service/agent config change
        setMessages([WELCOME_MESSAGE]);
    }, [service, geminiClient, isAgenteEnabled]);

    const sendMessage = useCallback(async (prompt: string) => {
        if (prompt.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (!supabase) throw new Error("La conexión a Supabase no está disponible.");

            // --- PRE-PROCESS USER FORM SUBMISSION ---
            // This logic allows the UI to directly send form data to the agent
            // without the LLM needing to re-interpret the submission prompt.
            const formSubmissionPattern = "El usuario ha completado el formulario con los siguientes datos: ";
            if (isAgenteEnabled && agenteClient && prompt.startsWith(formSubmissionPattern)) {
                console.log("Detectado envío de formulario. Procesando directamente con el agente externo...");
                const jsonString = prompt.substring(formSubmissionPattern.length, prompt.indexOf(". Procede a crear el registro en la base de datos."));
                let formData: any;
                try {
                    formData = JSON.parse(jsonString);
                } catch (e: any) {
                    throw new Error("Formato JSON inválido en el envío del formulario: " + e.message);
                }

                // Add a temporary loading message to provide immediate feedback
                const tempLoadingMessageId = Date.now().toString(); // Unique ID for temporary message
                const loadingMessageContent: AIResponse = { 
                    displayText: 'El asistente está procesando los datos del formulario y guardando el registro en la base de datos...',
                    // Optionally, you can add a temporary statusDisplay for visual loading feedback
                    // statusDisplay: { icon: 'info', title: 'Procesando...', message: 'Enviando datos al agente externo...' }
                };
                setMessages(prev => [...prev, { sender: 'ai', content: loadingMessageContent, tempId: tempLoadingMessageId }]);
                
                let rawAgentResponse: any;
                let agentError: any = null;

                for (let attempt = 0; attempt <= MAX_AGENT_RETRIES; attempt++) {
                    try {
                        rawAgentResponse = await agenteClient.sendToAgent({ data: formData }, agenteWebhookUrl);
                        // Ensure the response is actually an object before returning
                        if (typeof rawAgentResponse !== 'object' || rawAgentResponse === null) {
                            throw new Error("Respuesta del agente externo no es un objeto JSON válido.");
                        }
                        agentError = null; // Clear any previous errors on success
                        break; // Exit loop on success
                    } catch (retryError: any) {
                        agentError = retryError; // Store the error
                        console.error(`Intento ${attempt + 1}/${MAX_AGENT_RETRIES + 1} fallido para la llamada al agente con datos de formulario:`, retryError.message);
                        if (attempt < MAX_AGENT_RETRIES) {
                            await sleep(RETRY_DELAY_MS * (attempt + 1));
                        } else {
                            agentError = new Error("AGENT_EXTERNAL_FAILED_AFTER_RETRIES");
                        }
                    }
                }
                
                // After agent response (or all retries exhausted), replace the temporary message.
                setMessages(prev => {
                    const newMessages = [...prev];
                    const tempMessageIndex = newMessages.findIndex(msg => msg.tempId === tempLoadingMessageId);
                    if (tempMessageIndex !== -1) {
                        let finalContent: AIResponse;
                        if (agentError) {
                            let userFacingMessage = `Lo siento, el agente externo no pudo procesar tu solicitud después de varios intentos. Por favor, inténtalo de nuevo más tarde o reformula tu pregunta. Si el problema persiste, contacta a soporte técnico.`;
                            if (agentError.message !== "AGENT_EXTERNAL_FAILED_AFTER_RETRIES") {
                                userFacingMessage = `Lo siento, el agente externo reportó un problema: ${agentError.message}. Por favor, inténtalo de nuevo más tarde o reformula tu pregunta.`;
                            }
                            finalContent = { 
                                displayText: userFacingMessage,
                                statusDisplay: { icon: 'error', title: 'Error al Procesar', message: userFacingMessage }
                            };
                        } else {
                             finalContent = mapAgentResponseToAIResponse(rawAgentResponse);
                        }
                        newMessages[tempMessageIndex] = { sender: 'ai', content: finalContent };
                    } else {
                        // Fallback: if somehow the loading message wasn't found, just append the final response.
                        newMessages.push({ sender: 'ai', content: mapAgentResponseToAIResponse(rawAgentResponse) });
                    }
                    return newMessages;
                });

                setIsLoading(false);
                return; // IMPORTANT: Exit here, as we've handled the message.
            }
            // --- END PRE-PROCESSING ---


            // --- 1. Determine which LLM to use as the orchestrator, and its configuration ---
            let activeLLMClient: any = null;
            let activeLLMModel: string;
            let activeLlmTools: any[];
            let activeSystemInstruction: string;
            let isLLMGemini: boolean = false; // Flag to differentiate LLM logic
            let openaiMessagesHistory: any[] = []; // Only built for OpenAI stateless calls

            // Determine if the agent is enabled for orchestration
            const isAgentModeSelected = isAgenteEnabled;

            if (service === 'gemini') {
                if (!geminiClient) throw new Error("Google Gemini client not initialized.");
                if (!chat) throw new Error("Chat session not initialized for Gemini. This should be handled by useEffect.");
                
                activeLLMClient = geminiClient;
                activeLLMModel = 'gemini-2.5-pro';
                // Tools and system instruction are already configured in chat useEffect based on `isAgentModeSelected`.
                activeLlmTools = (chat as any).config.tools;
                activeSystemInstruction = (chat as any).config.systemInstruction;
                isLLMGemini = true;

            } else if (service === 'openai') {
                if (!openaiClient) throw new Error("OpenAI client not initialized.");
                
                activeLLMClient = openaiClient;
                activeLLMModel = 'gpt-4o'; // Use a powerful OpenAI model

                if (isAgentModeSelected) {
                    activeLlmTools = [
                        { type: 'function', function: callExternalAgentWithQuery_OpenAI }, 
                        { type: 'function', function: callExternalAgentWithData_OpenAI }
                    ];
                    activeSystemInstruction = agenteOrchestratorSystemInstruction;
                } else { // Direct OpenAI mode
                    activeLlmTools = [
                        { type: 'function', function: executeQueryOnDatabase_OpenAI },
                        { type: 'function', function: getAggregateData_OpenAI },
                        { type: 'function', function: performAction_OpenAI }
                    ];
                    activeSystemInstruction = directSupabaseSystemInstruction;
                }

                // Build OpenAI message history for stateless calls.
                // It's crucial to map messages to OpenAI's expected format correctly,
                // especially for tool calls and responses.
                openaiMessagesHistory = messages.map(msg => {
                    if (msg.sender === 'user') {
                        return { role: 'user', content: msg.content as string };
                    } else if (msg.sender === 'ai' && typeof msg.content === 'object') {
                        const aiContent = msg.content as AIResponse;
                        // If the previous AI message had tool_calls, include them for OpenAI history
                        if (msg.tool_calls && msg.tool_calls.length > 0) {
                            return { role: 'assistant', content: aiContent.displayText || null, tool_calls: msg.tool_calls };
                        }
                        return { role: 'assistant', content: aiContent.displayText || '' };
                    }
                    return { role: 'assistant', content: msg.content as string }; // Fallback for simple string AI messages
                });
                openaiMessagesHistory.unshift({ role: 'system', content: activeSystemInstruction });
                openaiMessagesHistory.push({ role: 'user', content: prompt });
                isLLMGemini = false;

            } else {
                // This case should ideally not be reached with the updated AiService type.
                throw new Error(`Ningún servicio de IA (Gemini/OpenAI) configurado para el modo seleccionado: '${service}'.`);
            }

            // Check if the selected LLM is configured (has an API key)
            if ((service === 'gemini' && !geminiClient) || (service === 'openai' && !openaiClient)) {
                 throw new Error(`El servicio de IA (${service}) no está configurado con una clave API válida. Por favor, revisa la sección de configuración.`);
            }


            // --- 2. Make the initial LLM call ---
            let responseFromLLM: any;
            if (isLLMGemini) {
                // Gemini handles message history internally via the `chat` object
                responseFromLLM = await (chat as Chat).sendMessage({ message: prompt });
            } else { // OpenAI (activeLLMClient is openaiClient)
                const completion = await activeLLMClient.chat.completions.create({
                    model: activeLLMModel,
                    messages: openaiMessagesHistory,
                    tools: activeLlmTools,
                    tool_choice: 'auto',
                    response_format: { type: "json_object" }
                });
                responseFromLLM = completion.choices[0].message;
            }

            // --- 3. Handle function/tool calls in a loop ---
            let toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || [];
            let functionResponseProcessed = false; // Flag to indicate if any tool was called
            let lastToolResponses: any[] = []; // Stores raw results from tool functions (e.g., direct agent JSON or {functionResponse: ...})

            while (toolCalls && toolCalls.length > 0) {
                functionResponseProcessed = true;
                const toolExecutionPromises = toolCalls.map(async (call: any) => {
                    const functionName = call.name || call.function?.name;
                    // OpenAI's arguments are stringified JSON in call.function.arguments
                    const functionArgs = call.args || (call.function?.arguments ? JSON.parse(call.function.arguments) : {});
                    const toolCallId = call.id || call.tool_call_id; // Get the ID for the response

                    if (agenteClient && (functionName === 'callExternalAgentWithQuery' || functionName === 'callExternalAgentWithData')) {
                        let payload: string | object;
                        if (functionName === 'callExternalAgentWithQuery') {
                            payload = functionArgs.query;
                            if (typeof payload !== 'string') throw new Error("Parámetro 'query' inválido para callExternalAgentWithQuery.");
                        } else { // callExternalAgentWithData
                            payload = functionArgs.data;
                            if (typeof payload !== 'object' || payload === null) throw new Error("Parámetro 'data' inválido para callExternalAgentWithData.");
                        }

                        // --- Retry logic for external agent calls ---
                        for (let attempt = 0; attempt <= MAX_AGENT_RETRIES; attempt++) {
                            try {
                                const rawAgentResponse = await agenteClient.sendToAgent(payload, agenteWebhookUrl);
                                // Ensure the response is actually an object before returning
                                if (typeof rawAgentResponse !== 'object' || rawAgentResponse === null) {
                                    throw new Error("Respuesta del agente externo no es un objeto JSON válido.");
                                }
                                return rawAgentResponse; // Success, return the raw response
                            } catch (retryError: any) {
                                console.error(`Intento ${attempt + 1}/${MAX_AGENT_RETRIES + 1} fallido para la llamada al agente:`, retryError.message);
                                if (attempt < MAX_AGENT_RETRIES) {
                                    await sleep(RETRY_DELAY_MS * (attempt + 1)); // Exponential backoff
                                } else {
                                    // All retries exhausted, throw a specific error
                                    throw new Error("AGENT_EXTERNAL_FAILED_AFTER_RETRIES");
                                }
                            }
                        }
                        // This line should technically not be reached, but needed for TypeScript
                        throw new Error("Ruta de error inesperada para la llamada al agente."); 

                    } else if (!isAgentModeSelected) { // Direct Supabase tools, ONLY if NOT in agent mode
                        // handleFunctionExecution returns { functionResponse: { id, name, response: { result: JSON_STRING } } }
                        const toolResult = await handleFunctionExecution({ name: functionName, args: functionArgs, id: toolCallId }, supabase);
                        // Ensure the result is correctly formatted to be a JSON string for the LLM.
                        const resultString = typeof toolResult === 'object' && toolResult !== null
                            ? (toolResult.functionResponse?.response?.result || JSON.stringify(toolResult))
                            : String(toolResult);
                        
                        return { 
                            functionResponse: { 
                                id: toolCallId || 'no-id', 
                                name: functionName, 
                                response: { result: resultString } 
                            } 
                        };
                    } else {
                        throw new Error(`Función '${functionName}' no soportada o no implementada para el modo agente con ${isLLMGemini ? 'Gemini' : 'OpenAI'} como orquestador.`);
                    }
                });

                lastToolResponses = await Promise.all(toolExecutionPromises); // These are the raw results from the tools

                if (isLLMGemini) { // Gemini client is the orchestrator
                    const geminiFormattedToolResponses = toolCalls.map((originalCall: any, i: number) => {
                        const toolExecutionResult = lastToolResponses[i]; // This is the raw output from the tool
                        
                        // Ensure the `result` property of the function response is always a stringified JSON.
                        const resultString = typeof toolExecutionResult === 'object' && toolExecutionResult !== null
                            ? JSON.stringify(toolExecutionResult) 
                            : String(toolExecutionResult);
                        
                        return {
                            functionResponse: {
                                name: originalCall.name,
                                id: originalCall.id,
                                response: { result: resultString },
                            }
                        };
                    });
                    responseFromLLM = await (chat as Chat).sendMessage({ parts: geminiFormattedToolResponses });
                } else { // OpenAI client is the orchestrator
                    const newToolMessages = toolCalls.map((call: any, i: number) => {
                        const toolExecutionResult = lastToolResponses[i]; // This is the raw output from the tool
                        // Content for the tool message depends on whether it was an external agent call or a direct Supabase tool call.
                        // Ensure the `content` property for OpenAI tool messages is a stringified JSON.
                        const contentString = (typeof toolExecutionResult === 'object' && toolExecutionResult !== null)
                            ? (toolExecutionResult.functionResponse?.response?.result || JSON.stringify(toolExecutionResult))
                            : String(toolExecutionResult);

                        return {
                            tool_call_id: call.id || call.tool_call_id,
                            role: 'tool',
                            name: call.function?.name || call.name,
                            content: contentString
                        };
                    });
                    
                    openaiMessagesHistory.push(responseFromLLM); // Add AI's tool call request to history
                    openaiMessagesHistory.push(...newToolMessages); // Add tool outputs to history
                    
                    const completion = await activeLLMClient.chat.completions.create({
                        model: activeLLMModel,
                        messages: openaiMessagesHistory,
                        tools: activeLlmTools,
                        tool_choice: 'auto',
                        response_format: { type: "json_object" }
                    });
                    responseFromLLM = completion.choices[0].message;
                }
                toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || []; // Update for next iteration
            }

            // --- 4. Process Final Response ---
            let finalResponseContent: string = responseFromLLM.text || responseFromLLM.content;
            let parsedAIResponse: AIResponse | null = null;

            if (isAgentModeSelected && functionResponseProcessed && lastToolResponses.length > 0) {
                // If agent was called, map its raw response (the *last* tool response) to AIResponse
                const actualAgentResponse = lastToolResponses[lastToolResponses.length - 1];
                // Ensure actualAgentResponse is a valid JSON object before mapping
                if (typeof actualAgentResponse === 'object' && actualAgentResponse !== null) {
                    parsedAIResponse = mapAgentResponseToAIResponse(actualAgentResponse);
                } else {
                    console.warn("Raw agent response was not a valid JSON object. Displaying as text. Response:", actualAgentResponse);
                    parsedAIResponse = { 
                        displayText: `He recibido una respuesta del agente, pero no es un JSON válido. Aquí está el contenido:\n\n---\n\n${String(actualAgentResponse)}`,
                        statusDisplay: { icon: 'error', title: 'Error de Formato', message: 'La respuesta del agente no es un objeto JSON válido.' }
                    };
                }
            } else {
                // For direct LLM responses or if agent mode was not active.
                // Use the LLM's final content directly and try to parse it as AIResponse.
                parsedAIResponse = extractAndParseJson(finalResponseContent);
            }

            if (parsedAIResponse) {
                const aiMessage: Message = { sender: 'ai', content: parsedAIResponse, tool_calls: responseFromLLM.tool_calls };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                console.warn("AI response was not valid JSON. Displaying as text. Response:", finalResponseContent);
                const fallbackMessage: Message = {
                    sender: 'ai', 
                    content: {
                        displayText: `He recibido una respuesta, pero no tiene el formato JSON esperado. Aquí está el texto original:\n\n---\n\n${finalResponseContent}`,
                        statusDisplay: { icon: 'error', title: 'Error de Formato', message: 'La respuesta de la IA no es un JSON válido.' }
                    }
                };
                setMessages(prev => [...prev, fallbackMessage]);
            }

        } catch (error: any) {
            console.error("Error getting AI response:", error);
            let userFacingMessage = `Lo siento, ocurrió un error: ${error.message}`;
            let statusDisplay: ConfirmationMessage = { icon: 'error', title: 'Error General', message: userFacingMessage };

            if (error.message === "AGENT_EXTERNAL_FAILED_AFTER_RETRIES") {
                userFacingMessage = "Lo siento, el agente externo no pudo procesar tu solicitud después de varios intentos. Por favor, inténtalo de nuevo más tarde o reformula tu pregunta. Si el problema persiste, contacta a soporte técnico.";
                statusDisplay = { icon: 'error', title: 'Error de Conexión', message: userFacingMessage };
            } else if (error.message.includes("ContentUnion is required")) {
                 userFacingMessage = "Lo siento, hubo un problema al procesar la respuesta de la IA. Parece que el formato de los datos no es el esperado. Por favor, intenta reformular tu pregunta o notifica a soporte.";
                 statusDisplay = { icon: 'error', title: 'Error de Formato Interno', message: userFacingMessage };
            } else if (error.message.includes("client not initialized") || error.message.includes("not configured with a valid API key")) {
                userFacingMessage = `El servicio de IA (${service}) no está configurado o no tiene una clave API válida. Por favor, revisa la sección de configuración.`;
                statusDisplay = { icon: 'error', title: 'Error de Configuración', message: userFacingMessage };
            }

            const errorMessage: Message = { 
                sender: 'ai', 
                content: {
                    displayText: userFacingMessage,
                    statusDisplay: statusDisplay
                } 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, supabase, chat, service, geminiClient, openaiClient, agenteClient, isAgenteEnabled, agenteWebhookUrl, messages]);
    
    const clearUnread = () => {
        setHasUnreadMessage(false);
    }

    const value = {
        messages,
        isLoading,
        hasUnreadMessage,
        sendMessage,
        setHasUnreadMessage,
        clearUnread
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
