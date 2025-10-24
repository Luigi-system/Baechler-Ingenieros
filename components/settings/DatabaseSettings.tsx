import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSupabase } from '../../contexts/SupabaseContext';
import { SaveIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

const DatabaseSettings: React.FC = () => {
    const { initializeSupabase } = useSupabase();
    const [url, setUrl] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Load current configuration from localStorage on component mount
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
            // 1. Create a temporary client to test the new credentials.
            const tempClient = createClient(url, apiKey);
            
            // 2. Perform a simple, low-cost check like getting the session.
            const { error: testError } = await tempClient.auth.getSession();
            
            // If the error indicates an invalid key or connection issue, throw it.
            if (testError && (testError.message.includes('AuthApiError') || testError.message.includes('failed to fetch'))) {
                throw testError;
            }

            // 3. If the test is successful, save to localStorage and re-initialize the main client.
            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_anon_key', apiKey);
            initializeSupabase(url, apiKey);
            
            setFeedback({ type: 'success', message: '¡Conexión verificada! La configuración se ha guardado y aplicado.' });
        } catch (error: any) {
            setFeedback({ type: 'error', message: `No se pudo conectar con las nuevas credenciales: ${error.message}` });
            // Do NOT update the main client or localStorage if the test fails.
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Configuración de Base de Datos</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Gestiona tu conexión a Supabase. La configuración se guarda localmente en tu navegador.
                </p>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="supabase-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL de Supabase</label>
                    <input 
                        type="text" 
                        id="supabase-url" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="https://<project-ref>.supabase.co"
                        disabled={isSaving}
                    />
                </div>
                <div>
                    <label htmlFor="supabase-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Supabase Anon Key</label>
                    <input 
                        type="password" 
                        id="supabase-key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="ey..."
                        disabled={isSaving}
                    />
                </div>
            </div>

            {feedback && (
                <div className={`p-3 rounded-md text-sm ${
                    feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    feedback.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' :
                    'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                }`}>
                    {feedback.message}
                </div>
            )}

            <div className="flex justify-end pt-2">
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
                >
                    {isSaving ? <Spinner /> : <SaveIcon className="h-5 w-5" />}
                    {isSaving ? 'Verificando y Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
};

export default DatabaseSettings;
