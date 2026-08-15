import { calculateStreakStatus } from '@ui/features/dashboard/utils/streakUtils';

interface StreakCardProps {
  currentStreak: number;
  lastWorkoutDate: string;
}

export function StreakCard({ currentStreak, lastWorkoutDate }: StreakCardProps) {
  const streak = calculateStreakStatus(currentStreak, lastWorkoutDate);

  const isLegend = streak.level === 'legend';
  const isElite = ['year', 'twoYears', 'legend'].includes(streak.level);
  const hasSomeStreak = streak.days > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 select-none
        ${isLegend
          ? 'border-purple-500/60 bg-linear-to-br from-purple-900/40 via-black to-purple-950/30'
          : isElite
          ? 'border-purple-500/30 bg-linear-to-br from-purple-900/20 via-black to-amber-900/10'
          : hasSomeStreak
          ? 'border-highlight/30 bg-linear-to-br from-highlight/10 via-black to-orange-900/10'
          : 'border-border bg-surface'
        }
      `}
    >
      {/* Glow de fondo animado */}
      {hasSomeStreak && (
        <div
          className={`absolute inset-0 pointer-events-none opacity-20
            ${isLegend ? 'animate-pulse bg-radial-to-r from-purple-500 to-transparent' : ''}
            ${isElite && !isLegend ? 'bg-radial-to-r from-purple-500/50 to-transparent' : ''}
            ${!isElite ? 'bg-radial-to-r from-orange-500/50 to-transparent' : ''}
          `}
        />
      )}

      {/* Partículas decorativas */}
      {isLegend && (
        <>
          <span className="absolute top-2 right-10 text-lg animate-bounce delay-100">✨</span>
          <span className="absolute top-8 right-4 text-xs animate-bounce delay-300">⭐</span>
          <span className="absolute bottom-4 left-12 text-base animate-bounce delay-500">✨</span>
        </>
      )}

      <div className="relative flex items-center justify-between gap-4">
        {/* Número de racha */}
        <div className="flex flex-col">
          <div className="flex items-end gap-2 leading-none mb-1">
            <span
              className={`font-black tabular-nums leading-none transition-all
                ${streak.days >= 365 ? 'text-6xl' : streak.days >= 30 ? 'text-5xl' : 'text-5xl'}
                ${streak.color}
                ${isLegend ? 'drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]' : ''}
                ${isElite && !isLegend ? 'drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]' : ''}
                ${!isElite && hasSomeStreak ? 'drop-shadow-[0_0_12px_rgba(249,115,22,0.5)]' : ''}
              `}
            >
              {streak.days}
            </span>
            <span className="text-xl font-bold text-text-muted mb-1">
              {streak.days === 1 ? 'día' : 'días'}
            </span>
          </div>
          <p className={`font-black text-base leading-tight ${streak.color}`}>
            {streak.message}
          </p>
          <p className="text-xs text-text-muted mt-0.5 font-medium">
            {streak.subMessage}
          </p>

          {/* Badge "Hoy asegurado" */}
          {streak.trainedToday && (
            <div className="flex items-center gap-1 mt-2 bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Hoy asegurado
            </div>
          )}
        </div>

        {/* Emoji / ícono de nivel */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0
            text-5xl select-none transition-all
            ${isLegend
              ? 'bg-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse'
              : isElite
              ? 'bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
              : hasSomeStreak
              ? 'bg-highlight/10 shadow-[0_0_20px_rgba(249,115,22,0.3)]'
              : 'bg-surface-alt'
            }
          `}
        >
          <span
            className={hasSomeStreak ? 'animate-bounce' : 'opacity-40'}
            style={{ animationDuration: isLegend ? '0.8s' : '2s' }}
          >
            {streak.emoji}
          </span>
        </div>
      </div>

      {/* Barra de progreso hacia siguiente milestone */}
      {hasSomeStreak && streak.level !== 'legend' && (
        <div className="mt-4">
          {(() => {
            const milestones = [1, 7, 14, 30, 60, 90, 180, 365, 730];
            const next = milestones.find(m => m > streak.days) ?? 730;
            const prev = milestones.filter(m => m <= streak.days).pop() ?? 0;
            const pct = Math.min(100, ((streak.days - prev) / (next - prev)) * 100);
            return (
              <>
                <div className="flex justify-between text-[10px] text-text-muted font-bold mb-1 uppercase tracking-wide">
                  <span>{streak.days} días</span>
                  <span>Meta: {next} días</span>
                </div>
                <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700
                      ${isElite ? 'bg-linear-to-r from-purple-500 to-purple-300' : 'bg-linear-to-r from-highlight to-amber-400'}
                    `}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
