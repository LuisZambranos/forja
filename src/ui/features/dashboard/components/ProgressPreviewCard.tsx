import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight, RefreshCw, Info, X } from 'lucide-react';
import type { WorkoutSession } from '@core/models';

interface ProgressPreviewCardProps {
  sessions: WorkoutSession[];
  error?: Error | null;
  refetch?: () => void;
}

function getWeekVolume(sessions: WorkoutSession[], weeksAgo: number): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const start = now - (weeksAgo + 1) * weekMs;
  const end = now - weeksAgo * weekMs;

  return sessions
    .filter(s => s.finished_at >= start && s.finished_at < end)
    .flatMap(s => s.sets ?? [])
    .reduce((acc, set) => acc + (set.weight ?? 0) * (set.reps ?? 0), 0);
}

function getTrainedDaysThisWeek(sessions: WorkoutSession[]): number[] {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekStart = now - weekMs;

  const days = new Set<number>();
  sessions
    .filter(s => s.finished_at >= weekStart)
    .forEach(s => {
      const d = new Date(s.finished_at).getDay();
      days.add(d);
    });

  return Array.from(days);
}

function getAverageTime(sessions: WorkoutSession[], weeksAgo: number): string {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const start = now - (weeksAgo + 1) * weekMs;
  const end = now - weeksAgo * weekMs;

  const weekSessions = sessions.filter(s => s.finished_at >= start && s.finished_at < end);
  if (weekSessions.length === 0) return '--';

  const totalSeconds = weekSessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
  const avgSeconds = totalSeconds / weekSessions.length;
  
  const h = Math.floor(avgSeconds / 3600);
  const m = Math.floor((avgSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ProgressPreviewCard({ sessions, error, refetch }: ProgressPreviewCardProps) {
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState<{title: string, desc: string} | null>(null);

  const thisWeekVol = getWeekVolume(sessions, 0);
  const lastWeekVol = getWeekVolume(sessions, 1);
  const trainedDays = getTrainedDaysThisWeek(sessions);
  const avgTime = getAverageTime(sessions, 0);
  const isEmpty = sessions.length === 0;

  // Tendencia
  let trendPct = 0;
  let trendDir: 'up' | 'down' | 'same' = 'same';
  if (lastWeekVol > 0) {
    trendPct = Math.round(((thisWeekVol - lastWeekVol) / lastWeekVol) * 100);
    if (trendPct > 0) trendDir = 'up';
    else if (trendPct < 0) trendDir = 'down';
  } else if (thisWeekVol > 0) {
    trendDir = 'up';
    trendPct = 100;
  }

  const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  const formatKg = (kg: number) =>
    kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : `${Math.round(kg).toLocaleString()}`;

  if (error) {
    return (
      <div className="w-full rounded-3xl border border-red-500/30 bg-red-500/10 p-5 flex flex-col items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-red-400">Progreso Semanal</p>
        <p className="text-sm text-red-400 font-medium">
          No se pudo cargar las métricas.
        </p>
        {refetch && (
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 
              bg-red-500/15 hover:bg-red-500/25 px-3 py-1.5 rounded-full transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => navigate('/progress')}
        className="w-full text-left rounded-3xl border border-border bg-surface p-5 hover:border-primary/40 transition-all active:scale-[0.98] shadow-sm flex flex-col gap-5 relative overflow-hidden"
      >
        <div className="flex justify-between items-start">
          {/* Volumen Semanal */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Volumen Semanal</p>
              <div 
                className="p-1 rounded-full hover:bg-surface-alt active:bg-surface-alt/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip({
                    title: 'Volumen Semanal',
                    desc: 'Es todo el peso movido sumando las series de la semana (ej: 10kg x 10 reps x 3 series = 300kg). Te ayuda a medir si estás manteniendo o aumentando tu ritmo de trabajo.'
                  });
                }}
              >
                <Info className="w-3.5 h-3.5 text-text-muted" />
              </div>
            </div>
            {isEmpty ? (
              <p className="text-sm text-text-muted">Sin datos</p>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-text">
                  {formatKg(thisWeekVol)} kg
                </span>
                {trendDir !== 'same' && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-bold
                      ${trendDir === 'up' ? 'text-green-400' : 'text-red-400'}
                    `}
                  >
                    {trendDir === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trendPct)}%
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="w-px h-10 bg-border mx-4" />

          {/* Tiempo Promedio */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">Tiempo Prom.</p>
              <div 
                className="p-1 rounded-full hover:bg-surface-alt active:bg-surface-alt/50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTooltip({
                    title: 'Tiempo Promedio',
                    desc: 'El tiempo promedio que han durado tus sesiones esta semana. Útil para optimizar tus descansos y ritmo en el gimnasio.'
                  });
                }}
              >
                <Info className="w-3.5 h-3.5 text-text-muted" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-text">
                {avgTime}
              </span>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-text-muted shrink-0 ml-2" />
        </div>

      {/* Días de la semana */}
      <div className="flex justify-between">
        {DAYS.map((label, idx) => {
          const trained = trainedDays.includes(idx);
          const isToday = new Date().getDay() === idx;
          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all
                  ${trained
                    ? 'bg-highlight text-white shadow-md shadow-highlight/30'
                    : isToday
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-surface-alt text-text-muted'
                  }
                `}
              >
                {label}
              </div>
              {isToday && (
                <span className="w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

        {isEmpty && (
          <p className="text-xs text-text-muted/60 mt-3 italic">
            ¡Tu primera semana será tu primer récord!
          </p>
        )}
      </button>

      {/* Modal / Tooltip para la Info */}
      {activeTooltip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm"
          onClick={() => setActiveTooltip(null)}
        >
          <div 
            className="bg-surface border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 right-4 p-2 bg-surface-alt rounded-full text-text-muted hover:text-text transition-colors"
              onClick={() => setActiveTooltip(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-black text-text mb-2 pr-8 flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {activeTooltip.title}
            </h3>
            <p className="text-sm font-medium text-text-muted leading-relaxed">
              {activeTooltip.desc}
            </p>
            <button 
              className="mt-6 w-full py-3 bg-primary text-white rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-primary/20"
              onClick={() => setActiveTooltip(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

