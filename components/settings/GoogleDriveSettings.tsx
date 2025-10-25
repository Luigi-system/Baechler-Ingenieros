
import React, { useState, useEffect } from 'react';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import { DriveIcon, LinkIcon } from '../ui/Icons';
import Spinner from '../ui/Spinner';

const GoogleDriveSettings: React.FC = () => {
  const { isSignedIn, currentUserEmail, handleSignIn, handleSignOut, gapiLoaded, gisLoaded } = useGoogleAuth();
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleConnect = async () => {
    setIsAuthLoading(true);
    setFeedback(null);
    try {
      await handleSignIn();
      setFeedback({ type: 'success', message: '¡Conectado a Google Drive exitosamente!' });
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
          {isSignedIn ? (
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
              disabled={isAuthLoading || !isReady}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 transition-colors disabled:bg-primary/50 disabled:cursor-not-allowed"
            >
              {isAuthLoading ? <Spinner /> : null}
              {isAuthLoading ? 'Conectando...' : 'Conectar Google Drive'}
            </button>
          )}
          {!isReady && (
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