import { useState, useEffect } from 'react';
import { BellRing, X } from 'lucide-react';
import { requestAndSaveFCMToken } from '@core/services/notifications.service';
import { useAuth } from '@ui/hooks/useAuth';

export function NotificationBanner() {
  const { user } = useAuth();
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setPermissionState('denied'); // Navegador no soportado
      return;
    }

    const currentPermission = Notification.permission;
    setPermissionState(currentPermission);

    // Si ya tiene permisos, renovamos el token silenciosamente
    if (currentPermission === 'granted' && user?.uid) {
      requestAndSaveFCMToken(user.uid).catch(console.error);
    }
  }, [user?.uid]);

  const handleActivate = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    const success = await requestAndSaveFCMToken(user.uid);
    setIsLoading(false);

    if (success) {
      setPermissionState('granted');
    } else {
      // Si el usuario bloqueó, actualizamos el estado para ocultar el banner
      setPermissionState(Notification.permission);
    }
  };

  if (permissionState !== 'default' || isDismissed || !user) {
    return null;
  }

  return (
    <div className="bg-linear-to-r from-primary/10 to-transparent border border-primary/20 rounded-2xl p-4 mb-5 relative animate-in fade-in zoom-in-95 duration-300">
      <button 
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 p-1 text-text-muted hover:text-text rounded-full transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex gap-4">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text">Recordatorio de Pesaje</h3>
          <p className="text-xs text-text-muted mt-1 mb-3">
            Activa las notificaciones para que no olvides subir tu foto y peso cada lunes.
          </p>
          <button 
            onClick={handleActivate}
            disabled={isLoading}
            className="text-xs font-black bg-primary text-bg px-4 py-2 rounded-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Activando...' : 'Activar Recordatorios'}
          </button>
        </div>
      </div>
    </div>
  );
}
