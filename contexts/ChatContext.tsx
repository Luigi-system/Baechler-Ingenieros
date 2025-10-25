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
import type { AIResponse, TableData } from '../types';

export interface Message {
  sender: 'user' | 'ai';
  content: string | AIResponse;
  // Add properties for OpenAI tool calls
  tool_calls?: any[];
  tool_call_id?: string;
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
    // Check if the response is directly an AIResponse (e.g., from an action confirmation)
    if (rawAgentResponse && typeof rawAgentResponse === 'object' && rawAgentResponse.displayText) {
        return rawAgentResponse as AIResponse;
    }

    let displayText = "Aquí tienes la información solicitada:";
    let table: TableData | undefined;
    let suggestions: string[] = ["¿Hay algo más en lo que pueda ayudarte?"];

    // Example mapping for a common agent response structure like {"maquinas": [...]}
    const keys = Object.keys(rawAgentResponse);
    if (keys.length === 1 && Array.isArray(rawAgentResponse[keys[0]])) {
        const dataArray = rawAgentResponse[keys[0]];
        const entityName = keys[0]; // e.g., "maquinas"

        if (dataArray.length > 0) {
            displayText = `Encontré ${dataArray.length} ${entityName}.`;
            const headers = Object.keys(dataArray[0]);
            const rows = dataArray.map((item: any) => headers.map(header => item[header]));
            table = { headers, rows };
            suggestions = [`Ver detalles de la primera ${entityName}`, `Filtrar ${entityName} por...`];
        } else {
            displayText = `No se encontraron ${entityName} que coincidan con tu consulta.`;
        }
    } else if (rawAgentResponse.error) {
        displayText = `El agente reportó un error: ${rawAgentResponse.error.message || rawAgentResponse.error}`;
    } else if (rawAgentResponse.message) {
        displayText = rawAgentResponse.message; // Generic message
    } else {
        // Fallback for any other unexpected but valid JSON structure
        displayText = `Recibí una respuesta del agente, pero no pude interpretarla completamente. Contenido: ${JSON.stringify(rawAgentResponse, null, 2)}`;
    }

