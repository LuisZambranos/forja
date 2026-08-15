importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCO_kAVI-qlTYJnN-r7ZgA29PKoma1sbT0",
  authDomain: "forja-dev-a1182.firebaseapp.com",
  projectId: "forja-dev-a1182",
  storageBucket: "forja-dev-a1182.firebasestorage.app",
  messagingSenderId: "47938865074",
  appId: "1:47938865074:web:a7074a6f4ba2783bdc46ab",
  measurementId: "G-M8X1KCKLKN"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Manejo de mensajes en segundo plano (background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title || 'FORJA';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
