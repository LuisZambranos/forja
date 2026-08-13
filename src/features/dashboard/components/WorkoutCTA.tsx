import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import type { Routine } from '../../../shared/types';

interface WorkoutCTAProps {
  loadingRoutines: boolean;
  todaysRoutine?: Routine;
  routines: Routine[];
}

export function WorkoutCTA({ loadingRoutines, todaysRoutine, routines }: WorkoutCTAProps) {
  const navigate = useNavigate();

  if (loadingRoutines) {
    return <div className="skeleton h-24 rounded-2xl w-full" />;
  }

  if (todaysRoutine) {
    return (
      <button
        onClick={() => navigate(`/workout/${todaysRoutine.id}`)}
        className="w-full rounded-2xl p-5 text-left relative overflow-hidden
          bg-linear-to-br from-highlight/20 via-highlight/5 to-transparent
          border border-highlight/30 hover:border-highlight/50 transition-all active:scale-95"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-highlight font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-highlight animate-pulse" /> Toca Hoy
            </p>
            <h2 className="text-2xl font-black text-text">{todaysRoutine.name}</h2>
            <p className="text-sm text-text-muted mt-1">{todaysRoutine.exercises.length} ejercicios</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-highlight flex items-center justify-center glow-highlight shadow-lg shadow-highlight/20">
            <Zap className="w-7 h-7 text-white" fill="currentColor" />
          </div>
        </div>
      </button>
    );
  }

  if (routines.length > 0) {
    return (
      <button
        onClick={() => navigate(`/workout/${routines[0].id}`)}
        className="w-full rounded-2xl p-5 text-left relative overflow-hidden
          bg-linear-to-br from-primary/20 via-primary/5 to-transparent
          border border-primary/30 hover:border-primary/50 transition-all active:scale-95"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">Rutina Reciente</p>
            <h2 className="text-2xl font-black text-text">{routines[0].name}</h2>
            <p className="text-sm text-text-muted mt-1">{routines[0].exercises.length} ejercicios</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Zap className="w-6 h-6" fill="currentColor" />
          </div>
        </div>
      </button>
    );
  }

  return null;
}
