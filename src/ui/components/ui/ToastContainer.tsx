import { useToast } from '@ui/hooks/useToast';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-3 w-[90%] max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isSuccess = toast.type === 'success';
        
        // Colores y glows basados en el diseño de la pantalla de carga
        const glowColor = isError ? 'rgba(239,68,68,0.6)' : isSuccess ? 'rgba(249,115,22,0.6)' : 'rgba(139,92,246,0.6)';
        const iconColor = isError ? 'text-danger' : isSuccess ? 'text-highlight' : 'text-primary';
        const bgGlowClass = isError ? 'bg-danger/20' : isSuccess ? 'bg-highlight/20' : 'bg-primary/20';
        const shimmerVia = isError ? 'via-danger' : isSuccess ? 'via-highlight' : 'via-primary';
        const borderGradient = isError ? 'from-danger/40' : isSuccess ? 'from-highlight/40' : 'from-primary/40';
        
        return (
          <div 
            key={toast.id}
            className="relative pointer-events-auto rounded-2xl p-px shadow-2xl animate-in slide-in-from-top-5 fade-in duration-500 overflow-hidden"
          >
            {/* Borde exterior iluminado (padding p-[1px] revela el fondo de este contenedor) */}
            <div className={`absolute inset-0 bg-linear-to-r ${borderGradient} to-transparent opacity-70`} />
            
            {/* Contenedor Principal Oscuro */}
            <div className="relative bg-bg/95 backdrop-blur-xl rounded-2xl flex items-center gap-4 px-4 py-4 z-10 w-full h-full border border-white/5">
              
              {/* Resplandor desenfocado interno (Glow) */}
              <div className={`absolute -left-4 top-1/2 -translate-y-1/2 w-16 h-16 ${bgGlowClass} rounded-full blur-2xl pointer-events-none`} />

              {/* Icono Neón */}
              <div className="relative shrink-0 flex items-center justify-center">
                {isError && <AlertCircle className={`w-6 h-6 ${iconColor}`} style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }} />}
                {isSuccess && <CheckCircle className={`w-6 h-6 ${iconColor}`} style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }} />}
                {!isError && !isSuccess && <Info className={`w-6 h-6 ${iconColor}`} style={{ filter: `drop-shadow(0 0 10px ${glowColor})` }} />}
              </div>
              
              {/* Texto elegante */}
              <p className="flex-1 text-sm font-bold tracking-wide text-transparent bg-clip-text bg-linear-to-r from-white via-white/90 to-white/60">
                {toast.message}
              </p>
              
              {/* Botón Cerrar */}
              <button 
                onClick={() => removeToast(toast.id)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0 active:scale-95 z-20"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Barra Shimmer animada inferior (estilo Forja) */}
              <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white/5 overflow-hidden rounded-b-2xl">
                <div 
                  className={`h-full w-1/2 bg-linear-to-r from-transparent ${shimmerVia} to-transparent rounded-full`}
                  style={{ animation: 'forjaToastShimmer 1.5s ease-in-out infinite' }}
                />
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes forjaToastShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
