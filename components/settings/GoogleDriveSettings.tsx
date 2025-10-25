import React, { useState, useEffect } from 'react';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { DriveIcon, LinkIcon, AlertTriangleIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

const GoogleDriveSettings: React.FC = () => {
  const { isSignedIn, currentUserEmail, handleSignIn, handleSignOut, gapiLoaded, gisLoaded, isConfigured } = useGoogleAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleConnect = async () => {
    setIsAuthLoading(true);
    setFeedback(null);
    try {
      await handleSignIn();
      // The sign-in callback will update the state, we can add a temporary success message
      // Note: The callback itself handles the actual success/failure state.
    } catch (e: any) {
      console.error("Google Sign-In failed:", e);
      setFeedback({ type: 'error', message: `Error al conectar: ${e.message || 'Por favor, inténtalo de nuevo.'}` });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsAuthLoading(true);
    setFeedback(null);
    handleSignOut();
    setFeedback({ type: 'success', message: '¡Desconectado de Google Drive!' });
    setIsAuthLoading(false);
  };

  const isReady = gapiLoaded && gisLoaded;

  return (
    <div className="space-y-8">
      <div className="bg-base-200 p-6 sm:p-8 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl">
        <div className="flex items-start gap-4 border-b border-base-border pb-4 mb-6">
          <div className="bg-primary/10 text-primary p-3 rounded-lg">
            <DriveIcon className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-base-content">Integración con Google Drive</h3>
            <p className="mt-1 text-sm text-neutral">
              Conecta tu cuenta de Google para acceder y gestionar documentos directamente desde la aplicación.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {!isConfigured ? (
             <div className="p-4 bg-warning/10 text-warning rounded-md flex items-start gap-3">
                <AlertTriangleIcon className="h-6 w-6 shrink-0 mt-0.5" />
                <div>
                    <h4 className="font-semibold">Configuración Requerida</h4>
                    <p className="text-sm">La integración de Google Drive no está habilitada. El desarrollador debe configurar un ID de cliente de Google en la aplicación.</p>
                </div>
            </div>
          ) : isSignedIn ? (
            <div>
              <p className="block text-sm font-medium">Estado de la conexión:</p>
              <div className="flex items-center mt-1 p-3 bg-success/10 text-success rounded-md">
                <LinkIcon className="h-5 w-5 mr-2" />
                <span className="font-semibold">Conectado como: {currentUserEmail}</span>
              </div>
              <p className="mt-2 text-xs text-neutral">Puedes acceder a los documentos de Google Drive a través del visualizador.</p>
            </div>
          ) : (
            <div>
              <p className="block text-sm font-medium text-warning">Estado de la conexión: No conectado</p>
              <p className="mt-1 text-xs text-neutral">Conecta tu cuenta de Google para habilitar la integración.</p>
            </div>
          )}
        </div>

        {feedback && (
          <div className={`mt-6 p-3 rounded-md text-sm transition-opacity duration-300 ${
            feedback.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Troubleshooting Section - Always visible if configured */}
        {isConfigured && (
          <div className="mt-6 p-4 bg-info/10 text-info rounded-md">
            <h4 className="font-semibold text-base flex items-center">
              <AlertTriangleIcon className="h-5 w-5 mr-2 shrink-0" />
              Solución de Problemas (Error de Autorización)
            </h4>
            <div className="mt-2 text-sm prose prose-sm max-w-none prose-zinc dark:prose-invert text-info">
                <p>
                    Si ves un error <strong>"Acceso bloqueado: error de autorización"</strong> o <strong>"Error 400: invalid_request"</strong>, verifica los siguientes puntos en tu <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Consola de Google Cloud</a>:
                </p>
                <ul className="list-disc pl-5 space-y-3">
                    <li>
                        <strong>Tipo de Aplicación:</strong> Asegúrate de que tu ID de cliente de OAuth sea para una <strong>"Aplicación web"</strong>.
                    </li>
                    <li>
                        <strong>Orígenes de JavaScript autorizados:</strong> Debe contener la siguiente URL:
                        <code className="block bg-base-300/50 p-2 rounded-md my-1 select-all">https://aistudio.google.com</code>
                    </li>
                    <li>
                        <strong>URIs de redireccionamiento autorizados:</strong> Debe contener la siguiente URL:
                        <code className="block bg-base-300/50 p-2 rounded-md my-1 select-all">https://accounts.google.com/gsi/callback</code>
                    </li>
                     <li>
                        <strong>Estado de Publicación:</strong> Ve a "Pantalla de consentimiento de OAuth". Si el estado es <strong>'En fase de pruebas'</strong>, tu cuenta de Google debe estar añadida en la sección <strong>'Usuarios de prueba'</strong> para poder iniciar sesión.
                    </li>
                </ul>
                <p>
                    <strong>Importante:</strong> Después de guardar los cambios en la consola de Google, espera 1-2 minutos antes de volver a intentarlo.
                </p>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-base-border">
          {isSignedIn ? (
            <button
              onClick={handleDisconnect}
              disabled={isAuthLoading || !isReady}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-error rounded-lg hover:bg-error/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-error/50 disabled:cursor-not-allowed"
            >
              {isAuthLoading ? <Spinner /> : null}
              {isAuthLoading ? 'Desconectando...' : 'Desconectar Google Drive'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isAuthLoading || !isReady || !isConfigured}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
            >
              {isAuthLoading ? <Spinner /> : null}
              {isAuthLoading ? 'Conectando...' : 'Conectar Google Drive'}
            </button>
          )}
          {!isReady && isConfigured && (
            <span className="ml-4 flex items-center text-sm text-neutral">
              <Spinner />
              <span className="ml-2">Cargando APIs de Google...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleDriveSettings;