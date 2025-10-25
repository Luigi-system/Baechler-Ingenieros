

import React, { useState, useEffect } from 'react';
import { useAiService } from '../../contexts/AiServiceContext';
import { SparklesIcon, CpuChipIcon, KeyIcon, SaveIcon } from '../ui/Icons'; 
import Spinner from '../ui/Spinner';

const AiSettings: React.FC = () => {
    const { 
        service, setService, 
        isConfigured, apiKeys, updateApiKeys
    } = useAiService();
    
    const [keys, setKeys] = useState({ gemini: '', openai: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Update internal states when context values change
    useEffect(() => {
        setKeys({
            gemini: apiKeys.gemini || '',
            openai: apiKeys.openai || '',
        });
    }, [apiKeys]);

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback(null);
        
        const { error: keysError } = await updateApiKeys(keys);

        setIsSaving(false);
        if (keysError) {
            setFeedback({ type: 'error', message: `Error al guardar: ${keysError.message}` });
        } else {
            setFeedback({ type: 'success', message: '¡Configuración de IA guardada exitosamente!' });
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                        <CpuChipIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de Servicios de IA</h3>
                        <p className="mt-1 text-sm text-neutral">
                            Selecciona el proveedor de IA y configura las claves de API para la aplicación.
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Provider Selection */}
            <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-base font-semibold text-base-content mb-4 pb-4 border-b border-base-border">Proveedor de IA Activo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    {/* Gemini Option */}
                    <div
                        onClick={() => setService('gemini')}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            service === 'gemini' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'
                        }`}
                    >
                         {service === 'gemini' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                        <label className="flex items-center cursor-pointer">
                            <SparklesIcon className="h-8 w-8 mr-3 text-blue-500" />
                            <div className="text-sm">
                                <span className="font-medium text-base-content">Google Gemini</span>
                                <p className={`text-neutral text-xs ${isConfigured('gemini') ? 'text-success' : 'text-warning'}`}>
                                    {isConfigured('gemini') ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </label>
                    </div>
                    
                    {/* OpenAI Option */}
                    <div
                         onClick={() => setService('openai')}
                        className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            service === 'openai' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'
                        }`}
                    >
                         {service === 'openai' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                         <label className="flex items-center cursor-pointer">
                             <img src="https://jhhlrndxepowacrndhni.supabase.co/storage/v1/object/public/assets/openai-logo.png" alt="OpenAI Logo" className="h-8 w-8 mr-3"/>
                            <div className="text-sm">
                                <span className="font-medium text-base-content">OpenAI</span>
                                <p className={`text-neutral text-xs ${isConfigured('openai') ? 'text-success' : 'text-warning'}`}>
                                     {isConfigured('openai') ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
                 <p className="text-xs text-neutral mt-4 text-center">
                    La selección del proveedor se guarda localmente en tu navegador.
                </p>
            </div>

            {/* API Key Configuration */}
            <form onSubmit={handleSave} className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                    <div className="bg-secondary/10 text-secondary p-3 rounded-lg"><KeyIcon className="h-8 w-8"/></div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Claves de API</h3>
                        <p className="mt-1 text-sm text-neutral">Introduce las claves de API para los servicios de IA. Esta es una configuración global.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="gemini-key" className="block text-sm font-medium">Clave de API de Google Gemini</label>
                        <input type="password" id="gemini-key" name="gemini" value={keys.gemini} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                     <div>
                        <label htmlFor="openai-key" className="block text-sm font-medium">Clave de API de OpenAI</label>
                        <input type="password" id="openai-key" name="openai" value={keys.openai} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                </div>

                {feedback && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {feedback.message}
                    </div>
                )}
                
                <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSaving ? <Spinner/> : <SaveIcon className="h-5 w-5"/>}
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AiSettings;