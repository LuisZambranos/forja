import { Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import type { WorkoutSession } from '../../../shared/types';

interface RecentHistoryProps {
  loadingSessions: boolean;
  recentSessions: WorkoutSession[];
}

function formatRelativeDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `Hace ${mins} min`;
  if (hrs < 24) return `Hace ${hrs}h`;
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

export function RecentHistory({ loadingSessions, recentSessions }: RecentHistoryProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">Historial Reciente</h2>
      </div>

      {loadingSessions ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : recentSessions.length === 0 ? (
        <p className="text-sm text-text-muted italic px-1">
          Aquí aparecerán tus entrenamientos completados.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recentSessions.map(s => {
            const mins = Math.floor(s.duration_seconds / 60);
            const setsCount = s.sets?.length || 0;
            return (
              <Card key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-text">{formatRelativeDate(s.finished_at)}</p>
                  <p className="text-xs text-text-muted mt-0.5">{setsCount} series completadas</p>
                </div>
                <div className="flex items-center gap-1 text-text-muted">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">{mins} min</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
