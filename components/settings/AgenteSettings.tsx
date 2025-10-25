

import React, { useState, useEffect } from 'react';
import { SaveIcon, LinkIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import { useAiService } from '../../contexts/AiServiceContext'; // Import useAiService

const AgenteSettings: React.FC = () => {
    const { agenteWebhookUrl, updateAgenteWebhookUrl } = useAiService(); // Use context for state and update function
    const [webhookUrl, setWebhookUrl] = useState(agenteWebhookUrl);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Update internal state when context value changes
    useEffect(() => {
        setWebhookUrl(agenteWebhookUrl);
        setFeedback({ type: 'info', message: 'Configuración actual cargada.' });
    }, [agenteWebhookUrl]);

    const handleWebhookUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWebhookUrl(e.target.value);
    };

    const handleSave = async () => {
        if (!webhookUrl) {
            setFeedback({ type: 'error', message: 'La URL del webhook del Agente no puede estar vacía.' });
            return;
        }
        
        setIsSaving(true);
        setFeedback(null);

        const { error } = await updateAgenteWebhookUrl(webhookUrl);

        setIsSaving(false);
        if (error) {
            setFeedback({ type: 'error', message: `No se pudo guardar la configuración: ${error.message}` });
        } else {
            setFeedback({ type: 'success', message: '¡Configuración de Agente AI Externo guardada exitosamente!' });
        }
    };

    return (
        <div className="bg-base-200 p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <LinkIcon className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-base-content">Configuración de Agente AI Externo</h3>
                    <p className="mt-1 text-sm text-neutral">
                        Gestiona la URL del webhook para tu agente AI externo, que interactúa con la base de datos.
                    </p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="agente-webhook-url" className="block text-sm font-medium">URL del Webhook del Agente AI</label>
                    <input 
                        type="text" 
                        id="agente-webhook-url" 
                        value={webhookUrl}
                        onChange={handleWebhookUrlChange}
                        className="mt-1 block w-full input-style"
                        placeholder="https://hook.us2.make.com/..."
                        disabled={isSaving}
                    />
                </div>
            </div>

            {feedback && (
                <div className={`mt-6 p-3 rounded-md text-sm transition-opacity duration-300 ${
                    feedback.type === 'success' ? 'bg-success/10 text-success' :
                    feedback.type === 'error' ? 'bg-error/10 text-error' :
                    'bg-info/10 text-info'
                }`}>
                    {feedback.message}
                </div>
            )}

            <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Spinner /> : <SaveIcon className="h-5 w-5" />}
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
};

export default AgenteSettings;