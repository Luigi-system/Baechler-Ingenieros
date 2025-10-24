import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { SendIcon, AssistantIcon, XIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useAiService } from '../../contexts/AiServiceContext';
import { getAIInsight } from '../../services/aiService';
import type { AIResponse, TableData } from '../../types';

interface Message {
  sender: 'user' | 'ai';
  content: string | AIResponse;
}

interface AssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimpleTable: React.FC<{ data: TableData }> = ({ data }) => {
    if (!data || !data.headers || !data.rows) return null;
    return (
        <div className="overflow-auto max-h-60 mt-3 border border-base-border rounded-lg custom-scrollbar">
            <table className="min-w-full text-sm">
                <thead className="bg-base-100 dark:bg-base-300 sticky top-0 z-10">
                    <tr>
                        {data.headers.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left font-semibold">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-base-border">
                    {data.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-base-100 dark:hover:bg-base-300/50">
                            {row.map((cell, j) => (
                                <td key={j} className="px-3 py-2 whitespace-pre-wrap">{String(cell)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const Assistant: React.FC<AssistantProps> = ({ isOpen, onClose }) => {
  const { supabase } = useSupabase();
  const { service, isConfigured } = useAiService();
  const [messages, setMessages] = useState<Message[]>([
    { 
        sender: 'ai', 
        content: { 
            displayText: '¡Hola! Soy tu asistente de datos. ¿En qué puedo ayudarte hoy?',
            suggestions: ["Muéstrame los 5 reportes de servicio más recientes", "¿Cuántas empresas hay en total?", "Crea un listado de máquinas y sus modelos"]
        } 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSend = useCallback(async (prompt: string) => {
    if (prompt.trim() === '' || isLoading) return;

    const userMessage: Message = { sender: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
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

  if (!isOpen) return null;

  const assistantContent = () => {
    if (!isConfigured(service)) {
        return (
            <div className="flex flex-col h-full justify-center items-center text-center p-4">
                <h3 className="text-lg font-semibold">Servicio No Configurado</h3>
                <p className="text-neutral mt-2 text-sm">
                    El servicio de IA ('{service}') no está configurado.
                    <br />
                    Por favor, ve a Configuración &gt; Servicios de IA para seleccionarlo y asegúrate que la API Key esté disponible.
                </p>
            </div>
        );
    }
    return (
        <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
                {messages.map((msg, index) => {
                    const isUser = msg.sender === 'user';
                    const content = msg.content;
                    if (isUser && typeof content === 'string') {
                        return (
                          <div key={index} className="flex justify-end">
                            <div className="max-w-sm px-4 py-2 rounded-2xl bg-primary text-white rounded-br-none">{content}</div>
                          </div>
                        );
                    }
                    if (!isUser && typeof content === 'object') {
                        const aiContent = content as AIResponse;
                        return (
                          <div key={index} className="flex items-start gap-3 justify-start">
                             <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><AssistantIcon className="h-5 w-5 text-white"/></div>
                            <div className="max-w-sm p-3 rounded-2xl bg-base-300 rounded-bl-none w-full">
                                <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert text-base-content"><ReactMarkdown>{aiContent.displayText}</ReactMarkdown></div>
                                {aiContent.table && <SimpleTable data={aiContent.table} />}
                                {aiContent.suggestions && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {aiContent.suggestions.map((s, i) => (
                                        <button key={i} onClick={() => handleSend(s)} className="px-2.5 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors">
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                )}
                            </div>
                          </div>
                        );
                    }
                    return null;
                })}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"><AssistantIcon className="h-5 w-5 text-white"/></div>
                        <div className="max-w-sm p-3 rounded-2xl bg-base-300 rounded-bl-none">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse"></div>
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 rounded-full bg-neutral animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-base-border shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend(input)}
                        placeholder="Ej: ¿Cuántos reportes hay?"
                        className="w-full pl-4 pr-12 py-3 bg-base-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary input-style"
                        disabled={isLoading}
                    />
                    <button onClick={() => handleSend(input)} disabled={isLoading || !input} className="absolute inset-y-0 right-0 flex items-center justify-center w-12 h-full text-primary disabled:text-neutral transition-colors">
                        <SendIcon className="h-6 w-6"/>
                    </button>
                </div>
            </div>
        </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-end p-4" onClick={onClose}>
        <div 
            className="bg-base-200 rounded-xl shadow-2xl w-full max-w-md h-[85vh] flex flex-col animate-slide-in-up" 
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-4 border-b border-base-border shrink-0">
                <h2 className="text-lg font-semibold text-base-content">Asistente IA</h2>
                <button onClick={onClose} className="p-1 rounded-full text-neutral hover:bg-base-300">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            {assistantContent()}
        </div>
    </div>
  );
};

export default Assistant;
