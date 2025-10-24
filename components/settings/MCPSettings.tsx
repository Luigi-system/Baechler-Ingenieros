

import React, { useState, useEffect } from 'react';
import { SaveIcon, LinkIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

const DEFAULT_MCP_URL = 'https://jhhlrndxepowacrndhni.supabase.co/functions/v1/mcp';

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
        <div className="bg-base-200 p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
            <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
                <div className="bg-primary/10 text-primary p-3 rounded-lg">
                    <LinkIcon className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-base-content">Configuración de MCP</h3>
                    <p className="mt-1 text-sm text-neutral">
                        Gestiona la URL de conexión para el MCP (Multi-Cloud Project). Esta configuración es global.
                    </p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="mcp-url" className="block text-sm font-medium">URL del MCP</label>
                    <input 
                        type="text" 
                        id="mcp-url" 
                        value={mcpUrl}
                        onChange={(e) => setMcpUrl(e.target.value)}
                        className="mt-1 block w-full input-style"
                        placeholder="https://mcp.supabase.com/..."
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

export default MCPSettings;