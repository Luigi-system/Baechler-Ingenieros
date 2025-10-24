import React from 'react';
import { useAiService } from '../../contexts/AiServiceContext';
import { SparklesIcon, CpuChipIcon } from '../ui/Icons';

const AiSettings: React.FC = () => {
    const { service, setService, isConfigured } = useAiService();

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
                            Selecciona el proveedor de inteligencia artificial que se utilizará en la aplicación. La API Key debe estar configurada en el entorno de la aplicación.
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="bg-base-200 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-base font-semibold text-base-content mb-4 pb-4 border-b border-base-border">Proveedor de IA Activo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <span className="font-medium text-base-content">
                                    Google Gemini
                                </span>
                                <p className={`text-neutral text-xs ${isConfigured('gemini') ? 'text-success' : 'text-warning'}`}>
                                    {isConfigured('gemini') ? 'Configurado' : 'No Configurado'}
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
                                <span className="font-medium text-base-content">
                                    OpenAI
                                </span>
                                <p className={`text-neutral text-xs ${isConfigured('openai') ? 'text-success' : 'text-warning'}`}>
                                     {isConfigured('openai') ? 'Configurado' : 'No Configurado'}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>
                 <p className="text-xs text-neutral mt-4 text-center">
                    La selección del proveedor se guarda localmente en tu navegador.
                </p>
            </div>
        </div>
    );
};

export default AiSettings;
