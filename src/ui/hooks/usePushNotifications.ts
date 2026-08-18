import { useState, useEffect } from 'react';
import { requestAndSaveFCMToken } from '@core/services/notifications.service';
import { useAuth } from './useAuth';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      // Pedimos permiso si es necesario y generamos/renovamos el token
      const success = await requestAndSaveFCMToken(user.uid);
      if (success) {
        setPermission('granted');
        alert('¡Dispositivo vinculado exitosamente para recibir notificaciones!');
      } else {
        setPermission(Notification.permission);
      }
    } catch (err) {
      console.error('Error vinculando dispositivo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return { permission, requestPermission, isLoading };
}
