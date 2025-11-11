import React from 'react';
import NotificationItem from './Notification';
import type { Notification } from '../../types';

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: number) => void;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
