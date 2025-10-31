

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { useSupabase } from './SupabaseContext';
import { AuthContext } from './AuthContext';
import { useAiService } from './AiServiceContext';
import { 
    directSupabaseSystemInstruction, responseSchema, 
    executeQueryOnDatabase_Gemini, getAggregateData_Gemini, performAction_Gemini,
    executeQueryOnDatabase_OpenAI, getAggregateData_OpenAI, performAction_OpenAI,
    handleFunctionExecution
} from '../services/aiService';
import { consultarAgente } from '../services/agenteService';
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

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const auth = useContext(AuthContext);
    const { 
        service, geminiClient, openaiClient, 
        isConfigured, apiKeys, n8nWebhookUrl
    } = useAiService();
    const [chat, setChat] = useState<Chat | null>(null);

    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

    useEffect(() => {
        if (service === 'gemini' && geminiClient) {
            try {
                const geminiTools = [{ functionDeclarations: [executeQueryOnDatabase_Gemini, getAggregateData_Gemini, performAction_Gemini] }];
                const newChat = geminiClient.chats.create({
                    model: 'gemini-2.5-pro',
                    config: {
                        tools: geminiTools,
                        systemInstruction: directSupabaseSystemInstruction,
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
            setChat(null);
        }
        setMessages([WELCOME_MESSAGE]);
    }, [service, geminiClient]);

    const sendMessage = useCallback(async (prompt: string) => {
        if (prompt.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (!supabase) throw new Error("La conexión a Supabase no está disponible.");

            if (service === 'n8n') {
                if (!isConfigured('n8n')) {
                    throw new Error("N8N no está configurado. Por favor, añade la URL del Webhook en la configuración.");
                }

                const aiResponse = await consultarAgente(
                    prompt,
                    auth?.user?.nombres || 'Usuario desconocido',
                    n8nWebhookUrl
                );

                const aiMessage: Message = { sender: 'ai', content: aiResponse };
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
                return;
            }

            let responseFromLLM: any;
            const isLLMGemini = service === 'gemini';

            if (isLLMGemini) {
                if (!chat) throw new Error("Chat session not initialized for Gemini.");
                responseFromLLM = await chat.sendMessage({ message: prompt });
            } else { // OpenAI
                if (!openaiClient) throw new Error("OpenAI client not initialized.");
                const openaiMessagesHistory = messages.map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'assistant',
                    content: typeof msg.content === 'string' ? msg.content : (msg.content as AIResponse).displayText
                }));
                openaiMessagesHistory.unshift({ role: 'system', content: directSupabaseSystemInstruction });
                openaiMessagesHistory.push({ role: 'user', content: prompt });
                
                const completion = await openaiClient.chat.completions.create({
                    model: 'gpt-4o',
                    messages: openaiMessagesHistory,
                    tools: [
                        { type: 'function', function: executeQueryOnDatabase_OpenAI },
                        { type: 'function', function: getAggregateData_OpenAI },
                        { type: 'function', function: performAction_OpenAI }
                    ],
                    tool_choice: 'auto',
                    response_format: { type: "json_object" }
                });
                responseFromLLM = completion.choices[0].message;
            }

            let toolCalls = responseFromLLM.functionCalls || responseFromLLM.tool_calls || [];
            if (toolCalls && toolCalls.length > 0) {
                const toolExecutionPromises = toolCalls.map((call: any) => {
                    const functionName = call.name || call.function?.name;
                    const functionArgs = call.args || (call.function?.arguments ? JSON.parse(call.function.arguments) : {});
                    const toolCallId = call.id || call.tool_call_id;
                    return handleFunctionExecution({ name: functionName, args: functionArgs, id: toolCallId }, supabase);
                });

                const toolResponses = await Promise.all(toolExecutionPromises);

                if (isLLMGemini) {
                    responseFromLLM = await (chat as Chat).sendMessage({ message: toolResponses });
                } else {
                    const newToolMessages = toolResponses.map((res, i) => ({
                        tool_call_id: toolCalls[i].id,
                        role: 'tool',
                        name: toolCalls[i].function.name,
                        content: JSON.stringify(res.functionResponse.response.result)
                    }));
                    
                    const finalHistory = [
                        ...messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: typeof msg.content === 'string' ? msg.content : (msg.content as AIResponse).displayText })),
                        { role: 'user', content: prompt },
                        responseFromLLM,
                        ...newToolMessages,
                    ];
                    
                    const finalCompletion = await openaiClient.chat.completions.create({
                        model: 'gpt-4o',
                        messages: finalHistory,
                        response_format: { type: "json_object" }
                    });
                    responseFromLLM = finalCompletion.choices[0].message;
                }
            }

            const finalResponseContent: string = responseFromLLM.text || responseFromLLM.content;
            let parsedAIResponse: AIResponse | null = extractAndParseJson(finalResponseContent);

            if (parsedAIResponse) {
                setMessages(prev => [...prev, { sender: 'ai', content: parsedAIResponse, tool_calls: responseFromLLM.tool_calls }]);
            } else {
                setMessages(prev => [...prev, { sender: 'ai', content: { displayText: finalResponseContent } }]);
            }

        } catch (error: any) {
            console.error("Error getting AI response:", error);
            const errorMessage: Message = { 
                sender: 'ai', 
                content: {
                    displayText: `Lo siento, ocurrió un error: ${error.message}`,
                    statusDisplay: { icon: 'error', title: 'Error', message: error.message }
                } 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, supabase, chat, service, geminiClient, openaiClient, isConfigured, apiKeys, n8nWebhookUrl, messages, auth]);
    
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
