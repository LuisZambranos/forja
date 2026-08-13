import { Activity, ChevronRight } from 'lucide-react';

export default function Progress() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg max-w-lg mx-auto pb-24">
      <header className="px-4 pt-8 pb-4 flex items-center gap-3 sticky top-0 bg-bg/95 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black text-text tracking-wide">Mi Progreso</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        {/* Ícono decorativo */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-primary/20 to-highlight/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
            <Activity className="w-12 h-12 text-primary" />
          </div>
          <span className="absolute -top-2 -right-2 text-2xl animate-bounce">📈</span>
        </div>

        {/* Título */}
        <div>
          <h2 className="text-2xl font-black text-text mb-2">Próximamente</h2>
          <p className="text-text-muted text-sm leading-relaxed max-w-xs">
            Aquí verás tu evolución completa: gráficas de progresión de fuerza,
            volumen semanal, récords personales y mucho más.
          </p>
        </div>

        {/* Features que vendrán */}
        <div className="w-full flex flex-col gap-2 text-left">
          {[
            { emoji: '📊', label: 'Progresión de fuerza por ejercicio' },
            { emoji: '🏆', label: 'Récords Personales (1RM)' },
            { emoji: '📅', label: 'Historial completo de entrenamientos' },
            { emoji: '⚖️', label: 'Métricas corporales y fotos de progreso' },
            { emoji: '🔥', label: 'Racha histórica y logros desbloqueados' },
          ].map(({ emoji, label }) => (
            <div
              key={label}
              className="flex items-center gap-3 bg-surface/50 border border-border/50 rounded-2xl px-4 py-3 opacity-60"
            >
              <span className="text-xl">{emoji}</span>
              <span className="text-sm font-medium text-text-muted">{label}</span>
              <ChevronRight className="w-4 h-4 text-text-muted ml-auto" />
            </div>
          ))}
        </div>

        <p className="text-xs text-text-muted/50">
          Sigue entrenando. Cada sesión ya se guarda y estará aquí cuando lancemos.
        </p>
      </div>
    </div>
  );
}
