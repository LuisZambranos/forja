import { Button } from '@ui/components/ui/Button';
import { Zap } from 'lucide-react';

export interface StreakCelebrationProps {
  isSameDay: boolean;
  isRestored: boolean;
  newStreak: number;
  isDoubleSession?: boolean;
  onClose: () => void;
}

export function StreakCelebration({ isSameDay, isRestored, newStreak, isDoubleSession, onClose }: StreakCelebrationProps) {
  
  if (isSameDay || isDoubleSession) {
    // EXTRA SESSION
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-md">
        <button onClick={onClose} className="absolute top-10 right-6 px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text transition-colors bg-surface-alt/50 rounded-full active:scale-95">Omitir</button>
        <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center">
          <div className="relative mb-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary blur-[60px] opacity-40 animate-pulse" />
            <div className="absolute w-32 h-32 border-4 border-primary/50 rounded-full animate-energy-ripple" />
            <div className="text-[120px] text-primary relative z-10 drop-shadow-[0_0_30px_rgba(45,120,255,0.8)]">
              <Zap className="w-32 h-32 fill-current" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-text mb-3 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-both">
            ¡Sobrecarga de Energía!
          </h2>
          <p className="text-text-muted mb-8 text-lg animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500 fill-mode-both">
            Mantienes tu fuego de <span className="text-primary font-black text-2xl mx-1">{newStreak}</span> {newStreak === 1 ? 'día' : 'días'} seguidos.
          </p>
          <div className="w-full animate-in fade-in duration-1000 delay-1200 fill-mode-both">
            <Button variant="primary" fullWidth size="lg" onClick={onClose} className="h-16 rounded-2xl font-black text-xl shadow-[0_0_20px_rgba(45,120,255,0.4)] transition-all active:scale-95">
              Continuar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isRestored) {
    // NEW STREAK / RESURRECTION
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/95 backdrop-blur-md">
        <button onClick={onClose} className="absolute top-10 right-6 px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text transition-colors bg-surface-alt/50 rounded-full active:scale-95">Omitir</button>
        <div className="flex flex-col items-center justify-center max-w-sm px-6 text-center">
          <div className="relative mb-8">
            <div className="text-[140px] leading-none animate-ignite relative z-10">
              🔥
            </div>
          </div>
          <h2 className="text-4xl font-black text-text mb-3 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-both">
            ¡Nueva Racha!
          </h2>
          <p className="text-text-muted mb-8 text-lg animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500 fill-mode-both">
            Has dado el primer paso. Día <span className="text-highlight font-black text-2xl mx-1">1</span> completado.
          </p>
          <div className="w-full animate-in fade-in duration-1000 delay-1200 fill-mode-both">
            <Button variant="highlight" fullWidth size="lg" onClick={onClose} className="h-16 rounded-2xl font-black text-xl glow-highlight transition-all active:scale-95">
              Continuar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // INCREASE (+1)
  const oldStreak = newStreak - 1;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center bg-bg/95 backdrop-blur-md overflow-hidden">
      <button onClick={onClose} className="absolute top-10 right-6 px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-muted hover:text-text transition-colors bg-surface-alt/50 rounded-full active:scale-95 z-50">Omitir</button>
      
      <div className="flex flex-col items-center justify-center max-w-sm px-6 mx-auto text-center z-10">
        <div className="relative mb-12 flex flex-col items-center">
          <div className="absolute inset-0 bg-highlight blur-[60px] opacity-40 animate-pulse" />
          <div className="text-[140px] leading-none animate-fire-bounce drop-shadow-[0_0_50px_rgba(255,144,0,0.8)] relative z-10">
            🔥
          </div>
          <div className="absolute -top-6 text-success text-4xl font-black animate-float-up-fade drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] opacity-0" style={{ animationDelay: '800ms' }}>
            +1
          </div>
        </div>
        
        <h2 className="text-4xl font-black text-text mb-6 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-both">
          ¡Racha Aumentada!
        </h2>
        
        {/* Old to New Streak Number Animation */}
        <div className="flex items-center justify-center gap-4 mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-500 fill-mode-both text-2xl font-bold text-text-muted">
          <span>{oldStreak} {oldStreak === 1 ? 'día' : 'días'}</span>
          <span className="text-highlight animate-pulse">→</span>
          <span className="text-highlight text-4xl font-black scale-110 drop-shadow-[0_0_15px_rgba(255,144,0,0.4)]">{newStreak} {newStreak === 1 ? 'día' : 'días'}</span>
        </div>
        
        <div className="w-full animate-in fade-in duration-1000 delay-1500 fill-mode-both mb-8">
          <Button variant="highlight" fullWidth size="lg" onClick={onClose} className="h-16 rounded-2xl font-black text-xl glow-highlight transition-all active:scale-95">
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
