import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { XIcon, CameraIcon, AlertTriangleIcon } from './Icons';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: { type: 'service' | 'visit'; id: number }) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      
      // Initialize scanner slightly after mount to ensure container is ready
      const timer = setTimeout(() => {
        try {
          scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
          );

          scannerRef.current.render(
            (decodedText) => {
              try {
                const data = JSON.parse(decodedText);
                if (data.type && data.id) {
                  onScan(data);
                  onClose();
                } else {
                  setError("El código QR no contiene un formato de reporte válido.");
                }
              } catch (e) {
                setError("Contenido del QR inválido. Se esperaba un JSON de reporte.");
              }
            },
            (errorMessage) => {
              // Ignore constant "No QR found" errors from the library
            }
          );
        } catch (err) {
          console.error("Error starting QR scanner:", err);
          setError("No se pudo acceder a la cámara. Verifique los permisos.");
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.error("Error clearing scanner", e));
          scannerRef.current = null;
        }
      };
    }
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-base-200 w-full max-w-md rounded-2xl shadow-2xl border border-base-border overflow-hidden">
        <div className="p-4 border-b border-base-border flex justify-between items-center bg-base-300/50">
          <div className="flex items-center gap-2 text-primary">
            <CameraIcon className="h-5 w-5" />
            <h3 className="font-black uppercase tracking-widest text-sm">Escáner de Reportes</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-base-300 rounded-full transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {error ? (
            <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3 text-error animate-shake">
              <AlertTriangleIcon className="h-5 w-5 shrink-0" />
              <p className="text-xs font-bold">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="ml-auto text-[10px] bg-error text-white px-2 py-1 rounded-lg uppercase font-black"
                >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="mb-4 text-center">
              <p className="text-xs text-neutral font-medium">Posicione el código QR del reporte frente a la cámara.</p>
            </div>
          )}

          <div id="qr-reader" className="overflow-hidden rounded-xl border border-base-border bg-black aspect-square shadow-inner"></div>
          
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full py-3 bg-base-300 hover:bg-base-border text-base-content rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;
