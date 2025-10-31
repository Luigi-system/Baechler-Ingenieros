

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useSupabase } from './SupabaseContext';
import type { AiServiceContextType, AiService, AiApiKeys, OpenAiClient } from '../types';

const AiServiceContext = createContext<AiServiceContextType | undefined>(undefined);

const DEFAULT_N8N_WEBHOOK_URL = '';

export const AiServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const [service, setServiceState] = useState<AiService>('gemini');
    const [apiKeys, setApiKeys] = useState<AiApiKeys>({});
    const [n8nWebhookUrl, setN8nWebhookUrlState] = useState<string>(DEFAULT_N8N_WEBHOOK_URL);
    
    const [geminiClient, setGeminiClient] = useState<GoogleGenAI | null>(null);
    const [openaiClient, setOpenaiClient] = useState<OpenAiClient | null>(null);

    const fetchConfigs = useCallback(async () => {
        if (!supabase) return;

        const { data: apiKeysData, error: apiKeysError } = await supabase
            .from('Configuracion')
            .select('value')
            .eq('key', 'ai_api_keys')
            .is('id_usuario', null)
            .maybeSingle();
        if (apiKeysError) {
            console.warn("Could not fetch AI API keys:", apiKeysError.message);
        } else if (apiKeysData && apiKeysData.value) {
            try {
                setApiKeys(JSON.parse(apiKeysData.value));
            } catch (e) {
                console.error("Failed to parse AI API keys JSON from DB.", e);
            }
        }

        const { data: webhookData, error: webhookError } = await supabase
            .from('Configuracion')
            .select('value')
            .eq('key', 'n8n_webhook_url')
            .is('id_usuario', null)
            .maybeSingle();
        if (webhookError) {
            console.warn("Could not fetch N8N webhook URL:", webhookError.message);
        } else if (webhookData && webhookData.value) {
            try {
                const parsedUrl = JSON.parse(webhookData.value)?.webhookUrl;
                if (parsedUrl) setN8nWebhookUrlState(parsedUrl);
            } catch (e) {
                console.error("Failed to parse N8N webhook URL JSON from DB.", e);
            }
        }
    }, [supabase]);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    useEffect(() => {
        const storedService = localStorage.getItem('ai_service') as AiService | null;
        if (storedService && ['gemini', 'openai', 'n8n'].includes(storedService)) {
            setServiceState(storedService);
        } else {
            setServiceState('gemini');
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
        if (['gemini', 'openai', 'n8n'].includes(newService)) {
            localStorage.setItem('ai_service', newService);
            setServiceState(newService);
        } else {
            console.warn(`Attempted to set invalid AI service: ${newService}`);
        }
    };

    const isConfigured = useCallback((serviceToCheck: AiService): boolean => {
        if (serviceToCheck === 'gemini') return !!apiKeys.gemini;
        if (serviceToCheck === 'openai') return !!apiKeys.openai;
        if (serviceToCheck === 'n8n') return !!n8nWebhookUrl;
        return false;
    }, [apiKeys, n8nWebhookUrl]);

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
            fetchConfigs(); // Revert to fetched state on error
            return { error };
        }
    };

    const updateN8nWebhookUrl = async (newUrl: string): Promise<{error: Error | null}> => {
        setN8nWebhookUrlState(newUrl); // Optimistic update
        if (!supabase) {
            const error = new Error("Supabase client not available");
            return { error };
        }

        try {
            const { data: existing, error: selectError } = await supabase
                .from('Configuracion')
                .select('id')
                .eq('key', 'n8n_webhook_url')
                .is('id_usuario', null)
                .maybeSingle();
            
            if (selectError) throw selectError;
            
            const urlToSave = { webhookUrl: newUrl };
            if (existing) {
                const { error: updateError } = await supabase
                    .from('Configuracion')
                    .update({ value: JSON.stringify(urlToSave) })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('Configuracion')
                    .insert({ key: 'n8n_webhook_url', value: JSON.stringify(urlToSave), id_usuario: null });
                if (insertError) throw insertError;
            }
            return { error: null };
        } catch (error: any) {
            console.error("Failed to save N8N webhook URL to DB:", error);
            fetchConfigs(); // Revert to fetched state on error
            return { error };
        }
    };
    
    const value = useMemo(() => ({ 
        service, 
        setService, 
        isConfigured, 
        geminiClient, 
        openaiClient, 
        apiKeys, 
        n8nWebhookUrl, 
        updateApiKeys, 
        updateN8nWebhookUrl 
    }), [service, isConfigured, geminiClient, openaiClient, apiKeys, n8nWebhookUrl, updateApiKeys, updateN8nWebhookUrl]);

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