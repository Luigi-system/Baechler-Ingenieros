

import React, { useState, useEffect } from 'react';
import { useAiService } from '../../contexts/AiServiceContext';
import { SparklesIcon, CogIcon, KeyIcon, SaveIcon, DocumentIcon, CpuChipIcon, TrashIcon, PlusIcon } from '../ui/Icons'; 
import Spinner from '../ui/Spinner';
import type { AiService } from '../../types';

const AiSettings: React.FC = () => {
    const { 
        service, setService, isChatServiceConfigured, apiKeys, updateApiKeys,
        n8nSettings, updateN8nSettings,
        autocompleteService, setAutocompleteService, isAutocompleteServiceConfigured
    } = useAiService();
    
    const [localKeys, setLocalKeys] = useState({ gemini: '', openai: '' });
    const [localN8nUrl, setLocalN8nUrl] = useState('');
    const [localN8nMethod, setLocalN8nMethod] = useState<'GET' | 'POST'>('GET');
    const [localN8nHeaders, setLocalN8nHeaders] = useState<{ id: number; key: string; value: string }[]>([]);

    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    useEffect(() => {
        setLocalKeys({
            gemini: apiKeys.gemini || '',
            openai: apiKeys.openai || '',
        });
        setLocalN8nUrl(n8nSettings.webhookUrl || '');
        setLocalN8nMethod(n8nSettings.method || 'GET');
        setLocalN8nHeaders(
             Object.entries(n8nSettings.headers || {}).map(([key, value], index) => ({ id: index, key, value }))
        );
    }, [apiKeys, n8nSettings]);

    const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...localN8nHeaders];
        newHeaders[index][field] = value;
        setLocalN8nHeaders(newHeaders);
    };

    const addHeader = () => {
        setLocalN8nHeaders([...localN8nHeaders, { id: Date.now(), key: '', value: '' }]);
    };

    const removeHeader = (id: number) => {
        setLocalN8nHeaders(localN8nHeaders.filter(h => h.id !== id));
    };

    const addContentTypeHeader = () => {
        if (!localN8nHeaders.some(h => h.key.toLowerCase().trim() === 'content-type')) {
            setLocalN8nHeaders([...localN8nHeaders, { id: Date.now(), key: 'Content-Type', value: 'application/json' }]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setFeedback(null);
        
        const headersObject = localN8nHeaders.reduce((acc, header) => {
            if (header.key.trim()) {
                acc[header.key.trim()] = header.value.trim();
            }
            return acc;
        }, {} as Record<string, string>);

        const [keysResult, n8nResult] = await Promise.all([
            updateApiKeys(localKeys),
            updateN8nSettings({
                webhookUrl: localN8nUrl,
                method: localN8nMethod,
                headers: headersObject
            })
        ]);

        setIsSaving(false);
        if (keysResult.error || n8nResult.error) {
            const keyError = keysResult.error ? `API Keys: ${keysResult.error.message}` : '';
            const n8nError = n8nResult.error ? `Configuración Agente AI: ${n8nResult.error.message}` : '';
            setFeedback({ type: 'error', message: `Error al guardar: ${keyError} ${n8nError}`.trim() });
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
                    <div className="space-y-6">
                         <div>
                            <label htmlFor="n8n_url" className="block text-sm font-medium">URL del Webhook de Agente AI</label>
                            <input type="text" id="n8n_url" name="n8n_url" value={localN8nUrl} onChange={(e) => setLocalN8nUrl(e.target.value)} className="mt-1 block w-full input-style" placeholder="https://..."/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Método HTTP</label>
                             <div className="mt-2 flex items-center space-x-4">
                                <label className="flex items-center"><input type="radio" name="n8n_method" value="GET" checked={localN8nMethod === 'GET'} onChange={() => setLocalN8nMethod('GET')} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /> <span className="ml-2">GET</span></label>
                                <label className="flex items-center"><input type="radio" name="n8n_method" value="POST" checked={localN8nMethod === 'POST'} onChange={() => setLocalN8nMethod('POST')} className="h-4 w-4 text-primary focus:ring-primary border-base-border" /> <span className="ml-2">POST</span></label>
                            </div>
                        </div>

                        <div>
                             <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium">Headers (Opcional)</label>
                                <div>
                                    <button type="button" onClick={addContentTypeHeader} className="text-xs bg-base-300 hover:bg-base-100 px-2 py-1 rounded-md mr-2">Añadir Content-Type: json</button>
                                    <button type="button" onClick={addHeader} className="text-xs bg-primary/20 text-primary hover:bg-primary/30 px-2 py-1 rounded-md">Añadir Header</button>
                                </div>
                            </div>
                            <div className="space-y-2">
                            {localN8nHeaders.map((header, index) => (
                                <div key={header.id} className="flex items-center gap-2">
                                    <input type="text" placeholder="Clave (ej. Authorization)" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className="w-1/3 input-style text-sm" />
                                    <input type="text" placeholder="Valor (ej. Bearer ...)" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className="flex-1 input-style text-sm" />
                                    <button type="button" onClick={() => removeHeader(header.id)} className="p-2 text-error hover:bg-error/10 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                                </div>
                            ))}
                            </div>
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
                    <h4 className="text-lg font-medium text-base-content">Configuración para Asistente (Chat)</h4>
                    {renderChatConfigForm()}
                    <h4 className="text-lg font-medium text-base-content mt-8 pt-4 border-t border-base-border">Configuración para Autocompletado (Reportes)</h4>
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
