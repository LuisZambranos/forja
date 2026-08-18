import { getToken } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db, messaging } from '../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Solicita permisos de notificación (si es necesario) y obtiene el token FCM.
 * Luego lo guarda en la colección del usuario para envíos futuros o campañas.
 */
export async function requestAndSaveFCMToken(uid: string): Promise<boolean> {
  if (!messaging || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const permission = Notification.permission;
    
    if (permission === 'denied') {
      return false;
    }

    // Esperamos a que el Service Worker de VitePWA esté listo
    const registration = await navigator.serviceWorker.ready;
    
    // Obtener token (esto pedirá permiso visualmente si el estado es 'default')
    const currentToken = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration 
    });

    if (currentToken) {
      // Guardamos el token en Firestore. Usamos setDoc con merge por seguridad,
      // y arrayUnion para no sobreescribir tokens de otros dispositivos del mismo usuario.
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        fcm_tokens: arrayUnion(currentToken)
      }, { merge: true });
      
      return true;
    } else {
      console.warn('No se pudo generar el token FCM.');
      return false;
    }
  } catch (err: any) {
    console.error('Error obteniendo token FCM:', err);
    return false;
  }
}