    return { displayText, table, suggestions };
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
                    activeLlmTools = [{ type: 'function', function: callExternalAgentWithQuery_OpenAI }, { type: 'function', function: callExternalAgentWithData_OpenAI }];
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
                openaiMessagesHistory = messages.map(msg => {
                    if (msg.sender === 'user') {
                        return { role: 'user', content: msg.content as string };
                    } else if (typeof msg.content === 'object') {
                        const aiContent = msg.content as AIResponse;
                        // Correctly handle previous tool calls in history
                        if (msg.tool_calls && msg.tool_calls.length > 0) {
                            return { role: 'assistant', content: aiContent.displayText || null, tool_calls: msg.tool_calls };
                        }
                        return { role: 'assistant', content: aiContent.displayText || '' };
                    }
                    return { role: 'assistant', content: msg.content as string };
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
                responseFromLLM = await activeLLMClient.chat.completions.create({
                    model: activeLLMModel,
                    messages: openaiMessagesHistory,
                    tools: activeLlmTools,
                    tool_choice: 'auto',
                    response_format: { type: "json_object" }
                });
                responseFromLLM = responseFromLLM.choices[0].message;
            }

            // --- 3. Handle function/tool calls in a loop ---
            let toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || [];
            let functionResponseProcessed = false; // Flag to indicate if any tool was called
            let lastToolResponses: any[] = []; // Stores raw results from tool functions (e.g., direct agent JSON or {functionResponse: ...})
            let lastToolResultsForLLM: any[] = []; // Stores results formatted for LLM's `parts` (e.g., {name, id, response: {result}})

            while (toolCalls && toolCalls.length > 0) {
                functionResponseProcessed = true;
                const toolExecutionPromises = toolCalls.map(async (call: any) => {
                    const functionName = call.name || call.function?.name;
                    const functionArgs = call.args || JSON.parse(call.function?.arguments || '{}');
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
                        return await handleFunctionExecution({ name: functionName, args: functionArgs, id: toolCallId }, supabase);
                    } else {
                        throw new Error(`Función '${functionName}' no soportada o no implementada para el modo agente con ${isLLMGemini ? 'Gemini' : 'OpenAI'} como orquestador.`);
                    }
                });

                lastToolResponses = await Promise.all(toolExecutionPromises); // These are the raw results from the tools

                if (isLLMGemini) { // Gemini client is the orchestrator
                    lastToolResultsForLLM = toolCalls.map((originalCall: any, i: number) => {
                        const toolExecutionResult = lastToolResponses[i]; // This is the raw output from the tool
                        // All agent-related calls will return raw JSON from the agent, so we wrap it.
                        // Direct Supabase calls (if agent mode wasn't selected) return { functionResponse: ... }.
                        return {
                            name: originalCall.name,
                            id: originalCall.id,
                            response: { result: JSON.stringify(toolExecutionResult) }, // result must be stringified JSON
                        };
                    });
                    responseFromLLM = await (chat as Chat).sendMessage({ parts: lastToolResultsForLLM });
                } else { // OpenAI client is the orchestrator
                    const newToolMessages = toolCalls.map((call: any, i: number) => {
                        const toolExecutionResult = lastToolResponses[i]; // This is the raw output from the tool
                        // Content for the tool message depends on whether it was an external agent call or a direct Supabase tool call.
                        const content = (call.function?.name === 'callExternalAgentWithQuery' || call.function?.name === 'callExternalAgentWithData')
                            ? JSON.stringify(toolExecutionResult) // Raw JSON from agent
                            : toolExecutionResult.functionResponse.response.result; // Stringified JSON from handleFunctionExecution
                        
                        return {
                            tool_call_id: call.id || call.tool_call_id,
                            role: 'tool',
                            name: call.function?.name || call.name,
                            content: content
                        };
                    });
                    
                    openaiMessagesHistory.push(responseFromLLM); // Add AI's tool call request to history
                    openaiMessagesHistory.push(...newToolMessages); // Add tool outputs to history
                    
                    responseFromLLM = await activeLLMClient.chat.completions.create({
                        model: activeLLMModel,
                        messages: openaiMessagesHistory,
                        tools: activeLlmTools,
                        tool_choice: 'auto',
                        response_format: { type: "json_object" }
                    });
                    responseFromLLM = responseFromLLM.choices[0].message;
                }
                toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || []; // Update for next iteration
            }

            // --- 4. Process Final Response ---
            let finalResponseContent: string = responseFromLLM.text || responseFromLLM.content;
            let parsedAIResponse: AIResponse | null = null;

            if (isAgentModeSelected && functionResponseProcessed && lastToolResponses.length > 0) {
                // If agent was called, map its raw response (the *last* tool response) to AIResponse
                const actualAgentResponse = lastToolResponses[lastToolResponses.length - 1];
                parsedAIResponse = mapAgentResponseToAIResponse(actualAgentResponse);
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
                        displayText: `He recibido una respuesta, pero no tiene el formato JSON esperado. Aquí está el texto original:\n\n---\n\n${finalResponseContent}`
                    }
                };
                setMessages(prev => [...prev, fallbackMessage]);
            }

        } catch (error: any) {
            console.error("Error getting AI response:", error);
            let userFacingMessage = `Lo siento, ocurrió un error: ${error.message}`;

            if (error.message === "AGENT_EXTERNAL_FAILED_AFTER_RETRIES") {
                userFacingMessage = "Lo siento, el agente externo no pudo procesar tu solicitud después de varios intentos. Por favor, inténtalo de nuevo más tarde o reformula tu pregunta. Si el problema persiste, contacta a soporte técnico.";
            }

            const errorMessage: Message = { 
                sender: 'ai', 
                content: {
                    displayText: userFacingMessage
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