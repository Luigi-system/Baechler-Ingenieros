import React, { createContext, useState, useContext, useCallback } from 'react';
import { useSupabase } from './SupabaseContext';
import { getAIInsight } from '../services/aiService';
import type { AIResponse } from '../types';

export interface Message {
  sender: 'user' | 'ai';
  content: string | AIResponse;
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

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const [messages, setMessages] = useState<Message[]>([
        { 
            sender: 'ai', 
            content: { 
                displayText: '¡Hola! Soy tu asistente de datos. ¿En qué puedo ayudarte hoy?',
                suggestions: ["Muéstrame los 5 reportes de servicio más recientes", "¿Cuántas empresas hay en total?", "Crea un gráfico de reportes por empresa"]
            } 
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

    const sendMessage = useCallback(async (prompt: string) => {
        if (prompt.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            if (!supabase) throw new Error("La conexión a Supabase no está disponible.");
            
            const aiResponse = await getAIInsight(prompt, supabase);
            const aiMessage: Message = { sender: 'ai', content: aiResponse };
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
    }, [isLoading, supabase]);
    
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