import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import type { WorkoutSession } from '../../../shared/types';

interface ProgressPreviewCardProps {
  sessions: WorkoutSession[];
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

function getBest1RM(sessions: WorkoutSession[]): number {
  let best1RM = 0;
  sessions.forEach(s => {
    (s.sets ?? []).forEach(set => {
      const rm = (set.weight ?? 0) * (1 + (set.reps ?? 0) / 30);
      if (rm > best1RM) best1RM = rm;
    });
  });
  return best1RM;
}

export function ProgressPreviewCard({ sessions }: ProgressPreviewCardProps) {
  const navigate = useNavigate();

  const thisWeekVol = getWeekVolume(sessions, 0);
  const lastWeekVol = getWeekVolume(sessions, 1);
  const trainedDays = getTrainedDaysThisWeek(sessions);
  const best1RM = getBest1RM(sessions);
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

  return (
    <button
      onClick={() => navigate('/progress')}
      className="w-full text-left rounded-3xl border border-border bg-surface p-5 hover:border-primary/40 transition-all active:scale-[0.98] shadow-sm flex flex-col gap-5"
    >
      <div className="flex justify-between items-start">
        {/* Volumen Semanal */}
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">Volumen Semanal</p>
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

        {/* 1RM Histórico Reciente */}
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">1RM (8 sem)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-text">
              {best1RM > 0 ? `${formatKg(best1RM)} kg` : '--'}
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
  );
}
