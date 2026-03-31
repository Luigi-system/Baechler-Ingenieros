
import React, { useRef, useState } from 'react';
import { SparklesIcon, UploadIcon } from '../ui/Icons';

interface AiHeaderNoticeProps {
    onFileSelected: (file: File) => void;
    isProcessing?: boolean;
}

const AiHeaderNotice: React.FC<AiHeaderNoticeProps> = ({ onFileSelected, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelected(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelected(file);
    };

    return (
        <div 
            className={`bg-primary/5 border ${isDragging ? 'border-primary border-solid' : 'border-primary/20 border-dashed'} p-2 rounded-xl flex items-center justify-between max-w-xl mx-auto transition-all cursor-pointer hover:bg-primary/10`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,image/*" 
            />

            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isProcessing ? 'bg-primary/20 animate-pulse' : 'bg-primary/10'}`}>
                    {isProcessing 
                        ? <svg className="h-5 w-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <SparklesIcon className="h-5 w-5 text-primary" />}
                </div>
                <div>
                    <h3 className="text-xs font-bold text-primary">Autocompletado con IA</h3>
                    <p className="text-[9px] text-neutral">{isProcessing ? 'Analizando archivo...' : 'Arrastra un PDF o imagen aquí'}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-base-300/50 border border-base-border border-dashed rounded-lg text-[9px] flex items-center gap-2 text-neutral">
                    <UploadIcon className="h-3 w-3" />
                    <span>{isProcessing ? 'Procesando...' : 'Examinar Archivo'}</span>
                </div>
                <div className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-600 text-[8px] font-bold uppercase rounded-md">
                    IA Activa
                </div>
            </div>
        </div>
    );
};

export default AiHeaderNotice;
