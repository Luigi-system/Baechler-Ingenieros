import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSupabase } from '../../contexts/SupabaseContext';
import { SaveIcon, DatabaseIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

const DatabaseSettings: React.FC = () => {
    const { initializeSupabase } = useSupabase();
    const [url, setUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    useEffect(() => {
        const storedUrl = localStorage.getItem('supabase_url') || '';
        const storedKey = localStorage.getItem('supabase_anon_key') || '';
        setUrl(storedUrl);
        setApiKey(storedKey);

        if(storedUrl && storedKey) {
            setFeedback({ type: 'info', message: 'Configuración actual cargada desde el almacenamiento local.' });
        } else {
            setFeedback({ type: 'info', message: 'No se encontró configuración. Por favor, ingresa tus credenciales.' });
        }
    }, []);

    const handleSave = async () => {
        if (!url || !apiKey) {
            setFeedback({ type: 'error', message: 'La URL de Supabase y la Anon Key no pueden estar vacías.' });
            return;
        }
        
        setIsSaving(true);
        setFeedback(null);

        try {
            const tempClient = createClient(url, apiKey);
            const { error: testError } = await tempClient.auth.getSession();
            
            if (testError && (testError.message.includes('AuthApiError') || testError.message.includes('failed to fetch'))) {
                throw testError;
            }

            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_anon_key', apiKey);
            initializeSupabase(url, apiKey);
            
            const settingsValue = { url, apiKey };
             const { data: existingConfig, error: selectError } = await tempClient
                .from('Configuracion')
                .select('id')
                .eq('key', 'supabase_settings')
                .is('id_usuario', null)
                .maybeSingle();

            if (selectError) throw new Error(`Error al buscar configuración existente: ${selectError.message}`);

            const payload = {
                key: 'supabase_settings',
                value: JSON.stringify(settingsValue)
            };

            let dbError;
            if (existingConfig) {
                const { error } = await tempClient.from('Configuracion').update({ value: payload.value }).eq('id', existingConfig.id);
                dbError = error;
            } else {
                const { error } = await tempClient.from('Configuracion').insert(payload);
                dbError = error;
            }

            if (dbError) throw new Error(`No se pudo guardar en la base de datos: ${dbError.message}`);
            
            setFeedback({ type: 'success', message: '¡Conexión verificada! La configuración se ha guardado y aplicado.' });

        } catch (error: any) {
            setFeedback({ type: 'error', message: `Falló el proceso de guardado: ${error.message}` });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-base-200 p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                    <div className="bg-primary/10 text-primary p-3 rounded-lg">
                        <DatabaseIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-base-content">Configuración de Base de Datos</h3>
                        <p className="mt-1 text-sm text-neutral">
                            Gestiona tu conexión a Supabase. Esta es una configuración general y se guardará para todos los usuarios.
                        </p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="supabase-url" className="block text-sm font-medium">URL de Supabase</label>
                        <input 
                            type="text" 
                            id="supabase-url" 
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="mt-1 block w-full input-style"
                            placeholder="https://<project-ref>.supabase.co"
                            disabled={isSaving}
                        />
                    </div>
                    <div>
                        <label htmlFor="supabase-key" className="block text-sm font-medium">Supabase Anon Key</label>
                        <input 
                            type="password" 
                            id="supabase-key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="mt-1 block w-full input-style"
                            placeholder="ey..."
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
                        {isSaving ? 'Verificando y Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatabaseSettings;
