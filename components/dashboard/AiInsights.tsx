
import React, { useState, useEffect } from 'react';
import { useAiService } from '../../contexts/AiServiceContext';
import { SparklesIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import ReactMarkdown from 'react-markdown';

interface AiInsightsProps {
    summary: string;
}

const AiInsights: React.FC<AiInsightsProps> = ({ summary }) => {
    const { geminiClient, isChatServiceConfigured } = useAiService();
    const [insights, setInsights] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            if (!isChatServiceConfigured() || !geminiClient || !summary) {
                setIsLoading(false);
                setInsights('El servicio de IA (Gemini) no está configurado o no hay suficientes datos para analizar.');
                return;
            }
            setIsLoading(true);
            try {
                const prompt = `Basado en las siguientes estadísticas de reportes de servicio: "${summary}", proporciona 2-3 insights accionables en español para mejorar la operación del negocio. Sé breve y directo. Formatea la respuesta como una lista de puntos en markdown.`;
                
                const response = await geminiClient.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: prompt,
                });
                
                setInsights(response.text);

            } catch (error) {
                console.error("Error fetching AI insights:", error);
                setInsights('No se pudieron generar las sugerencias de IA en este momento.');
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch if there is a summary to prevent unnecessary API calls
        if(summary) {
            fetchInsights();
        } else {
            setIsLoading(false);
            setInsights('Esperando datos para analizar...');
        }

    }, [geminiClient, summary, isChatServiceConfigured]);

    return (
        <div className="bg-base-200 p-6 rounded-xl shadow-lg h-full flex flex-col">
            <h3 className="text-xl font-semibold mb-4 text-base-content flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-primary" />
                Sugerencias de IA
            </h3>
            <div className="flex-grow">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="flex flex-col items-center">
                            <Spinner />
                            <span className="text-sm text-neutral mt-2">Analizando...</span>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none prose-zinc dark:prose-invert text-base-content">
                        <ReactMarkdown>{insights}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AiInsights;
