
import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { SaveIcon, MailIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

interface EmailSettingsData {
    from: string;
    url: string;
}

const DEFAULT_SETTINGS: EmailSettingsData = {
    from: 'luigi.rm.18@gmail.com',
    url: 'https://lr-system.vercel.app/mail',
};

const EmailSettings: React.FC = () => {
    const { supabase } = useSupabase();
    const [settings, setSettings] = useState<EmailSettingsData>(DEFAULT_SETTINGS);
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
                    setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
                } catch (e) {
                    setFeedback({ type: 'error', message: 'Error al parsear la configuración guardada.' });
                }
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, [supabase]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!supabase) {
            setFeedback({ type: 'error', message: 'Cliente Supabase no disponible.' });
            return;
        }
        setIsSaving(true);
        setFeedback(null);

        try {
            const { data: existing, error: selectError } = await supabase
                .from('Configuracion')
                .select('id')
                .eq('key', 'email_settings')
                .is('id_usuario', null)
                .maybeSingle();

            if (selectError) throw selectError;

            if (existing) {
                const { error } = await supabase.from('Configuracion').update({ value: JSON.stringify(settings) }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('Configuracion').insert({ key: 'email_settings', value: JSON.stringify(settings), id_usuario: null });
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
                
                <div className="space-y-4">
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
