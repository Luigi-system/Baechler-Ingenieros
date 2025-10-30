

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useSupabase } from './SupabaseContext';
import { AgenteClient, createAgenteClient } from '../services/agenteService';
import type { AiServiceContextType, AiService, AiApiKeys, OpenAiClient } from '../types'; // FIX: Import OpenAiClient from types.ts

const AiServiceContext = createContext<AiServiceContextType | undefined>(undefined);

const DEFAULT_AGENTE_WEBHOOK_URL = 'https://hook.us2.make.com/d81q23ojiyenuysslld4naomb6q4be2r';

export const AiServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    const [service, setServiceState] = useState<AiService>('gemini'); // Now only 'gemini' or 'openai'
    const [apiKeys, setApiKeys] = useState<AiApiKeys>({});
    const [agenteWebhookUrl, setAgenteWebhookUrlState] = useState<string>(DEFAULT_AGENTE_WEBHOOK_URL);
    
    const [geminiClient, setGeminiClient] = useState<GoogleGenAI | null>(null);
    const [openaiClient, setOpenaiClient] = useState<OpenAiClient | null>(null);
    const [agenteClient, setAgenteClient] = useState<AgenteClient | null>(null);

    // isAgenteEnabled is now derived from agenteWebhookUrl
    const isAgenteEnabled = useMemo(() => !!agenteWebhookUrl, [agenteWebhookUrl]);

    // Fetch all configurations on mount (API keys and Agente webhook URL)
    const fetchConfigs = useCallback(async () => {
        if (!supabase) return;

        // Fetch AI API keys
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

        // Fetch Agente webhook URL
        const { data: webhookData, error: webhookError } = await supabase
            .from('Configuracion')
            .select('value')
            .eq('key', 'agente_webhook_url')
            .is('id_usuario', null)
            .maybeSingle();
        if (webhookError) {
            console.warn("Could not fetch Agente webhook URL:", webhookError.message);
        } else if (webhookData && webhookData.value) {
            try {
                const parsedUrl = JSON.parse(webhookData.value)?.webhookUrl;
                if (parsedUrl) setAgenteWebhookUrlState(parsedUrl);
            } catch (e) {
                console.error("Failed to parse Agente webhook URL JSON from DB.", e);
            }
        }
    }, [supabase]);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    // Load selected AI service from local storage
    useEffect(() => {
        const storedService = localStorage.getItem('ai_service') as AiService | null;
        if (storedService && (storedService === 'gemini' || storedService === 'openai')) { // Ensure it's a valid service
            setServiceState(storedService);
        } else {
            setServiceState('gemini'); // Default to gemini if stored value is invalid or 'agente'
        }
    }, []);

    // Initialize Gemini client when API key changes
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

    // Initialize OpenAI client when API key changes
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

    // Initialize Agente client when webhook URL changes
    useEffect(() => {
        if (agenteWebhookUrl) {
            // No direct dependencies on specific keys for AgenteClient, it's generic
            setAgenteClient(createAgenteClient());
        } else {
            setAgenteClient(null);
        }
    }, [agenteWebhookUrl]);


    // Set selected AI service and persist to local storage
    const setService = (newService: AiService) => {
        // Only allow valid AI service types to be set
        if (newService === 'gemini' || newService === 'openai') {
            localStorage.setItem('ai_service', newService);
            setServiceState(newService);
        } else {
            console.warn(`Attempted to set invalid AI service: ${newService}`);
        }
    };

    // Check if a service is configured (has an API key or webhook URL)
    const isConfigured = useCallback((serviceToCheck: AiService): boolean => {
        if (serviceToCheck === 'gemini') return !!apiKeys.gemini;
        if (serviceToCheck === 'openai') return !!apiKeys.openai;
        // 'agente' is now checked via 'isAgenteEnabled', not as a direct service type
        return false;
    }, [apiKeys]);

    // Update AI API keys (Gemini/OpenAI) and persist to DB
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

    // Update Agente webhook URL and persist to DB
    const updateAgenteWebhookUrl = async (newUrl: string): Promise<{error: Error | null}> => {
        setAgenteWebhookUrlState(newUrl); // Optimistic update
        if (!supabase) {
            const error = new Error("Supabase client not available");
            return { error };
        }

        try {
            const { data: existing, error: selectError } = await supabase
                .from('Configuracion')
                .select('id')
                .eq('key', 'agente_webhook_url')
                .is('id_usuario', null)
                .maybeSingle();
            
            if (selectError) throw selectError;
            
            const urlToSave = { webhookUrl: newUrl }; // Store as an object
            if (existing) {
                const { error: updateError } = await supabase
                    .from('Configuracion')
                    .update({ value: JSON.stringify(urlToSave) })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('Configuracion')
                    .insert({ key: 'agente_webhook_url', value: JSON.stringify(urlToSave), id_usuario: null });
                if (insertError) throw insertError;
            }
            return { error: null };
        } catch (error: any) {
            console.error("Failed to save Agente webhook URL to DB:", error);
            fetchConfigs(); // Revert to fetched state on error
            return { error };
        }
    };
    
    const value = useMemo(() => ({ 
        service, 
        setService, 
        isConfigured, 
        isAgenteEnabled, // Expose new state
        geminiClient, 
        openaiClient, 
        agenteClient, 
        apiKeys, 
        agenteWebhookUrl, 
        updateApiKeys, 
        updateAgenteWebhookUrl 
    }), [service, isConfigured, isAgenteEnabled, geminiClient, openaiClient, agenteClient, apiKeys, agenteWebhookUrl, updateApiKeys, updateAgenteWebhookUrl]); // Add updateApiKeys and updateAgenteWebhookUrl to dependencies

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