import React, { createContext, useState, useContext, useCallback } from 'react';
import NotificationContainer from '../components/ui/NotificationContainer';
import type { Notification } from '../types';

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  confirm: (options: { title: string; message: string; onConfirm: () => void; onCancel?: () => void }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now() + Math.random(); // Add random number to avoid collision
    setNotifications(prev => [...prev, { id, ...notification }]);

    setTimeout(() => {
      removeNotification(id);
    }, 5000); // Auto-dismiss after 5 seconds
  }, [removeNotification]);

  const [confirmOptions, setConfirmOptions] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);

  const confirm = useCallback((options: { title: string; message: string; onConfirm: () => void; onCancel?: () => void }) => {
    setConfirmOptions(options);
  }, []);

  const handleConfirmAction = () => {
    if (confirmOptions) {
      confirmOptions.onConfirm();
      setConfirmOptions(null);
    }
  };

  const handleCancelAction = () => {
    if (confirmOptions) {
      if (confirmOptions.onCancel) confirmOptions.onCancel();
      setConfirmOptions(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ addNotification, confirm }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
      {confirmOptions && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex justify-center items-center p-4 animate-in fade-in duration-300"
          onClick={handleCancelAction}
        >
          <div 
            className="bg-base-200 border border-base-border rounded-2xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-base-content mb-2">{confirmOptions.title}</h3>
            <p className="text-neutral mb-6">{confirmOptions.message}</p>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={handleCancelAction}
                className="px-5 py-2.5 rounded-xl bg-base-300 hover:bg-neutral/20 transition-colors font-medium text-base-content"
              >
                No, cancelar
              </button>
              <button 
                onClick={handleConfirmAction}
                className="px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-focus transition-colors font-bold shadow-lg shadow-primary/20"
              >
                Sí, confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
