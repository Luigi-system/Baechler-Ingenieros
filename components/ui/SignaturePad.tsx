import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { XIcon, TrashIcon, CheckCircleIcon } from './Icons';

interface SignaturePadProps {
    onSave: (signatureData: string) => void;
    onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
    const sigCanvas = useRef<SignatureCanvas>(null);

    const clear = () => {
        sigCanvas.current?.clear();
    };

    const save = () => {
        if (sigCanvas.current?.isEmpty()) {
            alert('Por favor, firme antes de guardar.');
            return;
        }
        const data = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (data) {
            onSave(data);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-base-200 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-base-border animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-base-border flex justify-between items-center bg-base-100">
                    <h3 className="text-lg font-bold">Firma Digital</h3>
                    <button onClick={onClose} className="p-2 hover:bg-base-200 rounded-full transition-colors">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="bg-white rounded-xl border-2 border-dashed border-base-border overflow-hidden touch-none" style={{ height: '240px' }}>
                        <SignatureCanvas 
                            ref={sigCanvas}
                            canvasProps={{
                                className: 'w-full h-full cursor-crosshair',
                                width: 500,
                                height: 240
                            }}
                            backgroundColor="rgba(255,255,255,0)"
                            penColor="black"
                        />
                    </div>
                    <p className="text-xs text-center mt-3 text-base-content/60">Use su dedo o mouse para firmar en el recuadro blanco</p>
                </div>

                <div className="p-4 bg-base-100 border-t border-base-border flex gap-3">
                    <button
                        onClick={clear}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-base-border hover:bg-base-200 transition-all font-medium text-sm"
                    >
                        <TrashIcon className="h-4 w-4" />
                        Limpiar
                    </button>
                    <button
                        onClick={save}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-all font-bold text-sm shadow-lg shadow-primary/20"
                    >
                        <CheckCircleIcon className="h-4 w-4" />
                        Guardar Firma
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
