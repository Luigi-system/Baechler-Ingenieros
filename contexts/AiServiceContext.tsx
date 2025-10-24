
import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useSupabase } from './SupabaseContext';

export type AiService = 'gemini' | 'openai';

interface AiApiKeys {
    gemini?: string;
    openai?: string;
}

// Define a simple type for our custom fetch-based OpenAI client
interface OpenAiClient {
    chat: {
        completions: {
            create: (payload: any) => Promise<any>;
        };
    };
}

interface AiServiceContextType {
    service: AiService;
    setService: (service: AiService) => void;
    isConfigured: (service: AiService) => boolean;
    geminiClient: GoogleGenAI | null;
    openaiClient: OpenAiClient | null;
    apiKeys: AiApiKeys;
    updateApiKeys: (keys: AiApiKeys) => Promise<{error: Error | null}>;
}

const AiServiceContext = createContext<AiServiceContextType | undefined>(undefined);

export const AiServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const [service, setServiceState] = useState<AiService>('gemini');
    const [apiKeys, setApiKeys] = useState<AiApiKeys>({});
    const [geminiClient, setGeminiClient] = useState<GoogleGenAI | null>(null);
    const [openaiClient, setOpenaiClient] = useState<OpenAiClient | null>(null);

    const fetchKeys = useCallback(async () => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('Configuracion')
            .select('value')
            .eq('key', 'ai_api_keys')
            .is('id_usuario', null)
            .maybeSingle();
        if (error) {
            console.warn("Could not fetch AI API keys:", error.message);
        } else if (data && data.value) {
            try {
                const keys = JSON.parse(data.value);
                setApiKeys(keys);
            } catch (e) {
                console.error("Failed to parse AI API keys JSON from DB.", e);
            }
        }
    }, [supabase]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    useEffect(() => {
        const storedService = localStorage.getItem('ai_service') as AiService | null;
        if (storedService) {
            setServiceState(storedService);
        }
    }, []);

    useEffect(() => {
        const geminiKey = apiKeys.gemini;
        if (geminiKey) {
            try {
                setGeminiClient(new GoogleGenAI({ apiKey: geminiKey }));
            } catch (e) {
                console.error("Failed to initialize GoogleGenAI client:", e);
                setGeminiClient(null);
            }
        } else {
            setGeminiClient(null);
        }
    }, [apiKeys.gemini]);

    // Effect to initialize the OpenAI client when its API key changes
    useEffect(() => {
        const openaiKey = apiKeys.openai;
        if (openaiKey) {
            const client: OpenAiClient = {
                chat: {
                    completions: {
                        create: async (payload: any) => {
                            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${openaiKey}`
                                },
                                body: JSON.stringify(payload)
                            });
                            if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error?.message || 'OpenAI API request failed');
                            }
                            return response.json();
                        }
                    }
                }
            };
            setOpenaiClient(client);
        } else {
            setOpenaiClient(null);
        }
    }, [apiKeys.openai]);

    const setService = (newService: AiService) => {
        localStorage.setItem('ai_service', newService);
        setServiceState(newService);
    };

    const isConfigured = (serviceToCheck: AiService): boolean => {
        return !!apiKeys[serviceToCheck];
    };

    const updateApiKeys = async (newKeys: AiApiKeys): Promise<{error: Error | null}> => {
        const optimisticKeys = { ...apiKeys, ...newKeys };
        setApiKeys(optimisticKeys);
        if (!supabase) {
            const error = new Error("Supabase client not available");
            return { error };
        }
        
        try {
            const { data: existing, error: selectError } = await supabase
                .from('Configuracion')
                .select('id')
                .eq('key', 'ai_api_keys')
                .is('id_usuario', null)
                .maybeSingle();

            if (selectError) throw selectError;

            const keysToSave = optimisticKeys;
            if (existing) {
                const { error: updateError } = await supabase
                    .from('Configuracion')
                    .update({ value: JSON.stringify(keysToSave) })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('Configuracion')
                    .insert({ key: 'ai_api_keys', value: JSON.stringify(keysToSave), id_usuario: null });
                if (insertError) throw insertError;
            }
            return { error: null };
        } catch (error: any) {
            console.error("Failed to save API keys to DB:", error);
            fetchKeys();
            return { error };
        }
    };
    
    const value = useMemo(() => ({ service, setService, isConfigured, geminiClient, openaiClient, apiKeys, updateApiKeys }), [service, geminiClient, openaiClient, apiKeys]);

    return (
        <AiServiceContext.Provider value={value}>
            {children}
        </AiServiceContext.Provider>
    );
};

export const useAiService = (): AiServiceContextType => {
    const context = useContext(AiServiceContext);
    if (!context) {
        throw new Error('useAiService must be used within an AiServiceProvider');
    }
    return context;
};
