import { useState } from 'react';
import { Smartphone, Download, CheckCircle2, Share, PlusSquare, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '@ui/hooks/usePWAInstall';
import { useToast } from '@ui/hooks/useToast';
import { Modal } from '@ui/components/ui/Modal';
import { Button } from '@ui/components/ui/Button';

interface InstallPWAButtonProps {
  className?: string;
  subtitle?: string;
}

export function InstallPWAButton({
  className = '',
  subtitle = 'Para entrenar sin conexión y acceso rápido',
}: InstallPWAButtonProps) {
  const { isInstalled, isIOS, canPromptDirectly, installApp } = usePWAInstall();
  const { addToast } = useToast();
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleClick = async () => {
    // Si ya está instalada, no se requiere acción
    if (isInstalled) return;

    // Si podemos lanzar el prompt nativo directamente (Android / Chrome / Edge)
    if (canPromptDirectly) {
      try {
        setIsInstalling(true);
        const { success, reason } = await installApp();
        if (success) {
          addToast('¡Forja se ha instalado con éxito!', 'success');
        } else if (reason === 'manual_instructions') {
          setShowInstructionsModal(true);
        }
      } finally {
        setIsInstalling(false);
      }
      return;
    }

    // Si es iOS o navegador sin soporte de prompt directo
    setShowInstructionsModal(true);
  };

  // Si ya está instalada en modo standalone
  if (isInstalled) {
    return (
      <div
        className={`w-full flex items-center justify-between p-4 rounded-2xl bg-surface/60 border border-success/30 select-none ${className}`}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-success/15 border border-success/30 flex items-center justify-center text-success shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-sm font-bold text-text">App instalada</span>
            <span className="block text-xs text-text-muted">
              Estás usando la versión oficial instalada
            </span>
          </div>
        </div>
        <span className="text-[11px] font-bold text-success bg-success/15 border border-success/30 px-2.5 py-1 rounded-full shrink-0">
          Activa ✓
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        className={`relative overflow-hidden w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-primary/30 bg-linear-to-br from-primary/20 via-surface to-surface hover:border-primary/60 transition-all duration-200 active:scale-[0.98] text-left cursor-pointer group shadow-[0_0_24px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] hover:shadow-[0_0_28px_color-mix(in_srgb,var(--color-primary)_35%,transparent)] disabled:opacity-60 ${className}`}
      >
        {/* Resplandor decorativo */}
        <span className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-primary/25 blur-3xl" />

        <div className="relative flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-primary to-primary-hover flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="block text-sm font-black text-text">Instalar la app</span>
            <span className="block text-xs text-text-muted leading-snug">{subtitle}</span>
          </div>
        </div>

        <span className="relative shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-primary text-white text-xs font-bold group-hover:bg-primary-hover transition-colors">
          {isInstalling ? (
            <span className="animate-spin block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Instalar
        </span>
      </button>

      {/* Modal de instrucciones para iOS o navegadores sin prompt directo */}
      <Modal
        isOpen={showInstructionsModal}
        onClose={() => setShowInstructionsModal(false)}
        title="Instalar Forja en tu dispositivo"
        footer={
          <Button
            variant="primary"
            fullWidth
            onClick={() => setShowInstructionsModal(false)}
            className="rounded-xl font-bold"
          >
            Entendido
          </Button>
        }
      >
        <div className="space-y-4 text-sm text-text">
          <p className="text-text-muted text-xs leading-relaxed">
            Instala la aplicación en tu pantalla de inicio para disfrutar de la experiencia a pantalla completa, entrenar sin conexión y acceder más rápido.
          </p>

          {isIOS ? (
            <div className="space-y-3 bg-surface-alt/50 border border-border p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  En Safari, pulsa el botón de <strong className="text-text font-bold">Compartir</strong>{' '}
                  <Share className="w-4 h-4 inline-block text-primary mx-0.5" /> situado en la barra inferior.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Desliza hacia abajo en el menú y selecciona{' '}
                  <strong className="text-text font-bold">"Añadir a pantalla de inicio"</strong>{' '}
                  <PlusSquare className="w-4 h-4 inline-block text-primary mx-0.5" />.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pulsa <strong className="text-text font-bold">"Añadir"</strong> en la esquina superior derecha para finalizar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-surface-alt/50 border border-border p-4 rounded-2xl">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pulsa en el icono de menú de tu navegador{' '}
                  <strong className="text-text font-bold">(los tres puntos <MoreVertical className="w-3.5 h-3.5 inline-block text-primary" />)</strong> arriba a la derecha.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Elige la opción <strong className="text-text font-bold">"Instalar aplicación"</strong> o{' '}
                  <strong className="text-text font-bold">"Añadir a la pantalla principal"</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-xs text-text-muted leading-relaxed">
                  Confirma la instalación y ábrela directamente desde tu menú o pantalla de inicio.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

