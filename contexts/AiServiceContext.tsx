import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
// FIX: Import GoogleGenAI to instantiate the client.
import { GoogleGenAI } from '@google/genai';

export type AiService = 'gemini' | 'openai';

interface AiServiceContextType {
    service: AiService;
    setService: (service: AiService) => void;
    isConfigured: (service: AiService) => boolean;
    // FIX: Add the aiClient to the context type.
    aiClient: GoogleGenAI | null;
}

const AiServiceContext = createContext<AiServiceContextType | undefined>(undefined);

// Per guidelines, we assume the API key is available in the environment.
const isGeminiConfigured = !!process.env.API_KEY;
// For OpenAI, we would check a different env var, but for this app we assume one key for the active service.
const isOpenAiConfigured = !!process.env.API_KEY;


export const AiServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [service, setServiceState] = useState<AiService>('gemini');
    // FIX: Add state to hold the AI client instance.
    const [aiClient, setAiClient] = useState<GoogleGenAI | null>(null);

    useEffect(() => {
        const storedService = localStorage.getItem('ai_service') as AiService | null;
        if (storedService) {
            setServiceState(storedService);
        }
    }, []);

    // FIX: Add an effect to create the AI client when the service changes.
    useEffect(() => {
        if (service === 'gemini' && isConfigured('gemini') && process.env.API_KEY) {
            try {
                setAiClient(new GoogleGenAI({ apiKey: process.env.API_KEY }));
            } catch (e) {
                console.error("Failed to initialize GoogleGenAI client:", e);
                setAiClient(null);
            }
        } else {
            // Set to null for OpenAI (not implemented) or if not configured.
            setAiClient(null);
        }
    }, [service]);


    const setService = (newService: AiService) => {
        localStorage.setItem('ai_service', newService);
        setServiceState(newService);
    };

    const isConfigured = (serviceToCheck: AiService): boolean => {
        if (serviceToCheck === 'gemini') return isGeminiConfigured;
        if (serviceToCheck === 'openai') return isOpenAiConfigured;
        return false;
    };

    // FIX: Add aiClient to the context value and memoize it.
    const value = useMemo(() => ({ service, setService, isConfigured, aiClient }), [service, aiClient]);

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
