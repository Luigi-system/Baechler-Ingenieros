
import React, { useState, useEffect } from 'react';
import { SaveIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

const DEFAULT_MCP_URL = 'https://mcp.supabase.com/mcp?project_ref=jhhlrndxepowacrndhni&read_only=true';

const MCPSettings: React.FC = () => {
    const [mcpUrl, setMcpUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Load current configuration from localStorage on component mount
    useEffect(() => {
        const storedUrl = localStorage.getItem('mcp_url');
        if (storedUrl) {
            setMcpUrl(storedUrl);
            setFeedback({ type: 'info', message: 'Configuración actual cargada desde el almacenamiento local.' });
        } else {
            setMcpUrl(DEFAULT_MCP_URL);
            setFeedback({ type: 'info', message: 'No se encontró configuración guardada. Usando valor por defecto.' });
        }
    }, []);

    const handleSave = () => {
        if (!mcpUrl) {
            setFeedback({ type: 'error', message: 'La URL del MCP no puede estar vacía.' });
            return;
        }
        
        setIsSaving(true);
        setFeedback(null);

        // Simulate a save operation
        setTimeout(() => {
            try {
                localStorage.setItem('mcp_url', mcpUrl);
                setFeedback({ type: 'success', message: '¡Configuración de MCP guardada exitosamente!' });
            } catch (error: any) {
                setFeedback({ type: 'error', message: `No se pudo guardar la configuración: ${error.message}` });
            } finally {
                setIsSaving(false);
            }
        }, 500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Configuración de MCP</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Gestiona la URL de conexión para el MCP (Multi-Cloud Project). Esta configuración es global para la aplicación.
                </p>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="mcp-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">URL del MCP</label>
                    <input 
                        type="text" 
                        id="mcp-url" 
                        value={mcpUrl}
                        onChange={(e) => setMcpUrl(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        placeholder="https://mcp.supabase.com/..."
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
                    {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </div>
    );
};

export default MCPSettings;