import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '@ui/hooks/usePWAInstall';
import { useToast } from '@ui/hooks/useToast';

const SESSION_KEY = 'forja:install-toast-shown';
const SHOW_DELAY_MS = 2000;
const HIDDEN_ROUTES = ['/login', '/workout'];

/**
 * Toast que invita a instalar la PWA. Sube desde abajo, una sola vez por visita,
 * y solo si la app aún no está instalada y el dispositivo puede instalarla.
 */
export function InstallPromptToast() {
  const { isInstalled, isIOS, canPromptDirectly, installApp } = usePWAInstall();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  const hiddenRoute = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));
  const eligible = !isInstalled && (canPromptDirectly || isIOS) && !hiddenRoute;

  // Mostrar una sola vez por sesión, con un pequeño retraso tras entrar
  useEffect(() => {
    if (!eligible || visible) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, '1');
      setVisible(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [eligible, visible]);

  // Ocultar si se instala o si se entra a una ruta donde no debe mostrarse
  useEffect(() => {
    if (visible && (isInstalled || hiddenRoute)) setVisible(false);
  }, [visible, isInstalled, hiddenRoute]);

  if (!visible) return null;

  const handleInstall = async () => {
    // iOS / sin prompt nativo: llevar a Configuración, donde está la guía paso a paso
    if (!canPromptDirectly) {
      setVisible(false);
      navigate('/profile');
      return;
    }
    try {
      setInstalling(true);
      const { success } = await installApp();
      if (success) addToast('¡Forja se ha instalado con éxito!', 'success');
      setVisible(false);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-20 z-100 flex justify-center px-4 pointer-events-none">
      <div
        role="dialog"
        aria-label="Instalar Forja"
        className="relative pointer-events-auto w-full max-w-sm rounded-2xl p-px overflow-hidden shadow-2xl shadow-black/60 animate-in slide-in-from-bottom-10 fade-in duration-500"
      >
        {/* Borde iluminado morado → naranja */}
        <div className="absolute inset-0 bg-linear-to-r from-primary/60 via-primary/20 to-highlight/50" />

        <div className="relative z-10 flex items-center gap-3.5 rounded-2xl bg-bg/95 backdrop-blur-xl px-4 py-3.5 border border-white/5 overflow-hidden">
          {/* Resplandores internos */}
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/25 blur-2xl pointer-events-none" />
          <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-highlight/15 blur-2xl pointer-events-none" />

          <div className="relative shrink-0 w-11 h-11 rounded-xl bg-linear-to-br from-primary to-primary-hover flex items-center justify-center text-white shadow-lg shadow-primary/40">
            <Smartphone className="w-5 h-5" />
          </div>

          <div className="relative flex-1 min-w-0">
            <p className="text-sm font-black text-text leading-tight">Instala Forja</p>
            <p className="text-xs text-text-muted leading-snug mt-0.5">
              Entrena sin conexión y con acceso rápido.
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="relative shrink-0 h-9 px-4 rounded-xl bg-highlight text-white text-xs font-bold hover:bg-highlight-hover glow-highlight active:scale-95 transition-all disabled:opacity-60 cursor-pointer"
          >
            {installing ? 'Instalando…' : 'Instalar'}
          </button>

          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Cerrar"
            className="relative shrink-0 -mr-1 w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

