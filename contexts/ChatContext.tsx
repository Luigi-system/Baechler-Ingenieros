import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { useSupabase } from './SupabaseContext';
import { useAiService } from './AiServiceContext';
import { 
    systemInstruction, responseSchema, 
    executeQueryOnDatabase, getAggregateData, performAction,
    handleFunctionExecution
} from '../services/aiService';
import type { AIResponse } from '../types';

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

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const { service, geminiClient, openaiClient, isConfigured } = useAiService();
    const [chat, setChat] = useState<Chat | null>(null);

    const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

    useEffect(() => {
        if (service === 'gemini' && geminiClient) {
            try {
                const geminiTools = [{ functionDeclarations: [executeQueryOnDatabase, getAggregateData, performAction] }];
                const geminiConfig = {
                    tools: geminiTools,
                    systemInstruction: systemInstruction,
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                };

                const newChat = geminiClient.chats.create({
                    model: 'gemini-2.5-pro',
                    config: geminiConfig,
                });
                setChat(newChat);
                if (messages.length > 1) setMessages([WELCOME_MESSAGE]);
            } catch (e) {
                console.error("Failed to create Gemini chat session:", e);
                setChat(null);
            }
        } else if (service === 'openai') {
            // OpenAI is stateless, so we nullify the stateful chat object.
            setChat(null);
            if (messages.length > 1) setMessages([WELCOME_MESSAGE]);
        } else {
            setChat(null);
        }
    }, [service, geminiClient]);

    const sendMessage = useCallback(async (prompt: string) => {
        if (prompt.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (!supabase) throw new Error("La conexión a Supabase no está disponible.");

            let finalResponse;

            if (service === 'gemini' && chat) {
                let result = await chat.sendMessage({ message: prompt });
                while (result.functionCalls && result.functionCalls.length > 0) {
                    const functionCalls = result.functionCalls;
                    const toolExecutionPromises = functionCalls.map(call => handleFunctionExecution(call, supabase));
                    const toolResponseParts = await Promise.all(toolExecutionPromises);
                    result = await chat.sendMessage({ message: toolResponseParts });
                }
                finalResponse = result.text;

            } else if (service === 'openai' && openaiClient) {
                // 1. Convert tools and history to OpenAI format
                const openaiTools = [executeQueryOnDatabase, getAggregateData, performAction].map(tool => ({ type: 'function', function: tool }));
                const history = messages.map(msg => {
                    if (msg.sender === 'user') return { role: 'user', content: msg.content as string };
                    // For AI, just send the text response for history context.
                    return { role: 'assistant', content: (msg.content as AIResponse).displayText };
                });

                // 2. Make initial request
                let response = await openaiClient.chat.completions.create({
                    model: 'gpt-4o',
                    messages: [...history, { role: 'user', content: prompt }],
                    tools: openaiTools,
                    tool_choice: 'auto',
                });
                
                let responseMessage = response.choices[0].message;

                // 3. Handle tool calls if any
                while (responseMessage.tool_calls) {
                    const toolCalls = responseMessage.tool_calls;
                    const functionCallPromises = toolCalls.map((tc: any) => 
                        handleFunctionExecution({name: tc.function.name, args: JSON.parse(tc.function.arguments)}, supabase)
                    );
                    const toolResponses = await Promise.all(functionCallPromises);
                    
                    // Add AI's tool call request and our tool responses to the history
                    const newHistory = [
                        ...history,
                        { role: 'user', content: prompt },
                        responseMessage,
                        ...toolResponses.map((tr, i) => ({
                            tool_call_id: toolCalls[i].id,
                            role: 'tool',
                            name: toolCalls[i].function.name,
                            content: tr.functionResponse.response.result
                        }))
                    ];
                    
                    // Make a follow-up request with the tool responses
                    response = await openaiClient.chat.completions.create({
                        model: 'gpt-4o',
                        messages: newHistory,
                        tools: openaiTools,
                        tool_choice: 'auto',
                    });
                    responseMessage = response.choices[0].message;
                }

                finalResponse = responseMessage.content;
            } else {
                 throw new Error(`Servicio de IA (${service}) no está configurado o el cliente no está disponible.`);
            }

            if (!finalResponse) {
                throw new Error("La IA no generó una respuesta de texto.");
            }
        
            const parsedJson = JSON.parse(finalResponse);
            const aiMessage: Message = { sender: 'ai', content: parsedJson as AIResponse };
            setMessages(prev => [...prev, aiMessage]);

        } catch (error: any) {
            console.error("Error getting AI response:", error);
            const errorMessage: Message = { 
                sender: 'ai', 
                content: {
                    displayText: `Lo siento, ocurrió un error: ${error.message}`
                } 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, supabase, chat, service, openaiClient, messages]);
    
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