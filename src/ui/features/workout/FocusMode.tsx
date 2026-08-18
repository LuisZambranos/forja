import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@ui/hooks/useAuth';
import { useWorkoutStore } from '../../../store/workoutStore';
import type { Routine, WorkoutSet, WorkoutSession } from '@core/models';
import { Button } from '@ui/components/ui/Button';
import { Modal } from '@ui/components/ui/Modal';
import { Play, Timer, ChevronRight, Check, X, Activity } from 'lucide-react';
import { useMyExercises, useGlobalExercises } from '@ui/hooks/useExercises';
import { useRoutine } from '@ui/hooks/useRoutines';
import { getIncompleteSessionToday } from '@core/services/workout.service';
import { useSaveWorkoutSession, useUpdateWorkoutSession } from '@ui/hooks/useWorkout';
import { getLastExerciseStats } from '@core/services/workout.service';
import { StreakCelebration } from './components/StreakCelebration';

// ──────────────────────────────────────────────
//  Tipos internos del flujo por serie
// ──────────────────────────────────────────────
type Phase = 'resume_prompt' | 'intro' | 'active' | 'resting' | 'completed' | 'streak_celebration';

interface LastTimeStats {
  weight: number;
  reps: number;
  totalSets: number;
}

interface PlanItem {
  routineExIndex: number;
  setNumber: number;
  isLastInRound: boolean;
}

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// ──────────────────────────────────────────────
//  Componente principal
// ──────────────────────────────────────────────
export default function FocusMode() {
  const { routineId } = useParams<{ routineId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  useWorkoutStore();
  const { finishWorkout: clearWorkout } = useWorkoutStore();

  // Estado de la máquina
  const [phase, setPhase] = useState<Phase>('intro');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [existingSession, setExistingSession] = useState<WorkoutSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isResumed, setIsResumed] = useState(false);
  const [planIndex, setPlanIndex] = useState(0);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [completedSets, setCompletedSets] = useState<WorkoutSet[]>([]);
  const [skippedExercises, setSkippedExercises] = useState<string[]>([]);
  const [lastTime, setLastTime] = useState<LastTimeStats | null>(null);
  const [loadingLast, setLoadingLast] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restDisplay, setRestDisplay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [startedAt] = useState(Date.now());
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Estados para Modal de Confirmación de Salida
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitConfirmUnlocked, setExitConfirmUnlocked] = useState(false);

  // Prevenir volver atrás por error (swipe back o botón atrás)
  useEffect(() => {
    window.history.pushState({ focusMode: true }, '');

    const handlePopState = () => {
      window.history.pushState({ focusMode: true }, '');
      setShowExitConfirm(true);
      setExitConfirmUnlocked(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleExitRequest = () => {
    setShowExitConfirm(true);
    setExitConfirmUnlocked(false);
  };

  const confirmExit = () => {
    clearWorkout();
    navigate('/', { replace: true });
  };

  // Gamificación: Progreso
  const [progressCount, setProgressCount] = useState(0);
  const [progressExercises] = useState(new Set<string>());

  // Cargar rutina y chequear sesiones incompletas
  const { data: routineData, isLoading: isLoadingRoutine } = useRoutine(routineId);

  useEffect(() => {
    if (routineData && user) {
      getIncompleteSessionToday(user.uid, routineData.id).then(session => {
        if (session) {
          setExistingSession(session);
          setRoutine(routineData);
          setPhase('resume_prompt');
        } else {
          setRoutine(routineData);
          setPhase('intro');
        }
        setCheckingSession(false);
      });
    } else if (!isLoadingRoutine && !routineData) {
      alert('Rutina no encontrada');
      navigate('/');
    }
  }, [routineData, isLoadingRoutine, navigate, user]);

  const handleResumeWorkout = (mode: 'all' | 'strength' | 'cardio' | 'new') => {
    if (mode !== 'new' && existingSession && existingSession.skipped_exercise_ids) {
      const skippedSet = new Set(existingSession.skipped_exercise_ids);
      let remainingExercises = routine!.exercises.filter(ex => skippedSet.has(ex.exercise_id));
      
      if (mode === 'cardio') {
         remainingExercises = remainingExercises.filter(ex => {
            const exerciseDef = allExercises.find(e => e.id === ex.exercise_id);
            return exerciseDef?.muscle_group.toLowerCase() === 'cardio';
         });
      } else if (mode === 'strength') {
         remainingExercises = remainingExercises.filter(ex => {
            const exerciseDef = allExercises.find(e => e.id === ex.exercise_id);
            return exerciseDef?.muscle_group.toLowerCase() !== 'cardio';
         });
      }

      if (remainingExercises.length === 0) {
        alert('No hay ejercicios de este tipo para retomar.');
        return;
      }

      const modifiedRoutine: Routine = {
        ...routine!,
        exercises: remainingExercises
      };
      
      setRoutine(modifiedRoutine);
      setIsResumed(true);
    } else {
      setExistingSession(null);
    }
    setPhase('intro');
  };

  // Caché de ejercicios
  const { data: myExercises = [] } = useMyExercises(user?.uid);
  const { data: globalExercises = [] } = useGlobalExercises();
  const allExercises = [...myExercises, ...globalExercises];

  // Hook mutation
  const { mutateAsync: saveWorkout } = useSaveWorkoutSession();
  const { mutateAsync: updateWorkout } = useUpdateWorkoutSession();

  // Wake lock
  useEffect(() => {
    let wl: any = null;
    const req = async () => {
      try { if ('wakeLock' in navigator) wl = await (navigator as any).wakeLock.request('screen'); }
      catch {}
    };
    req();
    return () => { wl?.release(); };
  }, []);

  const plan = useMemo<PlanItem[]>(() => {
    if (!routine) return [];
    const p: PlanItem[] = [];
    let i = 0;
    while (i < routine.exercises.length) {
      const current = routine.exercises[i];
      if (current.superset_id) {
        const supersetIndices = [i];
        let j = i + 1;
        while (j < routine.exercises.length && routine.exercises[j].superset_id === current.superset_id) {
          supersetIndices.push(j);
          j++;
        }
        const maxSets = Math.max(...supersetIndices.map(idx => routine.exercises[idx].target_sets || 3));
        for (let s = 0; s < maxSets; s++) {
          const setsInRound: PlanItem[] = [];
          for (let k = 0; k < supersetIndices.length; k++) {
            const exIdx = supersetIndices[k];
            const targetSets = routine.exercises[exIdx].target_sets || 3;
            if (s < targetSets) {
              const item = { routineExIndex: exIdx, setNumber: s, isLastInRound: false };
              p.push(item);
              setsInRound.push(item);
            }
          }
          if (setsInRound.length > 0) {
            setsInRound[setsInRound.length - 1].isLastInRound = true;
          }
        }
        i = j;
      } else {
        const targetSets = current.target_sets || 3;
        for (let s = 0; s < targetSets; s++) {
          p.push({ routineExIndex: i, setNumber: s, isLastInRound: true });
        }
        i++;
      }
    }
    return p;
  }, [routine]);

  // Cargar "última vez" cuando cambia el ejercicio
  useEffect(() => {
    if (!routine || !user || plan.length === 0) return;
    const currentPlan = plan[planIndex];
    if (!currentPlan) return;
    const ex = routine.exercises[currentPlan.routineExIndex];
    if (!ex) return;

    setLoadingLast(true);
    getLastExerciseStats(user.uid, ex.exercise_id)
      .then(res => {
        setLastTime(res);
        // Si no hemos cargado peso desde el historial reciente en esta misma sesión:
        const lastSetThisSession = completedSets.slice().reverse().find(s => s.exercise_id === ex.exercise_id);
        if (!lastSetThisSession) {
          if (res) {
            setWeight(String(res.weight));
            setReps(String(res.reps));
          } else {
            setWeight('');
            setReps(String(ex.target_reps));
          }
        }
      })
      .finally(() => setLoadingLast(false));
  }, [planIndex, plan, routine, user]); // no dependemos de completedSets para evitar loops

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, amount: number, min: number = 0) => {
    setter(prev => {
      const val = parseFloat(prev) || 0;
      return Math.max(min, val + amount).toString();
    });
  };

  const exercisesInSuperset = useMemo(() => {
    if (!routine || plan.length === 0) return [];
    const currentPlan = plan[planIndex] || plan[0];
    if (!currentPlan) return [];
    const currentRoutineEx = routine.exercises[currentPlan.routineExIndex];
    if (!currentRoutineEx || !currentRoutineEx.superset_id) return [];
    
    return routine.exercises
      .filter(ex => ex.superset_id === currentRoutineEx.superset_id)
      .map(ex => allExercises.find(e => e.id === ex.exercise_id)?.name || 'Ejercicio');
  }, [routine, plan, planIndex, allExercises]);

  // Timer de descanso basado en timestamp real
  useEffect(() => {
    if (phase !== 'resting' || !restEndsAt) return;

    const calcRemaining = () => Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));

    // Recálculo inicial inmediato
    setRestDisplay(calcRemaining());

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setRestDisplay(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        // Vibrar
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        // Beep
        if (audioCtx) {
          try {
            const osc = audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
          } catch {
            console.warn('AudioContext failed to play beep');
          }
        }
      }
    }, 250);

    // Recálculo forzado al volver de segundo plano
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setRestDisplay(calcRemaining());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [phase, restEndsAt, audioCtx]);

  if (!routine || checkingSession) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="text-primary animate-pulse font-bold text-xl">Cargando...</span>
      </div>
    );
  }

  const currentPlan = plan[planIndex] || plan[0] || { routineExIndex: 0, setNumber: 0, isLastInRound: true };
  const exIndex = currentPlan.routineExIndex;
  const setIndex = currentPlan.setNumber;
  const currentRoutineEx = routine.exercises[exIndex];
  const currentEx = allExercises.find(e => e.id === currentRoutineEx?.exercise_id);
  const targetSets = currentRoutineEx?.target_sets ?? 3;
  const isSuperset = !!currentRoutineEx?.superset_id;

  // ── Helpers Globales ──
  const totalRoutineSets = routine.exercises.reduce((acc, ex) => acc + (ex.target_sets ?? 3), 0) || 1;
  const progressPercent = Math.min(100, Math.round((completedSets.length / totalRoutineSets) * 100));

  const GlobalHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-8 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted block mb-0.5">{title}</span>
          <span className="text-sm font-black text-text">{subtitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-highlight">{progressPercent}%</span>
          <button onClick={handleExitRequest} className="text-text-muted p-1 hover:text-text active:scale-95 transition-all bg-surface rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="h-1.5 w-full bg-surface-alt rounded-full overflow-hidden">
        <div 
          className="h-full bg-linear-to-r from-primary to-highlight transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ExitConfirmModal />
    </div>
  );

  const ExitConfirmModal = () => {
    return (
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title="¿Seguro que quieres salir?"
        footer={
          <>
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => setShowExitConfirm(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="danger" 
              className="flex-1"
              disabled={!exitConfirmUnlocked}
              onClick={confirmExit}
            >
              Salir
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-text-muted mb-6">
            El progreso de este entrenamiento no se guardará y se perderá por completo.
          </p>

          <label className="flex items-center gap-3 bg-bg p-4 rounded-2xl w-full cursor-pointer border border-border group">
            <div className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={exitConfirmUnlocked}
                onChange={(e) => setExitConfirmUnlocked(e.target.checked)}
              />
              <div className={`w-11 h-6 rounded-full transition-all flex items-center p-0.5 ${exitConfirmUnlocked ? 'bg-danger' : 'bg-surface-alt'}`}>
                <div className={`w-5 h-5 rounded-full border transition-all shadow-sm ${exitConfirmUnlocked ? 'translate-x-full bg-white border-white' : 'translate-x-0 bg-text border-border'}`} />
              </div>
            </div>
            <span className="text-xs font-bold text-text flex-1 text-left">Confirmo que deseo perder mi progreso</span>
          </label>
        </div>
      </Modal>
    );
  };

  const handleNumericInput = (val: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    let safeVal = val.replace(',', '.');
    if (/^\d*\.?\d*$/.test(safeVal)) {
      setter(safeVal);
    }
  };

  // ── Siguiente serie (lógica core) ──
  const goToNextValidPlan = (fromIndex: number, currentSkipped: string[]) => {
    let next = fromIndex + 1;
    while (next < plan.length) {
      const exId = routine!.exercises[plan[next].routineExIndex].exercise_id;
      if (!currentSkipped.includes(exId)) break;
      next++;
    }
    
    if (next >= plan.length) {
      setPhase('completed');
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
    } else {
      const nextPlan = plan[next];
      const nextExId = routine!.exercises[nextPlan.routineExIndex].exercise_id;
      const lastSetThisSession = completedSets.slice().reverse().find(s => s.exercise_id === nextExId);
      if (lastSetThisSession) {
        setWeight(String(lastSetThisSession.weight));
        setReps(String(lastSetThisSession.reps));
      }
      
      setPlanIndex(next);
      if (plan[fromIndex] && plan[fromIndex].routineExIndex !== nextPlan.routineExIndex) {
        setPhase('intro');
      } else {
        setPhase('active');
      }
    }
  };

  // ── Confirmar serie ──
  const handleConfirmSet = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps)    || 0;
    if (r === 0) return;

    const newSet: WorkoutSet = {
      exercise_id: currentRoutineEx.exercise_id,
      weight: w, reps: r, set_type: 'normal'
    };
    const updatedCompletedSets = [...completedSets, newSet];
    setCompletedSets(updatedCompletedSets);

    if (lastTime && !progressExercises.has(currentRoutineEx.exercise_id)) {
      const isBetterWeight = w > lastTime.weight;
      const isBetterReps = w === lastTime.weight && r > lastTime.reps;
      const isBetterSets = w === lastTime.weight && r === lastTime.reps && (setIndex + 1) > lastTime.totalSets;
      
      if (isBetterWeight || isBetterReps || isBetterSets) {
        setProgressCount(prev => prev + 1);
        progressExercises.add(currentRoutineEx.exercise_id);
      }
    }

    let hasMore = false;
    for (let i = planIndex + 1; i < plan.length; i++) {
       const exId = routine!.exercises[plan[i].routineExIndex].exercise_id;
       if (!skippedExercises.includes(exId)) {
         hasMore = true;
         break;
       }
    }

    if (!hasMore) {
      setPhase('completed');
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100, 50, 300]);
      return;
    }

    if (!currentPlan.isLastInRound) {
       // Transición inmediata en Superset, sin descanso (o descanso muy corto)
       goToNextValidPlan(planIndex, skippedExercises);
    } else {
      let nextRest = 90;
      let nextValidPlanIndex = planIndex + 1;
      while (nextValidPlanIndex < plan.length) {
         const exId = routine!.exercises[plan[nextValidPlanIndex].routineExIndex].exercise_id;
         if (!skippedExercises.includes(exId)) break;
         nextValidPlanIndex++;
      }
      
      const nextPlanItem = plan[nextValidPlanIndex];
      const nextRoutineEx = nextPlanItem ? routine!.exercises[nextPlanItem.routineExIndex] : null;

      const isSameSuperset = currentRoutineEx.superset_id && nextRoutineEx && currentRoutineEx.superset_id === nextRoutineEx.superset_id;
      const isSameExercise = nextRoutineEx && currentRoutineEx.exercise_id === nextRoutineEx.exercise_id;

      if (!isSameExercise && !isSameSuperset) {
         nextRest = routine.rest_between_exercises ?? 180;
      } else {
         nextRest = routine.rest_between_sets ?? currentRoutineEx.rest_seconds ?? 90;
      }

      setRestEndsAt(Date.now() + nextRest * 1000);
      setRestDisplay(nextRest);
      setPhase('resting');
    }
  };

  // ── Siguiente serie (desde modal de descanso) ──
  const handleNextSet = () => {
    goToNextValidPlan(planIndex, skippedExercises);
  };

  // ── Omitir Ejercicio ──
  const handleSkipExercise = () => {
    if (!currentRoutineEx) return;
    const newSkipped = [...skippedExercises, currentRoutineEx.exercise_id];
    setSkippedExercises(newSkipped);
    goToNextValidPlan(planIndex, newSkipped);
  };

  // ── Finalizar entrenamiento ──
  const handleFinish = async () => {
    if (!user || !routine) return;
    setSaving(true);
    try {
      const exerciseIds = Array.from(new Set(completedSets.map(s => s.exercise_id)));
      
      if (existingSession && isResumed) {
        // Combine with existing session
        const combinedSets = [...(existingSession.sets || []), ...completedSets];
        const combinedExerciseIds = Array.from(new Set([...(existingSession.exercise_ids || []), ...exerciseIds]));
        const durationToAdd = Math.floor((Date.now() - startedAt) / 1000);
        
        const sessionData = {
          owner_id: user.uid,
          finished_at: Date.now(),
          duration_seconds: (existingSession.duration_seconds || 0) + durationToAdd,
          sets: combinedSets,
          exercise_ids: combinedExerciseIds,
          skipped_exercise_ids: skippedExercises // Whatever was skipped THIS time
        };

        updateWorkout({ id: existingSession.id, sessionData, sets: completedSets }).catch(err => {
          console.error('Error sincronizando actualización en background:', err);
        });
      } else {
        // Normal save
        const sessionData = {
          owner_id: user.uid,
          routine_id: routine.id,
          started_at: startedAt,
          finished_at: Date.now(),
          duration_seconds: Math.floor((Date.now() - startedAt) / 1000),
          sets: completedSets,
          exercise_ids: exerciseIds,
          skipped_exercise_ids: skippedExercises
        };

        saveWorkout({ sessionData, sets: completedSets }).catch(err => {
          console.error('Error sincronizando entrenamiento en background:', err);
        });
      }
      
      clearWorkout();
      setPhase('streak_celebration');
    } catch (err) {
      console.error('Error al procesar entrenamiento:', err);
      alert('Hubo un error interno al guardar tu entrenamiento.');
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: RESUME PROMPT (CARDIO FRACCIONADO)
  // ─────────────────────────────────────────────────────────
  if (phase === 'resume_prompt') {
    const skippedStrength = existingSession?.skipped_exercise_ids?.filter(id => {
       return allExercises.find(e => e.id === id)?.muscle_group.toLowerCase() !== 'cardio';
    }) || [];
    
    const skippedCardio = existingSession?.skipped_exercise_ids?.filter(id => {
       return allExercises.find(e => e.id === id)?.muscle_group.toLowerCase() === 'cardio';
    }) || [];

    const totalSkipped = (existingSession?.skipped_exercise_ids || []).length;

    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-4 py-8 max-w-lg mx-auto text-center animate-in fade-in zoom-in-95">
        <div className="w-24 h-24 bg-highlight/10 rounded-full flex items-center justify-center mb-6">
          <Activity className="w-12 h-12 text-highlight" />
        </div>
        <h2 className="text-3xl font-black text-text mb-4">¡Doble Sesión!</h2>
        <p className="text-text-muted mb-8 px-4 leading-relaxed">
          Tienes una sesión inconclusa de hoy. Omitiste <strong className="text-text">{totalSkipped}</strong> ejercicios. ¿Qué deseas hacer?
        </p>
        
        <div className="flex flex-col gap-3 w-full">
          {skippedStrength.length > 0 && skippedCardio.length > 0 ? (
            <>
              <Button variant="highlight" fullWidth size="lg" className="h-14 font-black glow-highlight" onClick={() => handleResumeWorkout('all')}>
                Retomar Ambos (Fuerza y Cardio)
              </Button>
              <Button variant="secondary" fullWidth size="lg" className="h-14 font-black text-text" onClick={() => handleResumeWorkout('strength')}>
                Solo retomar Fuerza
              </Button>
              <Button variant="secondary" fullWidth size="lg" className="h-14 font-black text-text" onClick={() => handleResumeWorkout('cardio')}>
                Solo hacer el Cardio omitido
              </Button>
            </>
          ) : (
            <Button variant="highlight" fullWidth size="lg" className="h-16 text-lg font-black glow-highlight" onClick={() => handleResumeWorkout('all')}>
              Retomar ejercicios omitidos
            </Button>
          )}

          <div className="h-px bg-border my-2 w-1/2 mx-auto" />

          <Button variant="danger" fullWidth size="lg" className="h-14 font-black bg-danger/10 text-danger hover:bg-danger/20" onClick={() => handleResumeWorkout('new')}>
            Ignorar y empezar desde cero
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: INTRO DEL EJERCICIO
  // ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh flex flex-col bg-bg px-4 py-8 max-w-lg mx-auto">
        <GlobalHeader 
          title="Progreso" 
          subtitle={`Ejercicio ${exIndex + 1} de ${routine.exercises.length}`} 
        />

        {/* Nombre del ejercicio */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-primary text-sm font-bold uppercase tracking-widest">
              {currentEx?.muscle_group}
            </p>
            {isSuperset && (
              <span className="bg-highlight/20 text-highlight text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-highlight/30">
                Superset
              </span>
            )}
          </div>
          <h1 className="text-4xl font-black text-text mb-6 leading-tight">
            {currentEx?.name || '...'}
          </h1>

          {isSuperset && exercisesInSuperset.length > 1 && (
            <div className="bg-highlight/5 border border-highlight/20 rounded-xl p-4 mb-6 text-left">
              <p className="text-[10px] font-bold text-highlight uppercase tracking-widest mb-2">Este Superset incluye:</p>
              <ul className="space-y-1">
                {exercisesInSuperset.map((name, idx) => (
                  <li key={idx} className={`text-sm flex items-center gap-2 ${name === currentEx?.name ? 'text-text font-bold' : 'text-text-muted'}`}>
                    <span className="w-4 h-4 rounded-full bg-surface-alt flex items-center justify-center text-[9px] font-black">{idx + 1}</span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Datos de última vez */}
          <div className="bg-surface border border-border rounded-2xl p-4 mb-8">
            <p className="text-xs text-text-muted font-bold uppercase tracking-wider mb-3">
              Última vez
            </p>
            {loadingLast ? (
              <div className="skeleton h-10 rounded-xl" />
            ) : lastTime ? (
              <div className="flex gap-6">
                <div>
                  <p className="text-3xl font-black text-text">{lastTime.weight}<span className="text-sm text-text-muted font-normal ml-1">kg</span></p>
                  <p className="text-xs text-text-muted mt-1">Peso</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-3xl font-black text-text">{lastTime.reps}<span className="text-sm text-text-muted font-normal ml-1">reps</span></p>
                  <p className="text-xs text-text-muted mt-1">Reps</p>
                </div>
                <div className="w-px bg-border" />
                <div>
                  <p className="text-3xl font-black text-text">{lastTime.totalSets}</p>
                  <p className="text-xs text-text-muted mt-1">Series</p>
                </div>
              </div>
            ) : (
              <p className="text-text-muted text-sm italic">Primera vez. ¡Dale caña!</p>
            )}
          </div>

          {/* Target */}
          <p className="text-center text-text-muted text-sm mb-8">
            Meta: <span className="text-text font-bold">{targetSets} series × {currentRoutineEx.target_reps} reps</span>
            {' · '}Descanso: <span className="text-text font-bold">{routine.rest_between_sets ?? currentRoutineEx.rest_seconds ?? 90}s</span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Button
            variant="highlight"
            fullWidth
            size="lg"
            className="rounded-2xl h-16 text-xl font-black glow-highlight"
            onClick={() => {
              // Inicializar AudioContext en primera interacción de usuario
              if (!audioCtx) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gainNode = ctx.createGain();
                gainNode.gain.value = 0;
                osc.connect(gainNode);
                gainNode.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.001);
                setAudioCtx(ctx);
              }
              setPhase('active');
            }}
          >
            <Play className="mr-2 fill-current" /> Empezar serie {setIndex + 1}
          </Button>

          <button 
            onClick={handleSkipExercise}
            className="h-12 w-full rounded-2xl flex items-center justify-center text-sm font-bold text-text-muted hover:text-text hover:bg-surface-alt/50 transition-all border border-transparent hover:border-border"
          >
            Omitir Ejercicio
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: SERIE ACTIVA
  // ─────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div className="min-h-dvh flex flex-col bg-bg px-4 py-8 max-w-lg mx-auto">
        <GlobalHeader 
          title={currentEx?.name || 'Ejercicio'} 
          subtitle={`Serie ${setIndex + 1} de ${targetSets}`} 
        />
        {isSuperset && (
          <div className="flex justify-center -mt-4 mb-2">
            <span className="bg-highlight/20 text-highlight text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-highlight/30">
              Superset
            </span>
          </div>
        )}

        {/* Inputs grandes */}
        <div className="flex-1 flex flex-col justify-center gap-6">
          {/* Sugerencia de la última vez */}
          {lastTime && (
            <p className="text-center text-sm text-text-muted">
              Última vez: <span className="text-text font-bold">{lastTime.weight}kg × {lastTime.reps} reps</span>
            </p>
          )}

          {/* Peso */}
          <div>
            <label className="text-xs text-text-muted font-bold uppercase tracking-widest block text-center mb-3">
              Peso (kg)
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => adjustValue(setWeight, -2.5)} className="w-14 h-24 bg-surface-alt border border-border rounded-2xl flex items-center justify-center text-3xl font-normal text-text-muted active:scale-95 transition-all select-none touch-manipulation">-</button>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={e => handleNumericInput(e.target.value, setWeight)}
                placeholder={lastTime ? String(lastTime.weight) : '0'}
                className="flex-1 min-w-0 h-24 bg-surface text-5xl font-black text-center rounded-2xl
                  border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary
                  placeholder:text-border transition-colors"
              />
              <button type="button" onClick={() => adjustValue(setWeight, 2.5)} className="w-14 h-24 bg-surface-alt border border-border rounded-2xl flex items-center justify-center text-3xl font-normal text-text-muted active:scale-95 transition-all select-none touch-manipulation">+</button>
            </div>
          </div>

          {/* Reps */}
          <div>
            <label className="text-xs text-text-muted font-bold uppercase tracking-widest block text-center mb-3">
              Repeticiones
            </label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => adjustValue(setReps, -1)} className="w-14 h-24 bg-surface-alt border border-border rounded-2xl flex items-center justify-center text-3xl font-normal text-text-muted active:scale-95 transition-all select-none touch-manipulation">-</button>
              <input
                type="text"
                inputMode="numeric"
                value={reps}
                onChange={e => handleNumericInput(e.target.value, setReps)}
                placeholder={lastTime ? String(lastTime.reps) : String(targetSets)}
                className="flex-1 min-w-0 h-24 bg-surface text-5xl font-black text-center rounded-2xl
                  border-2 border-border focus:outline-none focus:ring-2 focus:ring-primary
                  placeholder:text-border transition-colors"
              />
              <button type="button" onClick={() => adjustValue(setReps, 1)} className="w-14 h-24 bg-surface-alt border border-border rounded-2xl flex items-center justify-center text-3xl font-normal text-text-muted active:scale-95 transition-all select-none touch-manipulation">+</button>
            </div>
          </div>
        </div>

        {/* Botón confirmar + descanso */}
        <div className="pt-6">
          <Button
            variant="highlight"
            fullWidth
            size="lg"
            className="h-16 rounded-2xl text-lg font-black glow-highlight"
            onClick={handleConfirmSet}
            disabled={!reps}
          >
            <Check className="mr-2 w-6 h-6" />
            {!currentPlan.isLastInRound ? 'Siguiente (Superset)' : 'Confirmar — Descanso'}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: DESCANSO (modal a pantalla completa)
  // ─────────────────────────────────────────────────────────
  if (phase === 'resting') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-between bg-bg px-4 py-8 max-w-lg mx-auto">
        <div className="w-full">
          <GlobalHeader 
            title="Descanso" 
            subtitle={`${currentEx?.name} · Serie ${setIndex + 1} ✓`} 
          />
        </div>

        {/* Timer central */}
        <div className="flex flex-col items-center gap-4">
          {restDisplay > 0 ? (
            <>
              <div className="w-40 h-40 rounded-full border-4 border-highlight/30 flex items-center justify-center
                bg-highlight/5 relative">
                <Timer className="absolute top-4 left-1/2 -translate-x-1/2 w-5 h-5 text-highlight" />
                <span className="text-5xl font-black text-highlight font-mono">
                  {formatTime(restDisplay)}
                </span>
              </div>
              <p className="text-text-muted text-sm">Descansando…</p>
            </>
          ) : (
            <>
              <div className="w-40 h-40 rounded-full border-4 border-success/50 flex items-center justify-center
                bg-success/10">
                <span className="text-5xl">🔥</span>
              </div>
              <p className="text-xl font-bold text-success">¡Listo para la siguiente!</p>
            </>
          )}
        </div>

        {/* Botones */}
        <div className="w-full flex flex-col gap-3">
          <Button
            variant="highlight"
            fullWidth
            size="lg"
            className="h-16 rounded-2xl font-black text-lg glow-highlight"
            onClick={handleNextSet}
          >
            <ChevronRight className="mr-1 w-6 h-6" />
            Siguiente
          </Button>

          {restDisplay > 0 && (
            <button
              onClick={() => { setRestEndsAt(null); setRestDisplay(0); }}
              className="text-center text-sm text-text-muted underline underline-offset-2"
            >
              Saltar descanso
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: COMPLETADO (FELICITACIONES)
  // ─────────────────────────────────────────────────────────
  if (phase === 'completed') {
    const durationMin = Math.max(1, Math.floor((Date.now() - startedAt) / 60000));
    const totalSetsCompleted = completedSets.length;
    const exercisesCount = new Set(completedSets.map(s => s.exercise_id)).size;

    return (
      <div className="min-h-dvh flex flex-col items-center bg-bg px-6 py-8 max-w-lg mx-auto relative overflow-hidden">
        {/* Decoraciones de fondo (Gradients suaves) */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-highlight/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-[40%] right-[-10%] w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        {/* Contenedor central (flex-1 para empujar al medio y evitar que se pegue al borde) */}
        <div className="flex-1 flex flex-col items-center justify-center w-full mt-10">
          
          <div className="relative mb-8">
            {/* Brillo detrás del trofeo */}
            <div className="absolute inset-0 bg-highlight/30 blur-2xl rounded-full animate-pulse" />
            
            {/* Círculo del trofeo */}
            <div className="w-36 h-36 rounded-full border-4 border-highlight/30 bg-linear-to-br from-highlight/20 to-highlight/5 flex items-center justify-center animate-[bounce_3s_infinite] shadow-[0_0_30px_rgba(255,144,0,0.2)] backdrop-blur-md relative z-10">
              <span className="text-7xl drop-shadow-2xl">🏆</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-text mb-3 tracking-tight text-center">¡Misión Cumplida!</h1>
          
          <p className="text-text-muted text-sm mb-8 text-center leading-relaxed max-w-70">
            Has superado tu rutina de hoy. Estos son los increíbles resultados de tu esfuerzo:
          </p>

          {/* Grid de Estadísticas */}
          <div className="w-full grid grid-cols-2 gap-3 mb-3 relative z-10">
            <div className="bg-surface/50 backdrop-blur-md border border-border/50 p-4 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-20 h-20 bg-highlight/10 blur-2xl rounded-full" />
              <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-1 z-10 text-center">Avances Logrados</span>
              <span className="text-3xl font-black text-text z-10">{progressCount}<span className="text-sm font-normal text-text-muted ml-2">📈</span></span>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-md border border-border/50 p-4 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary/10 blur-2xl rounded-full" />
              <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-1 z-10">Tiempo</span>
              <span className="text-3xl font-black text-text z-10">{durationMin}<span className="text-sm font-normal text-text-muted ml-1">min</span></span>
            </div>
          </div>
          
          <div className="w-full grid grid-cols-2 gap-3 relative z-10">
            <div className="bg-surface/50 backdrop-blur-md border border-border/50 p-3 rounded-2xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-1">Series Totales</span>
              <span className="text-2xl font-black text-text">{totalSetsCompleted}</span>
            </div>
            
            <div className="bg-surface/50 backdrop-blur-md border border-border/50 p-3 rounded-2xl flex flex-col items-center justify-center shadow-sm">
              <span className="text-text-muted text-[10px] uppercase font-bold tracking-widest mb-1">Ejercicios</span>
              <span className="text-2xl font-black text-text">{exercisesCount}</span>
            </div>
          </div>
        </div>
        
        {/* Contenedor del Botón */}
        <div className="w-full pt-8 pb-4 relative z-20">
          <Button
            variant="highlight"
            fullWidth
            size="lg"
            className="h-16 rounded-2xl font-black text-xl glow-highlight transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleFinish}
            disabled={saving}
          >
            {saving ? 'Guardando Entrenamiento...' : 'Finalizar y Guardar'}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: CELEBRACIÓN DE RACHA (DUOLINGO STYLE)
  // ─────────────────────────────────────────────────────────
  if (phase === 'streak_celebration') {
    const currentStreak = user?.current_streak || 0;
    const lastWorkoutDateStr = user?.last_workout_date || '';
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let isSameDay = lastWorkoutDateStr === todayStr;
    let newStreak = currentStreak;
    let isRestored = false;
    
    if (!isSameDay) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      if (lastWorkoutDateStr === yesterdayStr) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
        isRestored = true;
      }
    }

    return (
      <StreakCelebration 
        isSameDay={isSameDay}
        isRestored={isRestored}
        newStreak={newStreak}
        isDoubleSession={isResumed} // Activa el efecto visual "Rayo" si reanudó sesión
        onClose={() => navigate('/')}
      />
    );
  }
}





