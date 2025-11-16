import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { SaveIcon, MailIcon, TrashIcon, PlusIcon, AlertTriangleIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';
import type { EmailSettings } from '../../types';

const DEFAULT_SETTINGS: EmailSettings = {
    from: 'luigi.rm.18@gmail.com',
    url: 'https://lr-system.vercel.app/mail',
    method: 'POST',
    headers: {},
};

const EmailSettings: React.FC = () => {
    const { supabase } = useSupabase();
    const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
    const [localHeaders, setLocalHeaders] = useState<{ id: number; key: string; value: string }[]>([]);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            if (!supabase) return;
            setIsLoading(true);
            const { data, error } = await supabase
                .from('Configuracion')
                .select('value')
                .eq('key', 'email_settings')
                .is('id_usuario', null)
                .maybeSingle();
            
            if (error) {
                setFeedback({ type: 'error', message: `Error al cargar configuración: ${error.message}` });
            } else if (data && data.value) {
                try {
                    const savedSettings = JSON.parse(data.value as string);
                    // Force method to POST, ignore any saved value for method
                    setSettings({ ...DEFAULT_SETTINGS, ...savedSettings, method: 'POST' });
                    setLocalHeaders(
                        Object.entries(savedSettings.headers || {}).map(([key, value], index) => ({ id: index, key, value: value as string }))
                    );
                } catch (e) {
                    setFeedback({ type: 'error', message: 'Error al parsear la configuración guardada.' });
                }
            } else {
                 // Ensure new/default settings also have POST
                 setSettings(prev => ({ ...prev, method: 'POST' }));
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, [supabase]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...localHeaders];
        newHeaders[index][field] = value;
        setLocalHeaders(newHeaders);
    };

    const addHeader = () => {
        setLocalHeaders([...localHeaders, { id: Date.now(), key: '', value: '' }]);
    };

    const removeHeader = (id: number) => {
        setLocalHeaders(localHeaders.filter(h => h.id !== id));
    };

    const handleSave = async () => {
        if (!supabase) {
            setFeedback({ type: 'error', message: 'Cliente Supabase no disponible.' });
            return;
        }
        setIsSaving(true);
        setFeedback(null);

        try {
            const headersObject = localHeaders.reduce((acc, header) => {
                if (header.key.trim()) {
                    acc[header.key.trim()] = header.value.trim();
                }
                return acc;
            }, {} as Record<string, string>);
            
            // Always save with POST method
            const settingsToSave = { ...settings, headers: headersObject, method: 'POST' as const };

            const { data: existing, error: selectError } = await supabase
                .from('Configuracion')
                .select('id')
                .eq('key', 'email_settings')
                .is('id_usuario', null)
                .maybeSingle();

            if (selectError) throw selectError;

            if (existing) {
                const { error } = await supabase.from('Configuracion').update({ value: JSON.stringify(settingsToSave) }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('Configuracion').insert({ key: 'email_settings', value: JSON.stringify(settingsToSave), id_usuario: null });
                if (error) throw error;
            }
            setFeedback({ type: 'success', message: '¡Configuración de correo guardada exitosamente!' });
        } catch (error: any) {
            setFeedback({ type: 'error', message: `Error al guardar: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Spinner />
                <span className="ml-2">Cargando configuración...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-base-200 p-6 rounded-xl shadow-lg">
                <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                    <div className="bg-accent/10 text-accent p-3 rounded-lg">
                        <MailIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de Envío de Correo</h3>
                        <p className="mt-1 text-sm text-neutral">
                            Configura el servicio externo para enviar correos electrónicos desde la aplicación.
                        </p>
                    </div>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label htmlFor="from" className="block text-sm font-medium">Correo Remitente (From)</label>
                        <input 
                            type="email" 
                            id="from" 
                            name="from"
                            value={settings.from}
                            onChange={handleChange}
                            className="mt-1 block w-full max-w-md input-style"
                            placeholder="ejemplo@tu-dominio.com"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium">URL del Servicio de Correo (Endpoint)</label>
                        <input 
                            type="text" 
                            id="url"
                            name="url"
                            value={settings.url}
                            onChange={handleChange}
                            className="mt-1 block w-full input-style"
                            placeholder="https://api.tu-servicio.com/mail"
                            disabled={isSaving}
                        />
                         <p className="mt-1 text-xs text-neutral">El servicio debe aceptar un POST con `from`, `to`, `subject`, `message`.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Método HTTP</label>
                        <div className="mt-2 p-3 bg-base-100 border border-base-border rounded-md max-w-md">
                            <span className="text-sm font-semibold text-base-content">POST</span>
                            <p className="text-xs text-neutral">Este método es requerido por el endpoint del servidor de correo y se usará para todos los envíos.</p>
                        </div>
                    </div>

                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium">Headers (Opcional)</label>
                            <button type="button" onClick={addHeader} className="flex items-center gap-1 text-xs bg-primary/20 text-primary hover:bg-primary/30 px-2 py-1 rounded-md"><PlusIcon className="h-4 w-4"/>Añadir Header</button>
                        </div>
                        <div className="space-y-2">
                        {localHeaders.map((header, index) => (
                            <div key={header.id} className="flex items-center gap-2">
                                <input type="text" placeholder="Clave (ej. Authorization)" value={header.key} onChange={e => handleHeaderChange(index, 'key', e.target.value)} className="w-1/3 input-style text-sm" />
                                <input type="text" placeholder="Valor (ej. Bearer ...)" value={header.value} onChange={e => handleHeaderChange(index, 'value', e.target.value)} className="flex-1 input-style text-sm" />
                                <button type="button" onClick={() => removeHeader(header.id)} className="p-2 text-error hover:bg-error/10 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                {feedback && (
                    <div className={`mt-6 p-3 rounded-md text-sm ${
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
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none transition-colors disabled:bg-primary/50"
                    >
                        {isSaving ? <Spinner /> : <SaveIcon className="h-5 w-5" />}
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailSettings;