

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: 'max-w-lg' | 'max-w-xl' | 'max-w-2xl' | 'max-w-3xl' | 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl';
  hasPadding?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'max-w-lg',
  hasPadding = true
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${maxWidth} transform transition-all overflow-hidden flex flex-col animate-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button 
                onClick={onClose} 
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Cerrar"
            >
              <XIcon className="h-6 w-6" />
            </button>
          </div>
        )}
        <div className={`${hasPadding ? "p-6" : ""} overflow-y-auto custom-scrollbar max-h-[85vh]`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;