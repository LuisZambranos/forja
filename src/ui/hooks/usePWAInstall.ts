import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Variables globales a nivel de módulo para capturar el evento en cuanto carga la app
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((listener) => listener());
}

export function checkIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function checkIsIOS(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isAppleDevice = /iphone|ipad|ipod/.test(ua);
  const isMacTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isAppleDevice || isMacTouch;
}

// Inicialización de listeners tempranos en el objeto window
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notifyAll();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyAll();
  });
}

export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(() => checkIsStandalone());
  const [canPromptDirectly, setCanPromptDirectly] = useState(() => !!deferredPrompt);
  const [isIOS] = useState(() => checkIsIOS());

  useEffect(() => {
    const handleUpdate = () => {
      setIsInstalled(checkIsStandalone());
      setCanPromptDirectly(!!deferredPrompt);
    };

    listeners.add(handleUpdate);
    handleUpdate();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      listeners.delete(handleUpdate);
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const installApp = async (): Promise<{
    success: boolean;
    reason: 'accepted' | 'dismissed' | 'manual_instructions';
  }> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          deferredPrompt = null;
          setIsInstalled(true);
          notifyAll();
          return { success: true, reason: 'accepted' };
        }
        return { success: false, reason: 'dismissed' };
      } catch (err) {
        console.error('Error durante la instalación nativa de PWA:', err);
        return { success: false, reason: 'manual_instructions' };
      }
    }
    return { success: false, reason: 'manual_instructions' };
  };

  return {
    isInstalled,
    isInstallable: !isInstalled,
    canPromptDirectly,
    isIOS,
    installApp,
  };
}

