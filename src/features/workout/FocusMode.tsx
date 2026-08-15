import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection, doc, writeBatch, getDoc,
  query, where, orderBy, limit, getDocs, increment
} from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutStore } from '../../store/workoutStore';
import type { Routine, Exercise, WorkoutSession, WorkoutSet } from '../../shared/types';
import { Button } from '../../components/ui/Button';
import { Play, Timer, ChevronRight, Check, X } from 'lucide-react';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import { useQueryClient } from '@tanstack/react-query';

// ──────────────────────────────────────────────
//  Tipos internos del flujo por serie
// ──────────────────────────────────────────────
type Phase = 'intro' | 'active' | 'resting';

interface LastTimeStats {
  weight: number;
  reps: number;
  totalSets: number;
}

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

async function fetchLastTime(uid: string, exerciseId: string): Promise<LastTimeStats | null> {
  const q = query(
    collection(db, 'workout_sessions'),
    where('owner_id', '==', uid),
    where('exercise_ids', 'array-contains', exerciseId),
    orderBy('finished_at', 'desc'),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  
  const session = snaps.docs[0].data() as WorkoutSession;
  const matching = (session.sets || []).filter(s => s.exercise_id === exerciseId);
  
  if (matching.length > 0) {
    // Tomamos la serie de mayor peso
    const bestSet = matching.reduce((prev, curr) => (curr.weight > prev.weight ? curr : prev));
    return { weight: bestSet.weight, reps: bestSet.reps, totalSets: matching.length };
  }
  return null;
}

// ──────────────────────────────────────────────
//  Componente principal
// ──────────────────────────────────────────────
export default function FocusMode() {
  const { routineId } = useParams<{ routineId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { finishWorkout } = useWorkoutStore();

  // Estado de la máquina
  const [phase, setPhase] = useState<Phase>('intro');
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [exIndex, setExIndex] = useState(0);         // índice del ejercicio actual
  const [setIndex, setSetIndex] = useState(0);       // serie actual (0-based)
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [completedSets, setCompletedSets] = useState<WorkoutSet[]>([]);
  const [lastTime, setLastTime] = useState<LastTimeStats | null>(null);
  const [loadingLast, setLoadingLast] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restDisplay, setRestDisplay] = useState(0);
  const [saving, setSaving] = useState(false);
  const [startedAt] = useState(Date.now());
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  // Caché de ejercicios
  const { data: myExercises = [] } = useFirestoreQuery<Exercise>(
    ['exercises', user?.uid], 'exercises',
    user ? [where('owner_id', '==', user.uid)] : [], 1000 * 60 * 60
  );
  const { data: globalExercises = [] } = useFirestoreQuery<Exercise>(
    ['global_exercises'], 'exercises',
    [where('is_global', '==', true)], 1000 * 60 * 60
  );
  const allExercises = [...myExercises, ...globalExercises];

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

  // Cargar rutina
  useEffect(() => {
    if (!routineId) return;
    getDoc(doc(db, 'routines', routineId)).then(snap => {
      if (snap.exists()) setRoutine({ id: snap.id, ...snap.data() } as Routine);
    });
  }, [routineId]);

  // Cargar "última vez" cuando cambia el ejercicio
  useEffect(() => {
    if (!routine || !user) return;
    const ex = routine.exercises[exIndex];
    if (!ex) return;
    setLoadingLast(true);
    fetchLastTime(user.uid, ex.exercise_id)
      .then(res => {
        setLastTime(res);
        if (res) {
          setWeight(String(res.weight));
          setReps(String(res.reps));
        } else {
          setWeight('');
          setReps(String(ex.target_reps));
        }
      })
      .finally(() => setLoadingLast(false));
  }, [exIndex, routine, user]);

  const adjustValue = (setter: React.Dispatch<React.SetStateAction<string>>, amount: number, min: number = 0) => {
    setter(prev => {
      const val = parseFloat(prev) || 0;
      return Math.max(min, val + amount).toString();
    });
  };

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
          } catch (e) {
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

  if (!routine) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="text-primary animate-pulse font-bold text-xl">Cargando...</span>
      </div>
    );
  }

  const currentRoutineEx = routine.exercises[exIndex];
  const currentEx = allExercises.find(e => e.id === currentRoutineEx?.exercise_id);
  const targetSets = currentRoutineEx?.target_sets ?? 3;
  const isLastExercise = exIndex === routine.exercises.length - 1;
  const isLastSet = setIndex >= targetSets - 1;

  // ── Confirmar serie ──
  const handleConfirmSet = () => {
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps)    || 0;
    if (r === 0) return; // al menos reps

    const newSet: WorkoutSet = {
      exercise_id: currentRoutineEx.exercise_id,
      weight: w, reps: r, set_type: 'normal'
    };
    setCompletedSets(prev => [...prev, newSet]);

    // Iniciar descanso
    let nextRest = 90;
    if (isLastSet) {
      nextRest = routine.rest_between_exercises ?? 180;
    } else {
      nextRest = routine.rest_between_sets ?? currentRoutineEx.rest_seconds ?? 90;
    }
    setRestEndsAt(Date.now() + nextRest * 1000);
    setRestDisplay(nextRest);
    setPhase('resting');
  };

  // ── Siguiente serie (desde modal de descanso) ──
  const handleNextSet = () => {
    if (isLastSet) {
      // Pasar al siguiente ejercicio
      if (isLastExercise) {
        handleFinish();
        return;
      }
      setExIndex(prev => prev + 1);
      setSetIndex(0);
      setWeight('');
      setReps('');
      setPhase('intro');
    } else {
      setSetIndex(prev => prev + 1);
      // No limpiamos weight ni reps para que se mantengan de la serie anterior
      setPhase('active');
    }
  };

  // ── Finalizar entrenamiento ──
  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const sessionRef = doc(collection(db, 'workout_sessions'));
      const exerciseIds = Array.from(new Set(completedSets.map(s => s.exercise_id)));
      
      batch.set(sessionRef, {
        id: sessionRef.id,
        owner_id: user.uid,
        routine_id: routine.id,
        started_at: startedAt,
        finished_at: Date.now(),
        duration_seconds: Math.floor((Date.now() - startedAt) / 1000),
        sets: completedSets,
        exercise_ids: exerciseIds
      });

      // Lógica de Racha
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentStreak = userData.current_streak || 0;
        const lastWorkoutDateStr = userData.last_workout_date || '';
        
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        let newStreak = currentStreak;
        let newDate = todayStr;

        if (lastWorkoutDateStr !== todayStr) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
          
          if (lastWorkoutDateStr === yesterdayStr) {
            newStreak = currentStreak + 1;
          } else {
            newStreak = 1;
          }
        }
        const sessionTonnage = completedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
        
        batch.set(userRef, {
          current_streak: newStreak,
          last_workout_date: newDate,
          lifetime_tonnage: increment(sessionTonnage)
        }, { merge: true });
      }

      await batch.commit();
      
      // Invalidar las cachés para que el Dashboard (Rachas, Volumen, Historial) se actualice al instante
      queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
      queryClient.invalidateQueries({ queryKey: ['stats_sessions', user.uid] });
      queryClient.invalidateQueries({ queryKey: ['routines', user.uid] });

      finishWorkout();
      navigate('/');
    } catch {
      alert('Error al guardar sesión');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: INTRO DEL EJERCICIO
  // ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-dvh flex flex-col bg-bg px-4 py-8 max-w-lg mx-auto">
        {/* Progreso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">
              Ejercicio {exIndex + 1} de {routine.exercises.length}
            </span>
            <button onClick={() => navigate('/')} className="text-text-muted p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Barra de progreso */}
          <div className="h-1 bg-surface-alt rounded-full">
            <div
              className="h-1 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${((exIndex) / routine.exercises.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Nombre del ejercicio */}
        <div className="flex-1 flex flex-col justify-center">
          <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">
            {currentEx?.muscle_group}
          </p>
          <h1 className="text-4xl font-black text-text mb-6 leading-tight">
            {currentEx?.name || '...'}
          </h1>

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
        <Button
          variant="highlight"
          fullWidth
          size="lg"
          className="rounded-2xl h-16 text-xl font-black glow-highlight"
          onClick={() => {
            // Inicializar AudioContext en primera interacción de usuario
            if (!audioCtx) {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              // Desbloquear tocando un sonido vacío
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
          <Play className="mr-2 fill-current" /> Empezar serie 1
        </Button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: SERIE ACTIVA
  // ─────────────────────────────────────────────────────────
  if (phase === 'active') {
    return (
      <div className="min-h-dvh flex flex-col bg-bg px-4 py-8 max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-text-muted font-bold uppercase tracking-widest">
              {currentEx?.name}
            </span>
            <span className="text-xs text-primary font-bold bg-primary/15 px-3 py-1 rounded-full">
              Serie {setIndex + 1} / {targetSets}
            </span>
          </div>
          <div className="h-1 bg-surface-alt rounded-full">
            <div
              className="h-1 bg-primary rounded-full transition-all"
              style={{ width: `${((setIndex) / targetSets) * 100}%` }}
            />
          </div>
        </div>

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
                type="number"
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={lastTime ? String(lastTime.weight) : '0'}
                className="flex-1 min-w-0 h-24 bg-surface text-5xl font-black text-center rounded-2xl
                  border-2 border-border focus:outline-none
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
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={e => setReps(e.target.value)}
                placeholder={lastTime ? String(lastTime.reps) : String(targetSets)}
                className="flex-1 min-w-0 h-24 bg-surface text-5xl font-black text-center rounded-2xl
                  border-2 border-border focus:outline-none
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
            {isLastSet && isLastExercise
              ? 'Confirmar y Finalizar'
              : 'Confirmar — Iniciar Descanso'}
          </Button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  //  PANTALLA: DESCANSO (modal a pantalla completa)
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col items-center justify-between bg-bg px-4 py-10 max-w-lg mx-auto">
      {/* Top */}
      <div className="text-center w-full">
        <p className="text-xs text-text-muted font-bold uppercase tracking-widest mb-2">
          {currentEx?.name} · Serie {setIndex + 1} ✓
        </p>
        <div className="h-px bg-border w-16 mx-auto" />
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
          disabled={saving}
        >
          <ChevronRight className="mr-1 w-6 h-6" />
          {isLastSet && isLastExercise
            ? (saving ? 'Guardando...' : 'Finalizar Entrenamiento')
            : isLastSet
              ? `Ejercicio ${exIndex + 2}: ${allExercises.find(e => e.id === routine.exercises[exIndex + 1]?.exercise_id)?.name || '...'}`
              : `Serie ${setIndex + 2} de ${targetSets}`}
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
