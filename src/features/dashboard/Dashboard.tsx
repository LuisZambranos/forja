import logoNoBg from '../../assets/logo-removebg.png';
import { useAuth } from '../../hooks/useAuth';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import { where, orderBy } from 'firebase/firestore';
import type { Routine, WorkoutSession, User } from '../../shared/types';
import { StreakCard } from './components/StreakCard';
import { DailyQuoteCard } from './components/DailyQuoteCard';
import { ProgressPreviewCard } from './components/ProgressPreviewCard';
import { WorkoutCTA } from './components/WorkoutCTA';
import { RecentHistory } from './components/RecentHistory';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { user } = useAuth();

  const { data: profiles = [] } = useFirestoreQuery<User>(
    ['profile', user?.uid],
    'users',
    user?.uid ? [where('uid', '==', user.uid)] : [],
    1000 * 60 * 30
  );
  
  const userProfile = profiles[0] || null;

  const { data: routines = [], isLoading: loadingRoutines } = useFirestoreQuery<Routine>(
    ['routines', user?.uid],
    'routines',
    [where('owner_id', '==', user?.uid)],
    1000 * 60 * 5
  );

  // Consultamos sesiones de las últimas 8 semanas para métricas y stats (1RM, Volumen)
  const eightWeeksAgo = Date.now() - (8 * 7 * 24 * 60 * 60 * 1000);
  const { data: sessions = [], isLoading: loadingSessions } = useFirestoreQuery<WorkoutSession>(
    ['stats_sessions', user?.uid],
    'workout_sessions',
    [
      where('owner_id', '==', user?.uid), 
      where('finished_at', '>=', eightWeeksAgo), 
      orderBy('finished_at', 'desc')
    ],
    1000 * 60 * 15 // Cache de 15 minutos según Fase 1
  );

  const recentSessions = sessions.slice(0, 3);

  const todayDayOfWeek = new Date().getDay();
  const todaysRoutine = routines.find(r => r.scheduled_days?.includes(todayDayOfWeek));

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">

      {/* ── AppBar ── */}
      <header className="flex items-center justify-between px-4 pt-4 pb-4">
        <div className="flex items-center gap-1">
          <img src={logoNoBg} alt="Forja Logo" className="w-14 h-14 object-contain" />
          <span className="text-xl font-black tracking-widest text-primary uppercase">Forja</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">{getGreeting()}</p>
          <p className="text-sm font-bold text-text truncate max-w-37.5">{user?.display_name}</p>
        </div>
      </header>

      {/* Separador */}
      <div className="h-px bg-linear-to-r from-transparent via-primary/40 to-transparent mx-4 mb-6" />

      <div className="flex-1 px-4 pb-24 flex flex-col gap-5">

        {/* ── Racha ── */}
        <StreakCard 
          currentStreak={userProfile?.current_streak || 0}
          lastWorkoutDate={userProfile?.last_workout_date || ''}
        />

        {/* ── Frase del día ── */}
        <DailyQuoteCard />


        {/* ── CTA: Rutina de hoy ── */}
        <WorkoutCTA loadingRoutines={loadingRoutines} todaysRoutine={todaysRoutine} routines={routines} />

        {/* ── Card de progreso ── */}
        <ProgressPreviewCard sessions={sessions} />

        {/* ── Historial reciente (máx 3) ── */}
        <RecentHistory loadingSessions={loadingSessions} recentSessions={recentSessions} />

      </div>
    </div>
  );
}
