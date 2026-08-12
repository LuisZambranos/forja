import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Play, History, Dumbbell } from 'lucide-react';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import { where, orderBy, limit } from 'firebase/firestore';
import type { Routine, WorkoutSession } from '../../shared/types';
import { auth } from '../../shared/firebase/config';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: routines = [], isLoading: loadingRoutines } = useFirestoreQuery<Routine>(
    ['routines', user?.uid],
    'routines',
    [where('owner_id', '==', user?.uid)],
    1000 * 60 * 5 // 5 min stale time
  );

  const { data: sessions = [], isLoading: loadingSessions } = useFirestoreQuery<WorkoutSession>(
    ['sessions', user?.uid],
    'workout_sessions',
    [where('owner_id', '==', user?.uid), orderBy('finished_at', 'desc'), limit(5)],
    1000 * 60 // 1 min stale time
  );

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div>
          <h1 className="text-2xl font-bold">Hola, {user?.display_name || user?.email?.split('@')[0]}</h1>
          <p className="text-text-muted">¿Listo para forjar acero?</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => auth.signOut()}>Salir</Button>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/routines/new" className="block">
          <Card className="flex flex-col items-center justify-center p-6 h-full border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
            <Plus className="text-primary mb-2" />
            <span className="font-medium">Nueva Rutina</span>
          </Card>
        </Link>
        <Link to="/exercises" className="block">
          <Card className="flex flex-col items-center justify-center p-6 h-full hover:bg-surface-alt transition-colors">
            <Dumbbell className="text-secondary mb-2" />
            <span className="font-medium">Ejercicios</span>
          </Card>
        </Link>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-primary" />
          Tus Rutinas
        </h2>
        {loadingRoutines ? (
          <p className="text-text-muted">Cargando rutinas...</p>
        ) : routines.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-text-muted mb-4">No tienes rutinas aún.</p>
            <Link to="/routines/new">
              <Button size="sm">Crear primera rutina</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {routines.map(r => (
              <Card key={r.id} className="flex justify-between items-center p-4">
                <span className="font-medium">{r.name}</span>
                <Link to={`/workout/${r.id}`}>
                  <Button size="sm">Iniciar</Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-secondary" />
          Historial Reciente
        </h2>
        {loadingSessions ? (
          <p className="text-text-muted">Cargando historial...</p>
        ) : sessions.length === 0 ? (
          <p className="text-text-muted">Aún no hay entrenamientos registrados.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map(s => (
              <Card key={s.id} className="p-4 flex justify-between items-center opacity-80">
                <div>
                  <div className="text-sm text-text-muted">
                    {new Date(s.finished_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-text-muted mt-1">
                    {Math.floor(s.duration_seconds / 60)} min • {s.sets.length} series
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
