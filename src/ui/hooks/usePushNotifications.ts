import { useState, useEffect } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@core/config/firebase';

export function usePushNotifications() {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    try {
      if (!messaging) {
        console.warn('Messaging no está inicializado.');
        return;
      }
      const perm = await Notification.requestPermission();
      setPermission(perm);
      
      if (perm === 'granted') {
        // En un entorno de producción, la VAPID key debería venir de env variables.
        // Pero para Firebase basic config suele obtenerse automáticamente si conectamos el SW
        // Ojo: Firebase Cloud Messaging necesita una VAPID key para generar un token en entorno web (push).
        // Se obtiene en Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates.
        const token = await getToken(messaging, {
          // vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, // Requerida para push web reales
        });
        
        if (token) {
          setFcmToken(token);
          // TODO: Guardar este token en la base de datos Firestore bajo el perfil del usuario `users/${uid}/fcm_tokens`
          console.log('FCM Token obtenido:', token);
        }
      }
    } catch (err) {
      console.error('Error al pedir permisos de notificación:', err);
    }
  };

  return { fcmToken, permission, requestPermission };
}
