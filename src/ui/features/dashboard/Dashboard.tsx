import logoNoBg from '../../../assets/logo-removebg.png';
import { useAuth } from '@ui/hooks/useAuth';
import { useUserProfile } from '@ui/hooks/useUser';
import { useMyRoutines } from '@ui/hooks/useRoutines';
import { useWorkoutSessions } from '@ui/hooks/useWorkout';
import { StreakCard } from './components/StreakCard';
import { DailyQuoteCard } from './components/DailyQuoteCard';
import { ProgressPreviewCard } from './components/ProgressPreviewCard';
import { WorkoutCTA } from './components/WorkoutCTA';
import { RecentHistory } from './components/RecentHistory';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Perfil
  const { data: userProfile = null, error: profileError } = useUserProfile(user?.uid);
  if (profileError) {
    console.error('[Dashboard] profileError presente:', profileError);
  }

  // Rutinas
  const { data: routines = [], isLoading: loadingRoutines } = useMyRoutines(user?.uid);

  // Sesiones (últimas 8 semanas)
  const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000;
  const { 
    data: sessions = [], 
    isLoading: loadingSessions, 
    error: sessionsError, 
    refetch: refetchSessions 
  } = useWorkoutSessions(user?.uid, EIGHT_WEEKS_MS);

  const recentSessions = sessions.slice(0, 3);

  const todayDayOfWeek = new Date().getDay();
  const todaysRoutine = routines.find(r => r.scheduled_days?.includes(todayDayOfWeek));

  return (
    <div className="max-w-lg mx-auto min-h-dvh flex flex-col">

      {/* ── AppBar ── */}
      <header className="flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4">
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
        <ProgressPreviewCard sessions={sessions} error={sessionsError} refetch={refetchSessions} />

        {/* ── Historial reciente (máx 3) ── */}
        <RecentHistory loadingSessions={loadingSessions} recentSessions={recentSessions} error={sessionsError} refetch={refetchSessions} />

        {/* ── Academia CTA ── */}
        <div 
          onClick={() => navigate('/academy')}
          className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden group cursor-pointer active:scale-95 transition-all mb-4"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary/20" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-text leading-tight">Academia Forjador</h3>
              <p className="text-xs text-text-muted mt-1">Aprende a escuchar tu cuerpo</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

