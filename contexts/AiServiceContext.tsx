

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useSupabase } from './SupabaseContext';
import type { AiServiceContextType, AiService, AiApiKeys, OpenAiClient, N8nSettings } from '../types';

const AiServiceContext = createContext<AiServiceContextType | undefined>(undefined);

const DEFAULT_N8N_SETTINGS: N8nSettings = {
    webhookUrl: '',
    method: 'GET',
    headers: {},
};
const DEFAULT_AUTOCOMPLETE_SERVICE: 'gemini' | 'openai' = 'gemini';

export const AiServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { supabase } = useSupabase();
    
    // States for Chat/Agent AI
    const [service, setServiceState] = useState<AiService>('gemini');
    const [n8nSettings, setN8nSettings] = useState<N8nSettings>(DEFAULT_N8N_SETTINGS);

    // States for Autocompletion AI
    const [autocompleteService, setAutocompleteServiceState] = useState<'gemini' | 'openai'>(DEFAULT_AUTOCOMPLETE_SERVICE);
    
    // Unified API Keys for all services (Gemini, OpenAI)
    const [apiKeys, setApiKeys] = useState<AiApiKeys>({});
    
    const [geminiClient, setGeminiClient] = useState<GoogleGenAI | null>(null);
    const [openaiClient, setOpenaiClient] = useState<OpenAiClient | null>(null);

    const fetchConfigs = useCallback(async () => {
        if (!supabase) return;

        // Fetch API Keys
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

        // Fetch N8N Settings
        const { data: n8nSettingsData, error: n8nSettingsError } = await supabase
            .from('Configuracion')
            .select('value')
            .eq('key', 'n8n_agent_settings')
            .is('id_usuario', null)
            .maybeSingle();
        if (n8nSettingsError) {
            console.warn("Could not fetch N8N agent settings:", n8nSettingsError.message);
        } else if (n8nSettingsData && n8nSettingsData.value) {
            try {
                const parsedSettings = JSON.parse(n8nSettingsData.value);
                setN8nSettings({ ...DEFAULT_N8N_SETTINGS, ...parsedSettings });
            } catch (e) {
                console.error("Failed to parse N8N agent settings JSON from DB.", e);
            }
        }
    }, [supabase]);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    // Load Chat/Agent service from local storage
    useEffect(() => {
        const storedService = localStorage.getItem('ai_service') as AiService | null;
        if (storedService && ['gemini', 'openai', 'n8n'].includes(storedService)) {
            setServiceState(storedService);
        } else {
            setServiceState('gemini');
        }
    }, []);

    // Load Autocompletion service from local storage
    useEffect(() => {
        const storedAutocompleteService = localStorage.getItem('ai_autocomplete_service') as 'gemini' | 'openai' | null;
        if (storedAutocompleteService && ['gemini', 'openai'].includes(storedAutocompleteService)) {
            setAutocompleteServiceState(storedAutocompleteService);
        } else {
            setAutocompleteServiceState(DEFAULT_AUTOCOMPLETE_SERVICE);
        }
    }, []);

    // Initialize Gemini Client
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

    // Initialize OpenAI Client
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

    // Setter for Chat/Agent service
    const setService = (newService: AiService) => {
        if (['gemini', 'openai', 'n8n'].includes(newService)) {
            localStorage.setItem('ai_service', newService);
            setServiceState(newService);
        } else {
            console.warn(`Attempted to set invalid AI service for chat: ${newService}`);
        }
    };

    // Setter for Autocompletion service
    const setAutocompleteService = (newService: 'gemini' | 'openai') => {
        if (['gemini', 'openai'].includes(newService)) {
            localStorage.setItem('ai_autocomplete_service', newService);
            setAutocompleteServiceState(newService);
        } else {
            console.warn(`Attempted to set invalid AI service for autocompletion: ${newService}`);
        }
    };

    // Check if Chat/Agent service is configured
    const isChatServiceConfigured = useCallback((): boolean => {
        if (service === 'gemini') return !!apiKeys.gemini;
        if (service === 'openai') return !!apiKeys.openai;
        if (service === 'n8n') return !!n8nSettings.webhookUrl;
        return false;
    }, [service, apiKeys, n8nSettings.webhookUrl]);

    // Check if Autocompletion service is configured
    const isAutocompleteServiceConfigured = useCallback((): boolean => {
        if (autocompleteService === 'gemini') return !!apiKeys.gemini;
        if (autocompleteService === 'openai') return !!apiKeys.openai;
        return false;
    }, [autocompleteService, apiKeys]);


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

    const updateN8nSettings = async (newSettings: Partial<N8nSettings>): Promise<{error: Error | null}> => {
        const updatedSettings = { ...n8nSettings, ...newSettings };
        setN8nSettings(updatedSettings); // Optimistic update
        if (!supabase) {
            const error = new Error("Supabase client not available");
            return { error };
        }

        try {
            const { data: existing, error: selectError } = await supabase
                .from('Configuracion')
                .select('id')
                .eq('key', 'n8n_agent_settings')
                .is('id_usuario', null)
                .maybeSingle();
            
            if (selectError) throw selectError;
            
            if (existing) {
                const { error: updateError } = await supabase
                    .from('Configuracion')
                    .update({ value: JSON.stringify(updatedSettings) })
                    .eq('id', existing.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('Configuracion')
                    .insert({ key: 'n8n_agent_settings', value: JSON.stringify(updatedSettings), id_usuario: null });
                if (insertError) throw insertError;
            }
            return { error: null };
        } catch (error: any) {
            console.error("Failed to save N8N settings to DB:", error);
            fetchConfigs(); // Revert to fetched state on error
            return { error };
        }
    };
    
    const value = useMemo(() => ({ 
        service, 
        setService, 
        isChatServiceConfigured, 
        
        autocompleteService, 
        setAutocompleteService, 
        isAutocompleteServiceConfigured,

        geminiClient, 
        openaiClient, 
        apiKeys, 
        
        n8nSettings,
        
        updateApiKeys, 
        updateN8nSettings 
    }), [
        service, 
        isChatServiceConfigured, 
        autocompleteService, 
        isAutocompleteServiceConfigured,
        geminiClient, 
        openaiClient, 
        apiKeys, 
        n8nSettings,
        updateApiKeys,
        updateN8nSettings
    ]);

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
