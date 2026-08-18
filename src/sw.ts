/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

declare let self: ServiceWorkerGlobalScope;

// Inject precache manifest
precacheAndRoute(self.__WB_MANIFEST || []);

// Fallback para SPA (Single Page Application). Asegura que /rutinas, /perfil, etc. 
// y la ruta raíz (/) carguen el index.html cuando estemos offline.
try {
  const handler = createHandlerBoundToURL('/index.html');
  const navigationRoute = new NavigationRoute(handler);
  registerRoute(navigationRoute);
} catch (error) {
  console.error('Error registrando fallback de navegación:', error);
}

// We use import.meta.env to get the Firebase config at build time
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

onBackgroundMessage(messaging, (payload) => {
  console.log('[SW] Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Forja';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
