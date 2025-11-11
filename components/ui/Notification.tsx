import React, { useState } from 'react';
import type { Notification } from '../../types';
import { CheckCircleIcon, AlertTriangleIcon, InformationCircleIcon, XIcon } from './Icons';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  
  const handleClose = () => {
      setIsExiting(true);
      // Wait for animation to finish before calling the parent's remove function
      setTimeout(onClose, 300); 
  };

  const baseClasses = 'w-full max-w-sm p-4 rounded-lg shadow-lg flex items-start animate-slide-in-right';
  const exitClass = isExiting ? 'animate-fade-out-right' : '';
  
  const config = {
    success: {
      bg: 'bg-success/10 border-l-4 border-success',
      icon: <CheckCircleIcon className="h-6 w-6 text-success" />,
      text: 'text-success'
    },
    error: {
      bg: 'bg-error/10 border-l-4 border-error',
      icon: <AlertTriangleIcon className="h-6 w-6 text-error" />,
      text: 'text-error'
    },
    warning: {
      bg: 'bg-warning/10 border-l-4 border-warning',
      icon: <AlertTriangleIcon className="h-6 w-6 text-warning" />,
      text: 'text-warning'
    },
    info: {
      bg: 'bg-info/10 border-l-4 border-info',
      icon: <InformationCircleIcon className="h-6 w-6 text-info" />,
      text: 'text-info'
    },
  };

  const { bg, icon, text } = config[notification.type];

  return (
    <div id={`notification-${notification.id}`} className={`${baseClasses} ${bg} ${exitClass} bg-base-200`} role="alert">
      <div className="flex-shrink-0">{icon}</div>
      <div className="ml-3 flex-1">
        <p className={`text-sm font-bold ${text}`}>{notification.title}</p>
        <p className="mt-1 text-sm text-base-content">{notification.message}</p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <button onClick={handleClose} className="inline-flex rounded-md p-1.5 text-neutral hover:bg-base-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-200 focus:ring-primary">
          <span className="sr-only">Cerrar</span>
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
