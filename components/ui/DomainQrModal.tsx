
import React, { useState } from 'react';
import Modal from './Modal';
import { IndustryIcon, ChevronLeftIcon, CopyIcon, LinkIcon } from './Icons';
import { useTheme } from '../../contexts/ThemeContext';

interface DomainQrModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DomainQrModal: React.FC<DomainQrModalProps> = ({ isOpen, onClose }) => {
    const { logoUrl, appTitle, logoColor, logoFontFamily } = useTheme();
    const [copied, setCopied] = useState(false);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(currentOrigin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            maxWidth="max-w-lg"
            hasPadding={false}
        >
            <div className="relative overflow-hidden bg-base-200 p-6 flex flex-col items-center">
                {/* Minimalist Header */}
                <div className="flex items-center gap-3 mb-6">
                    <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                    <h3 
                        className="text-lg font-black uppercase tracking-tighter italic"
                        style={{ color: logoColor || 'var(--color-primary)' }}
                    >
                        {appTitle}
                    </h3>
                </div>

                {/* QR Code - Prominent and compact */}
                <div className="bg-white p-4 rounded-3xl shadow-xl border border-white/20 mb-6">
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentOrigin)}&bgcolor=ffffff&color=000000`} 
                        alt="Domain QR"
                        className="w-48 h-48 md:w-56 md:h-56 object-contain"
                    />
                </div>

                {/* Compact Link Area */}
                <div className="w-full bg-base-300/50 rounded-2xl p-4 border border-base-border flex items-center gap-3 mb-6">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                        <LinkIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-0.5">Dominio</p>
                        <p className="text-xs font-mono font-bold truncate opacity-80">{currentOrigin}</p>
                    </div>
                    <button 
                        onClick={handleCopy}
                        className={`p-2 rounded-xl transition-all ${copied ? 'bg-success/20 text-success' : 'hover:bg-primary/20 text-primary'}`}
                        title="Copiar Enlace"
                    >
                        <CopyIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Primary Action */}
                <button 
                    onClick={onClose}
                    className="w-full py-3.5 bg-primary text-primary-content rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-focus transition-all shadow-lg active:scale-95"
                >
                    Cerrar Vista
                </button>
            </div>
        </Modal>
    );
};

export default DomainQrModal;
