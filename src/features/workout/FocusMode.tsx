import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, doc, writeBatch, getDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { useWorkoutStore } from '../../store/workoutStore';
import type { Routine, Exercise, WorkoutSession, WorkoutSet } from '../../shared/types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Play, Square, Check, Timer } from 'lucide-react';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';

export default function FocusMode() {
  const { routineId } = useParams<{ routineId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { 
    activeSession, startWorkout, finishWorkout, 
    addSet, sets, restTimer, isTimerRunning, 
    startRestTimer, decrementTimer, stopRestTimer 
  } = useWorkoutStore();

  const [routine, setRoutine] = useState<Routine | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [lastTimeData, setLastTimeData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Wake lock
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };
    if (activeSession) requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [activeSession]);

  // Load routine
  useEffect(() => {
    const loadRoutine = async () => {
      if (!routineId) return;
      const rSnap = await getDoc(doc(db, 'routines', routineId));
      if (rSnap.exists()) {
        setRoutine({ id: rSnap.id, ...rSnap.data() } as Routine);
      }
    };
    loadRoutine();
  }, [routineId]);

  // Fetch exercises
  const { data: exercises = [] } = useFirestoreQuery<Exercise>(
    ['exercises', user?.uid],
    'exercises',
    [where('owner_id', '==', user?.uid)],
    1000 * 60 * 60
  );

  // Timer
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && restTimer > 0) {
      interval = setInterval(() => {
        decrementTimer();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer, decrementTimer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Last time
  useEffect(() => {
    const loadLastTime = async () => {
      if (!user || !routine || routine.exercises.length === 0) return;
      
      const currentEx = routine.exercises[currentExerciseIndex];
      const q = query(
        collection(db, 'workout_sessions'),
        where('owner_id', '==', user.uid),
        orderBy('finished_at', 'desc'),
        limit(5)
      );
      
      const snaps = await getDocs(q);
      let found = null;
      for (const d of snaps.docs) {
        const session = d.data() as WorkoutSession;
        const matchingSets = session.sets.filter(s => s.exercise_id === currentEx.exercise_id);
        if (matchingSets.length > 0) {
          found = matchingSets;
          break;
        }
      }
      setLastTimeData(found);
    };
    loadLastTime();
  }, [currentExerciseIndex, routine, user]);

  if (!routine) return <div className="p-4 text-center text-text-muted mt-20">Cargando rutina...</div>;

  const currentRoutineEx = routine.exercises[currentExerciseIndex];
  const currentEx = exercises.find(e => e.id === currentRoutineEx?.exercise_id);
  const currentSets = sets.filter(s => s.exercise_id === currentRoutineEx?.exercise_id);

  const handleStart = () => startWorkout(routine.id);

  const handleLogSet = () => {
    if (!currentRoutineEx) return;
    addSet({
      exercise_id: currentRoutineEx.exercise_id,
      weight,
      reps,
      set_type: 'normal'
    });
    startRestTimer(currentRoutineEx.rest_seconds);
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const sessionRef = doc(collection(db, 'workout_sessions'));
      
      const sessionData = {
        owner_id: user.uid,
        routine_id: routine.id,
        started_at: useWorkoutStore.getState().startedAt || Date.now(),
        finished_at: Date.now(),
        duration_seconds: Math.floor((Date.now() - (useWorkoutStore.getState().startedAt || Date.now())) / 1000),
        sets: useWorkoutStore.getState().sets
      };
      
      batch.set(sessionRef, sessionData);
      await batch.commit();
      
      finishWorkout();
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error al guardar sesión');
    } finally {
      setSaving(false);
    }
  };

  if (!activeSession) {
    return (
      <div className="p-4 max-w-lg mx-auto min-h-screen flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl font-bold mb-2 text-primary">{routine.name}</h1>
        <p className="text-text-muted mb-12">
          {routine.exercises.length} ejercicios. Prepárate para empezar.
        </p>
        <Button size="lg" onClick={handleStart} className="w-64 rounded-full h-16 text-lg">
          <Play className="mr-2" /> Iniciar
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-32 max-w-lg mx-auto min-h-screen flex flex-col">
      <header className="flex justify-between items-center mb-6 pt-4 sticky top-0 bg-bg z-10 py-4 border-b border-border">
        <h1 className="text-lg font-bold truncate pr-4 text-text-muted">{routine.name}</h1>
        {isTimerRunning ? (
          <div className="flex items-center gap-2 text-warning bg-warning/10 px-3 py-1.5 rounded-full cursor-pointer touch-manipulation" onClick={stopRestTimer}>
            <Timer className="w-5 h-5" />
            <span className="font-mono font-bold text-xl">{formatTime(restTimer)}</span>
          </div>
        ) : (
          <div className="text-sm text-text-muted/50 flex items-center gap-1">
            <Timer className="w-4 h-4" /> 0:00
          </div>
        )}
      </header>

      <div className="flex-1">
        <div className="flex justify-between text-sm mb-2 text-text-muted font-medium">
          <span>{currentExerciseIndex + 1} / {routine.exercises.length}</span>
          <span>{currentSets.length}/{currentRoutineEx?.target_sets} series</span>
        </div>
        
        <h2 className="text-4xl font-bold mb-8 text-text tracking-tight">{currentEx?.name || 'Cargando...'}</h2>

        {lastTimeData && lastTimeData.length > 0 && (
          <Card className="mb-8 bg-surface-alt/30 border-none shadow-none">
            <h3 className="text-xs uppercase text-text-muted font-bold mb-3 tracking-wider">Última vez</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
              {lastTimeData.map((s: WorkoutSet, idx: number) => (
                <div key={idx} className="bg-surface border border-border px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium snap-start">
                  {s.weight}kg × {s.reps}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm text-text-muted mb-2 font-medium">Peso (kg)</label>
            <input 
              type="number"
              value={weight || ''}
              onChange={e => setWeight(Number(e.target.value))}
              className="w-full bg-surface text-4xl font-bold text-center h-24 rounded-2xl border-2 border-border focus:border-primary focus:outline-none transition-colors touch-manipulation shadow-inner"
            />
          </div>
          <div>
            <label className="block text-sm text-text-muted mb-2 font-medium">Reps</label>
            <input 
              type="number"
              value={reps || ''}
              onChange={e => setReps(Number(e.target.value))}
              className="w-full bg-surface text-4xl font-bold text-center h-24 rounded-2xl border-2 border-border focus:border-primary focus:outline-none transition-colors touch-manipulation shadow-inner"
            />
          </div>
        </div>

        <Button 
          size="lg" 
          fullWidth 
          onClick={handleLogSet} 
          disabled={weight <= 0 || reps <= 0}
          className="mb-10 h-16 text-lg rounded-2xl shadow-lg shadow-primary/20"
        >
          <Check className="mr-2" /> Registrar Serie
        </Button>

        <div className="flex justify-between gap-4 mt-auto">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentExerciseIndex(prev => prev > 0 ? prev - 1 : 0)} 
            disabled={currentExerciseIndex === 0}
            className="flex-1 bg-surface-alt hover:bg-surface-alt/80"
          >
            Anterior
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentExerciseIndex(prev => prev < routine.exercises.length - 1 ? prev + 1 : prev)} 
            disabled={currentExerciseIndex === routine.exercises.length - 1}
            className="flex-1 bg-surface-alt hover:bg-surface-alt/80"
          >
            Siguiente
          </Button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-4 bg-gradient-to-t from-bg via-bg to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <Button 
            variant="danger" 
            fullWidth 
            onClick={handleFinish}
            disabled={saving}
            className="h-14 rounded-2xl"
          >
            <Square className="mr-2 w-4 h-4 fill-current" /> {saving ? 'Guardando...' : 'Finalizar Entrenamiento'}
          </Button>
        </div>
      </div>
    </div>
  );
}
