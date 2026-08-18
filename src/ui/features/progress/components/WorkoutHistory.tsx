import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@ui/hooks/useAuth';
import { useWorkoutHistoryInfinite } from '@ui/hooks/useWorkout';
import { useDeleteWorkoutSession } from '@ui/hooks/useWorkout';
import { useMyExercises, useGlobalExercises } from '@ui/hooks/useExercises';
import type { WorkoutSession } from '@core/models';
import { CalendarDays, Clock, Dumbbell, X, Trophy, Trash2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// ──────────────────────────────────────────────
// Helpers y Formateo
// ──────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m} min`;
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function getTonnageComparisons(tonnage: number) {
  if (tonnage >= 5000) return 'El peso de un camión 🚚';
  if (tonnage >= 3000) return 'Un elefante asiático 🐘';
  if (tonnage >= 2000) return 'Un rinoceronte blanco 🦏';
  if (tonnage >= 1000) return 'Un coche pequeño 🚗';
  if (tonnage >= 500) return 'Un oso pardo gigante 🐻';
  if (tonnage >= 300) return 'Una motocicleta pesada 🏍️';
  if (tonnage >= 100) return 'Un panda adulto 🐼';
  return 'Un buen entrenamiento 💪';
}

// ──────────────────────────────────────────────
// Componente Modal de Detalles
// ──────────────────────────────────────────────
function SessionDetailsModal({ session, onClose, getExerciseName }: { session: WorkoutSession; onClose: () => void; getExerciseName: (id: string) => string }) {
  const { mutate: deleteSession, isPending: isDeleting } = useDeleteWorkoutSession();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Agrupar sets por ejercicio
  const groupedSets = session.sets.reduce((acc, set) => {
    if (!acc[set.exercise_id]) acc[set.exercise_id] = [];
    acc[set.exercise_id].push(set);
    return acc;
  }, {} as Record<string, typeof session.sets>);

  const totalTonnage = session.sets.reduce((acc, s) => acc + ((s.weight || 0) * (s.reps || 0)), 0);

  const handleDelete = () => {
    if (confirmDelete) {
      deleteSession(session.id, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      setConfirmDelete(true);
      // Resetear confirmación si no hacen clic de nuevo rápido
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-bg/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-surface/50">
        <div>
          <h2 className="text-lg font-black text-text">Resumen del Entrenamiento</h2>
          <p className="text-xs text-text-muted">{new Date(session.finished_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
        </div>
        <div className="flex gap-2">
          <button 
             onClick={handleDelete} 
             disabled={isDeleting}
             className={`p-2 rounded-full transition-all flex items-center ${confirmDelete ? 'bg-danger text-white' : 'bg-surface-alt text-danger hover:bg-danger/20'} active:scale-95`}
          >
            <Trash2 className="w-5 h-5" />
            {confirmDelete && <span className="text-xs font-bold pl-1">¿Borrar?</span>}
          </button>
          <button onClick={onClose} className="p-2 bg-surface-alt rounded-full text-text-muted hover:text-text active:scale-95 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Métricas Principales */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center shadow-sm">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Duración</span>
            <span className="text-xl font-black text-text">{formatTime(session.duration_seconds)}</span>
          </div>
          <div className="bg-surface border border-border p-4 rounded-2xl flex flex-col items-center shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-highlight/5 group-hover:bg-highlight/10 transition-colors" />
            <Trophy className="w-5 h-5 text-highlight mb-2" />
            <span className="text-xs text-text-muted uppercase tracking-widest font-bold">Tonelaje</span>
            <span className="text-xl font-black text-text">{totalTonnage.toLocaleString()} kg</span>
          </div>
        </div>

        {/* Ejercicios */}
        <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted">Ejercicios Realizados</h3>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">{Object.keys(groupedSets).length}/{session.exercise_ids?.length || 0} completados</span>
        </div>
        <div className="flex flex-col gap-4">
          {Object.entries(groupedSets).map(([exId, sets], idx) => (
            <div key={exId} className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="bg-surface-alt/50 px-4 py-3 border-b border-border/50 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <h4 className="font-bold text-text truncate">{getExerciseName(exId)}</h4>
              </div>
              <div className="p-2">
                {sets.map((set, sIdx) => (
                  <div key={sIdx} className="flex justify-between items-center py-2 px-4 hover:bg-surface-alt/30 rounded-xl transition-colors">
                    <span className="text-text-muted text-xs font-medium w-16">Serie {sIdx + 1}</span>
                    <span className="text-text font-black text-sm">{set.weight}kg <span className="text-text-muted font-normal text-xs ml-1">× {set.reps}</span></span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Componente Principal: Historial
// ──────────────────────────────────────────────
export function WorkoutHistory() {
  const { user } = useAuth();
  
  // Hooks de datos
  const { data: myExercises = [] } = useMyExercises(user?.uid);
  const { data: globalExercises = [] } = useGlobalExercises();
  const allExercises = [...myExercises, ...globalExercises];

  const getExerciseName = useCallback((id: string) => {
    return allExercises.find(e => e.id === id)?.name || 'Ejercicio Eliminado';
  }, [allExercises]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useWorkoutHistoryInfinite(user?.uid);

  // Observer para Scroll Infinito
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { mutate: deleteSession, isPending: isDeleting } = useDeleteWorkoutSession();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteItem = (e: React.MouseEvent, session: WorkoutSession) => {
    e.stopPropagation();
    if (confirmDeleteId === session.id) {
      deleteSession(session.id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(session.id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const location = useLocation();
  const autoOpenRef = useRef<string | null>((location.state as any)?.openSessionId || null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);

  useEffect(() => {
    if (autoOpenRef.current && status === 'success' && data) {
      const allS = data.pages.flatMap(p => p.data);
      const s = allS.find(x => x.id === autoOpenRef.current);
      if (s) {
        setSelectedSession(s);
        autoOpenRef.current = null; // Evitar que se vuelva a abrir automáticamente
      }
    }
  }, [data, status]);

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-text-muted text-sm font-bold uppercase tracking-widest">Cargando memorias...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-danger/10 border border-danger p-6 rounded-2xl text-center">
        <p className="text-danger font-bold">Ocurrió un error al cargar tu historial.</p>
      </div>
    );
  }

  const pages = data?.pages || [];
  const allSessions = pages.flatMap(page => page.data);
  const isEmpty = allSessions.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-surface border border-border rounded-3xl p-8 text-center flex flex-col items-center gap-4 shadow-sm mt-4">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
          <CalendarDays className="w-8 h-8 text-text-muted" />
        </div>
        <div>
          <h3 className="text-lg font-black text-text mb-1">Un lienzo en blanco</h3>
          <p className="text-sm text-text-muted">Aún no has registrado ningún entrenamiento. ¡Ve al modo Focus y haz historia!</p>
        </div>
      </div>
    );
  }

  // Agrupar por mes y año
  const groupedSessions = allSessions.reduce((acc, session) => {
    const date = new Date(session.finished_at);
    const monthYear = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const formattedMonthYear = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    if (!acc[formattedMonthYear]) acc[formattedMonthYear] = [];
    acc[formattedMonthYear].push(session);
    return acc;
  }, {} as Record<string, WorkoutSession[]>);

  return (
    <div className="relative pt-4 pb-12 animate-in fade-in duration-500">
      
      {/* Timeline Line */}
      <div className="absolute left-6.75 top-8 bottom-0 w-0.5 bg-linear-to-b from-primary/50 via-primary/20 to-transparent" />

      <div className="flex flex-col gap-8">
        {Object.entries(groupedSessions).map(([monthYear, sessions]) => (
          <div key={monthYear} className="flex flex-col gap-6 relative">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest pl-15 sticky top-41 z-40 py-2">
              <span className="bg-bg px-2">{monthYear}</span>
            </h3>
            
            {sessions.map((session) => {
              const tonnage = session.sets.reduce((acc, s) => acc + ((s.weight || 0) * (s.reps || 0)), 0);
              const isEpic = tonnage > 3000; // Resaltar sesiones pesadas
              
              return (
                <div key={session.id} className="relative flex gap-4 w-full group">
                  {/* Timeline Dot */}
                  <div className="relative z-10 flex flex-col items-center shrink-0 mt-2 ml-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                      isEpic 
                        ? 'bg-linear-to-br from-highlight to-amber-600 text-white ring-4 ring-highlight/20 shadow-highlight/30' 
                        : 'bg-surface border-2 border-primary/30 text-text-muted group-hover:border-primary group-hover:text-primary'
                    }`}>
                      {isEpic ? <Trophy className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Card */}
                  <div 
                    onClick={() => setSelectedSession(session)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setSelectedSession(session); }}
                    className={`flex-1 text-left bg-surface border p-4 rounded-3xl shadow-sm transition-all active:scale-[0.98] cursor-pointer ${
                      isEpic 
                        ? 'border-highlight/40 hover:border-highlight hover:bg-surface-alt/80' 
                        : 'border-border hover:border-primary/50 hover:bg-surface-alt/50'
                    }`}
                  >
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-black text-text">{formatDate(session.finished_at)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-muted uppercase font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTime(session.duration_seconds)}
                        </span>
                        <div className="w-px h-3 bg-border" />
                        <button
                          onClick={(e) => handleDeleteItem(e, session)}
                          disabled={isDeleting}
                          className={`p-1.5 rounded-full transition-all flex items-center ${confirmDeleteId === session.id ? 'bg-danger text-white' : 'text-text-muted hover:text-danger hover:bg-danger/20'} active:scale-95`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {confirmDeleteId === session.id && <span className="text-[10px] font-bold pl-1 pr-0.5">¿Borrar?</span>}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-1">Métricas</p>
                        <div className="flex items-end gap-3">
                          <div>
                            <span className={`text-2xl font-black ${isEpic ? 'text-highlight' : 'text-primary'}`}>
                              {(tonnage / 1000).toFixed(1)}<span className="text-sm font-bold ml-0.5">k</span>
                            </span>
                            <span className="text-[10px] text-text-muted block -mt-1">KG TOTAL</span>
                          </div>
                          <div className="h-6 w-px bg-border/50" />
                          <div className="pb-0.5">
                            <span className="text-sm font-bold text-text">{session.sets?.length || 0}</span>
                            <span className="text-[10px] text-text-muted ml-1">SERIES</span>
                          </div>
                          <div className="h-6 w-px bg-border/50" />
                          <div className="pb-0.5">
                            <span className="text-sm font-bold text-text">{session.exercise_ids?.length || 0}</span>
                            <span className="text-[10px] text-text-muted ml-1">EJER.</span>
                          </div>
                        </div>
                      </div>

                      {/* Comparativa Tonnage (Gamificación) */}
                      {tonnage > 100 && (
                        <div className="bg-surface-alt/50 rounded-xl p-2.5 flex items-center gap-2 border border-border/50">
                          <span className="text-lg leading-none shrink-0">{getTonnageComparisons(tonnage).split(' ').pop()}</span>
                          <span className="text-[10px] text-text-muted font-medium leading-tight">
                            Levantaste el peso equivalente a <strong className="text-text">{getTonnageComparisons(tonnage).replace(/ [^\w\s]+$/, '')}</strong>.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Trigger de carga infinita */}
      <div ref={observerTarget} className="py-8 flex justify-center">
        {isFetchingNextPage ? (
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        ) : hasNextPage ? (
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Desliza para ver más</span>
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-50">
            <span className="text-2xl">🏛️</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Llegaste al principio de los tiempos</span>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedSession && (
        <SessionDetailsModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
          getExerciseName={getExerciseName}
        />
      )}
    </div>
  );
}
