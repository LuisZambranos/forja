import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Plus, Zap, Clock, Pencil } from 'lucide-react';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import { where, orderBy, limit } from 'firebase/firestore';
import type { Routine, WorkoutSession, User } from '../../shared/types';

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

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useFirestoreQuery<User>(
    ['profile', user?.uid],
    'users',
    user?.uid ? [where('uid', '==', user.uid)] : [],
    1000 * 60 * 30
  );

  const { data: routines = [], isLoading: loadingRoutines } = useFirestoreQuery<Routine>(
    ['routines', user?.uid],
    'routines',
    [where('owner_id', '==', user?.uid)],
    1000 * 60 * 5
  );

  const { data: sessions = [], isLoading: loadingSessions } = useFirestoreQuery<WorkoutSession>(
    ['sessions', user?.uid],
    'workout_sessions',
    [where('owner_id', '==', user?.uid), orderBy('finished_at', 'desc'), limit(5)],
    1000 * 60
  );

  const todayDayOfWeek = new Date().getDay();
  const todaysRoutine = routines.find(r => r.scheduled_days?.includes(todayDayOfWeek));

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">

      {/* ── AppBar ── */}
      <header className="flex items-center justify-between px-4 pt-6 pb-4">
        {/* Logo izquierdo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <span className="text-xl font-black tracking-widest text-primary uppercase">Forja</span>
        </div>
        {/* Saludo + nombre derecha */}
        <div className="text-right">
          <p className="text-xs text-text-muted">{getGreeting()}</p>
          <p className="text-sm font-bold text-text truncate max-w-37.5">{user?.display_name}</p>
        </div>
      </header>

      {/* ── Separador naranja —único uso puntual para delimitar header ── */}
      <div className="h-px bg-linear-to-r from-transparent via-primary/40 to-transparent mx-4 mb-6" />

      <div className="flex-1 px-4 pb-4 flex flex-col gap-6">

        {/* ── CTA principal: iniciar rutina de hoy o última ── */}
        {!loadingRoutines && (
          todaysRoutine ? (
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
                  <p className="text-sm text-text-muted mt-1">
                    {todaysRoutine.exercises.length} ejercicios
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-highlight flex items-center justify-center glow-highlight shadow-lg shadow-highlight/20">
                  <Zap className="w-7 h-7 text-white" fill="currentColor" />
                </div>
              </div>
            </button>
          ) : routines.length > 0 ? (
            <button
              onClick={() => navigate(`/workout/${routines[0].id}`)}
              className="w-full rounded-2xl p-5 text-left relative overflow-hidden
                bg-linear-to-br from-primary/20 via-primary/5 to-transparent
                border border-primary/30 hover:border-primary/50 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-1">
                    Rutina Reciente
                  </p>
                  <h2 className="text-2xl font-black text-text">{routines[0].name}</h2>
                  <p className="text-sm text-text-muted mt-1">
                    {routines[0].exercises.length} ejercicios
                  </p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
                  <Zap className="w-6 h-6" fill="currentColor" />
                </div>
              </div>
            </button>
          ) : null
        )}

        {/* ── Accesos rápidos ── */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/routines/new">
            <Card className="flex flex-col items-center justify-center py-5 gap-2
              border-primary/30 hover:bg-primary/10 transition-colors active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-semibold">Nueva Rutina</span>
            </Card>
          </Link>
          <Link to="/exercises">
            <Card className="flex flex-col items-center justify-center py-5 gap-2
              hover:bg-surface-alt transition-colors active:scale-95">
              <div className="w-10 h-10 rounded-xl bg-surface-alt flex items-center justify-center">
                <span className="text-xl">🏋️</span>
              </div>
              <span className="text-sm font-semibold text-text-muted">Ejercicios</span>
            </Card>
          </Link>
        </div>

        {/* ── Tus rutinas ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Tus Rutinas
            </h2>
            <Link to="/routines/new" className="text-xs text-primary font-semibold">+ Nueva</Link>
          </div>

          {loadingRoutines ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : routines.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-3xl mb-2">🏗️</p>
              <p className="text-text-muted text-sm mb-4">Aún no tienes rutinas.</p>
              <Link to="/routines/new">
                <Button size="sm" variant="secondary">Crear primera rutina</Button>
              </Link>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {routines.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4
                  bg-surface border border-border rounded-2xl shadow-sm">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-text text-lg leading-tight">{r.name}</p>
                    <p className="text-xs text-text-muted mt-1 font-medium">{r.exercises.length} ejercicios</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link to={`/routines/${r.id}/edit`}>
                      <button className="w-10 h-10 rounded-xl bg-surface-alt text-text-muted hover:text-text hover:bg-surface-alt/80 transition-colors flex items-center justify-center active:scale-95 border border-border">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link to={`/workout/${r.id}`}>
                      <button className="h-10 px-4 rounded-xl bg-highlight/10 text-highlight hover:bg-highlight hover:text-white border border-highlight/20 hover:border-highlight transition-colors flex items-center justify-center font-bold text-sm active:scale-95">
                        <Zap className="w-4 h-4 mr-1" fill="currentColor" />
                        Comenzar
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Historial reciente ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Historial Reciente
            </h2>
          </div>

          {loadingSessions ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-text-muted italic px-1">
              Aquí aparecerán tus entrenamientos completados.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map(s => {
                const mins = Math.floor(s.duration_seconds / 60);
                const setsCount = s.sets?.length || 0;
                return (
                  <Card key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {formatRelativeDate(s.finished_at)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {setsCount} series completadas
                      </p>
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
      </div>
    </div>
  );
}
