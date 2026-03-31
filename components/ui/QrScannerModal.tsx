import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import { XIcon, CameraIcon, AlertTriangleIcon, SwitchCameraIcon, ShieldCheckIcon, ListSearchIcon } from './Icons';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: { type: 'service' | 'visit'; id: number }) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  
  const qrCodeRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkPermissions = async () => {
    setIsInitializing(true);
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        setHasPermission(true);
        startScanner('environment');
      } else {
        setError("No se encontraron cámaras disponibles en este dispositivo.");
        setHasPermission(false);
      }
    } catch (err) {
      console.error("Error al obtener cámaras:", err);
      setHasPermission(false);
      setError("Permiso de cámara denegado o no disponible.");
    } finally {
      setIsInitializing(false);
    }
  };

  const startScanner = async (mode: 'environment' | 'user') => {
    if (!qrCodeRef.current) {
        qrCodeRef.current = new Html5Qrcode("qr-reader");
    }
    
    setIsInitializing(true);
    setError(null);
    setIsScanning(false);

    try {
      await qrCodeRef.current.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
             const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
             const size = Math.floor(minEdge * 0.7);
             return { width: size, height: size };
          }
        },
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            if (data.type && data.id) {
              stopScanner().then(() => {
                onScan(data);
                onClose();
              });
            } else {
              setError("Formato de QR no reconocido.");
            }
          } catch (e) {
            setError("Contenido de QR inválido.");
          }
        },
        () => {} // Ignorar errores constantes de "No se detectó QR"
      );
      setIsInitializing(false);
      setIsScanning(true);
    } catch (err) {
      console.error("Error starting QR:", err);
      setError("No se pudo acceder a la cámara. Verifique los permisos.");
      setIsInitializing(false);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (qrCodeRef.current && qrCodeRef.current.isScanning) {
      try {
        await qrCodeRef.current.stop();
        setIsScanning(false);
      } catch (e) {
        console.error("Error stopping QR:", e);
      }
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    stopScanner().then(() => startScanner(newMode));
  };

  useEffect(() => {
    if (isOpen) {
      // Intentar verificar si ya tenemos permiso silenciosamente
      const checkInitial = async () => {
          try {
              const devices = await Html5Qrcode.getCameras();
              if (devices && devices.length > 0) {
                  setCameras(devices);
                  setHasPermission(true);
                  const timer = setTimeout(() => {
                      startScanner(facingMode);
                  }, 300);
                  return () => clearTimeout(timer);
              }
          } catch (e) {
              setHasPermission(false);
          }
      };
      
      checkInitial();

      return () => {
        stopScanner();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-base-200 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden ring-1 ring-white/5">
        
        {/* Header */}
        <div className="p-6 border-b border-base-border flex justify-between items-center bg-base-300/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
                <CameraIcon className="h-6 w-6" />
            </div>
            <div>
                <h3 className="font-black uppercase tracking-[0.2em] text-xs text-base-content">Módulo de Escaneado</h3>
                <p className="text-[10px] text-neutral font-bold uppercase tracking-tight opacity-60">Seguimiento de Reportes AI</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-base-300 rounded-2xl transition-all active:scale-90 hover:rotate-90 text-neutral">
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          
          {hasPermission === false && !isScanning && (
              <div className="flex flex-col items-center text-center space-y-6 py-6 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                      <div className="relative p-8 bg-base-300 rounded-[3rem] border border-white/10 shadow-2xl">
                          <ShieldCheckIcon className="h-16 w-16 text-primary animate-pulse" />
                      </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-base-content uppercase tracking-tight">Permisos de Cámara</h4>
                    <p className="text-sm text-neutral max-w-[280px] mx-auto">Para digitalizar los reportes vía QR, necesitamos acceso a la cámara de su dispositivo técnico.</p>
                  </div>
                  
                  <button 
                    onClick={checkPermissions}
                    disabled={isInitializing}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isInitializing ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>Inhabilitar Bloqueo y Activar</>
                    )}
                  </button>
                  
                  {error && (
                      <div className="p-4 bg-error/10 border border-error/20 rounded-2xl flex items-center gap-4 text-error w-full text-left">
                        <AlertTriangleIcon className="h-5 w-5 shrink-0" />
                        <p className="text-[10px] uppercase font-black tracking-tighter">{error}</p>
                      </div>
                  )}
              </div>
          )}

          {(hasPermission === true || hasPermission === null) && (
              <div className="space-y-6">
                {error && !isScanning && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-[1.5rem] flex items-center gap-4 text-error animate-shake">
                    <AlertTriangleIcon className="h-6 w-6 shrink-0" />
                    <div className="flex-1">
                        <p className="text-xs font-black uppercase">¡Error Operativo!</p>
                        <p className="text-[10px] opacity-80">{error}</p>
                    </div>
                    <button 
                        onClick={() => startScanner(facingMode)} 
                        className="text-[10px] bg-error text-white px-3 py-2 rounded-xl uppercase font-black shadow-lg"
                        >
                        Reintentar
                    </button>
                    </div>
                )}

                <div 
                    ref={containerRef}
                    className={`relative rounded-[2.5rem] border-2 border-base-border bg-black overflow-hidden shadow-2xl transition-all duration-700 ${isScanning ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`}
                    style={{ aspectRatio: '1/1' }}
                >
                    {isInitializing && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                            <p className="text-[10px] font-black uppercase text-white tracking-[0.3em] animate-pulse">Sincronizando Sensor...</p>
                        </div>
                    )}
                    
                    <div id="qr-reader" className="w-full h-full object-cover"></div>
                    
                    <style>{`
                        #qr-reader video {
                            width: 100% !important;
                            height: 100% !important;
                            object-fit: cover !important;
                            ${facingMode === 'user' ? 'transform: scaleX(-1);' : ''}
                        }
                        #qr-reader { border: none !important; }
                        #qr-shaded-region { display: none !important; }
                        #qr-reader__status_span { display: none !important; }
                        #qr-reader__dashboard { display: none !important; }
                    `}</style>
                    
                    {isScanning && (
                        <>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
                                <button 
                                    onClick={toggleCamera}
                                    className="flex items-center gap-3 px-6 py-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl text-white hover:bg-primary/90 transition-all shadow-2xl active:scale-95 group ring-1 ring-white/5"
                                >
                                    <SwitchCameraIcon className="h-5 w-5 group-hover:rotate-180 transition-transform duration-700" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                        {facingMode === 'environment' ? 'Sensor Trasero' : 'Sensor Frontal'}
                                    </span>
                                </button>
                            </div>
                            
                            {/* Scanning Area Mask (Custom Viewfinder Shading) */}
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute inset-0 bg-black/40"></div>
                                <div 
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-[2rem]"
                                    style={{ width: '70%', height: '70%' }}
                                ></div>
                            </div>

                            {/* Corner Borders linked to the 70% area */}
                            <div className="absolute left-[15%] top-[15%] w-16 h-16 border-t-4 border-l-4 border-primary rounded-tl-[2rem] pointer-events-none animate-pulse shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"></div>
                            <div className="absolute right-[15%] top-[15%] w-16 h-16 border-t-4 border-r-4 border-primary rounded-tr-[2rem] pointer-events-none animate-pulse shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"></div>
                            <div className="absolute left-[15%] bottom-[15%] w-16 h-16 border-b-4 border-l-4 border-primary rounded-bl-[2rem] pointer-events-none animate-pulse shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"></div>
                            <div className="absolute right-[15%] bottom-[15%] w-16 h-16 border-b-4 border-r-4 border-primary rounded-br-[2rem] pointer-events-none animate-pulse shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.5)]"></div>
                            
                            {/* Scanning Line */}
                            <div className="absolute top-[15%] left-[15%] w-[70%] h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-scan pointer-events-none shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.6)]"></div>
                        </>
                    )}
                </div>
                
                <div className="text-center space-y-5">
                    <div className="flex items-center justify-center gap-3 opacity-40">
                         <div className="h-[1px] w-8 bg-neutral"></div>
                         <p className="text-[10px] text-neutral font-black uppercase tracking-[0.2em]">Escaneo Seguro Activado</p>
                         <div className="h-[1px] w-8 bg-neutral"></div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-base-300 hover:bg-base-border text-base-content rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-lg border border-base-border/50 group flex items-center justify-center gap-3"
                    >
                        <ListSearchIcon className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                        Abortar Escaneo
                    </button>
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScannerModal;

