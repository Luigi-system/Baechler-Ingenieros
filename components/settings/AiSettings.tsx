
import React, { useState, useEffect } from 'react';
import { useAiService } from '../../contexts/AiServiceContext';
import { SparklesIcon, CogIcon, KeyIcon, SaveIcon, DocumentIcon, CpuChipIcon } from '../ui/Icons'; 
import Spinner from '../ui/Spinner';
import type { AiService } from '../../types';

const AiSettings: React.FC = () => {
    const { 
        service, setService, isChatServiceConfigured, apiKeys, updateApiKeys,
        n8nWebhookUrl, updateN8nWebhookUrl,
        autocompleteService, setAutocompleteService, isAutocompleteServiceConfigured
    } = useAiService();
    
    const [localKeys, setLocalKeys] = useState({ gemini: '', openai: '' });
    const [localN8nUrl, setLocalN8nUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        setLocalKeys({
            gemini: apiKeys.gemini || '',
            openai: apiKeys.openai || '',
        });
        setLocalN8nUrl(n8nWebhookUrl || '');
    }, [apiKeys, n8nWebhookUrl]);

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback(null);
        
        const [keysResult, n8nUrlResult] = await Promise.all([
            updateApiKeys(localKeys),
            updateN8nWebhookUrl(localN8nUrl)
            // No separate save for autocomplete keys as they reuse `apiKeys`
        ]);

        setIsSaving(false);
        if (keysResult.error || n8nUrlResult.error) {
            const keyError = keysResult.error ? `API Keys: ${keysResult.error.message}` : '';
            const urlError = n8nUrlResult.error ? `Agente AI URL: ${n8nUrlResult.error.message}` : '';
            setFeedback({ type: 'error', message: `Error al guardar: ${keyError} ${urlError}`.trim() });
        } else {
            setFeedback({ type: 'success', message: '¡Configuración de IA guardada exitosamente!' });
        }
    };
    
    const renderChatConfigForm = () => {
        switch (service) {
            case 'gemini':
                return (
                    <div>
                        <label htmlFor="gemini" className="block text-sm font-medium">Clave de API de Google Gemini</label>
                        <input type="password" id="gemini" name="gemini" value={localKeys.gemini} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                );
            case 'openai':
                 return (
                    <div>
                        <label htmlFor="openai" className="block text-sm font-medium">Clave de API de OpenAI</label>
                        <input type="password" id="openai" name="openai" value={localKeys.openai} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                );
            case 'n8n':
                return (
                    <div className="space-y-4">
                         <div>
                            <label htmlFor="n8n_url" className="block text-sm font-medium">URL del Webhook de Agente AI</label>
                            <input type="text" id="n8n_url" name="n8n_url" value={localN8nUrl} onChange={(e) => setLocalN8nUrl(e.target.value)} className="mt-1 block w-full input-style" placeholder="https://..."/>
                             <p className="mt-2 text-xs text-neutral">
                                El webhook debe aceptar peticiones GET. El siguiente objeto JSON será URL-encodeado y enviado como un parámetro de consulta llamado <code className="bg-base-100 p-1 rounded-sm">q</code>:
                                <pre className="mt-1 p-2 bg-base-100 rounded text-xs overflow-x-auto custom-scrollbar">
                                    <code>
{`{
  "service": "chatbot",
  "content": {
    "action": "consultas",
    "params": {
      "query": "tu pregunta...",
      "userName": "nombre usuario",
      "file": ""
    }
  }
}`}
                                    </code>
                                </pre>
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    const renderAutocompleteConfigForm = () => {
        switch (autocompleteService) {
            case 'gemini':
                return (
                    <div>
                        <label htmlFor="autocomplete_gemini" className="block text-sm font-medium">Clave de API de Google Gemini</label>
                        <input type="password" id="autocomplete_gemini" name="gemini" value={localKeys.gemini} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                );
            case 'openai':
                 return (
                    <div>
                        <label htmlFor="autocomplete_openai" className="block text-sm font-medium">Clave de API de OpenAI</label>
                        <input type="password" id="autocomplete_openai" name="openai" value={localKeys.openai} onChange={handleKeyChange} className="mt-1 block w-full input-style" placeholder="Pega tu clave aquí"/>
                    </div>
                );
            default:
                return null;
        }
    }


    return (
        <div className="space-y-8">
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                 <div className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                        <CpuChipIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de Servicios de IA</h3>
                        <p className="mt-1 text-sm text-neutral">
                            Selecciona los proveedores de IA y configura las claves de API y webhooks para la aplicación.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                <h3 className="text-base font-semibold text-base-content mb-4 pb-4 border-b border-base-border">Proveedor para Asistente (Chat/Agente AI)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4"> 
                    <div onClick={() => setService('gemini')} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${service === 'gemini' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'}`}>
                         {service === 'gemini' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                        <div className="flex items-center">
                            <SparklesIcon className="h-8 w-8 mr-3 text-blue-500" />
                            <div className="text-sm">
                                <span className="font-medium text-base-content">Google Gemini</span>
                                <p className={`text-neutral text-xs ${isChatServiceConfigured() ? 'text-success' : 'text-warning'}`}>
                                    {isChatServiceConfigured() ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={() => setService('openai')} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${service === 'openai' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'}`}>
                         {service === 'openai' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                         <div className="flex items-center">
                             <DocumentIcon className="h-8 w-8 mr-3 text-cyan-500" />
                            <div className="text-sm">
                                <span className="font-medium text-base-content">OpenAI</span>
                                <p className={`text-neutral text-xs ${isChatServiceConfigured() ? 'text-success' : 'text-warning'}`}>
                                     {isChatServiceConfigured() ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => setService('n8n')} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${service === 'n8n' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'}`}>
                         {service === 'n8n' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                         <div className="flex items-center">
                             <CogIcon className="h-8 w-8 mr-3 text-green-500" />
                            <div className="text-sm">
                                <span className="font-medium text-base-content">Agente AI</span>
                                <p className={`text-neutral text-xs ${isChatServiceConfigured() ? 'text-success' : 'text-warning'}`}>
                                     {isChatServiceConfigured() ? 'Configurado' : 'Config. Requerida'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                 <p className="text-xs text-neutral mt-4 text-center">
                    La selección del proveedor se guarda localmente en tu navegador.
                </p>
            </div>

            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                <h3 className="text-base font-semibold text-base-content mb-4 pb-4 border-b border-base-border">Proveedor para Autocompletado (Reportes de Servicio/Visita)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> 
                    <div onClick={() => setAutocompleteService('gemini')} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${autocompleteService === 'gemini' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'}`}>
                         {autocompleteService === 'gemini' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                        <div className="flex items-center">
                            <SparklesIcon className="h-8 w-8 mr-3 text-blue-500" />
                            <div className="text-sm">
                                <span className="font-medium text-base-content">Google Gemini</span>
                                <p className={`text-neutral text-xs ${isAutocompleteServiceConfigured() ? 'text-success' : 'text-warning'}`}>
                                    {isAutocompleteServiceConfigured() ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={() => setAutocompleteService('openai')} className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${autocompleteService === 'openai' ? 'border-primary shadow-md scale-105 bg-base-100' : 'border-base-border bg-base-200 hover:border-primary/70'}`}>
                         {autocompleteService === 'openai' && <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-primary animate-pulse"></div>}
                         <div className="flex items-center">
                             <DocumentIcon className="h-8 w-8 mr-3 text-cyan-500" />
                            <div className="text-sm">
                                <span className="font-medium text-base-content">OpenAI</span>
                                <p className={`text-neutral text-xs ${isAutocompleteServiceConfigured() ? 'text-success' : 'text-warning'}`}>
                                     {isAutocompleteServiceConfigured() ? 'Configurado' : 'Clave API Requerida'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                 <p className="text-xs text-neutral mt-4 text-center">
                    La selección del proveedor se guarda localmente en tu navegador.
                </p>
            </div>


            <form onSubmit={handleSave} className="bg-base-200 p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                    <div className="bg-secondary/10 text-secondary p-3 rounded-lg"><KeyIcon className="h-8 w-8"/></div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de API Keys / Webhooks</h3>
                        <p className="mt-1 text-sm text-neutral">Introduce los datos para los servicios seleccionados. La configuración es global.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-base-content">API Keys del Asistente (Chat)</h4>
                    {renderChatConfigForm()}
                    <h4 className="text-lg font-medium text-base-content mt-8 pt-4 border-t border-base-border">API Keys de Autocompletado (Reportes)</h4>
                    {renderAutocompleteConfigForm()}
                </div>

                {feedback && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {feedback.message}
                    </div>
                )}
                
                <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus disabled:bg-primary/50">
                        {isSaving ? <Spinner/> : <SaveIcon className="h-5 w-5"/>}
                        {isSaving ? 'Guardando...' : 'Guardar Toda la Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AiSettings;