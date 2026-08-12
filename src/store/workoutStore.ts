import { create } from 'zustand';
import type { WorkoutSet, Routine } from '../shared/types';

interface WorkoutState {
  activeSession: boolean;
  routineId: string | null;
  startedAt: number | null;
  sets: WorkoutSet[];
  restTimer: number;
  isTimerRunning: boolean;
  
  startWorkout: (routine: Routine) => void;
  addSet: (set: WorkoutSet) => void;
  updateSet: (index: number, updates: Partial<WorkoutSet>) => void;
  startRestTimer: (seconds: number) => void;
  decrementTimer: () => void;
  stopRestTimer: () => void;
  finishWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  activeSession: false,
  routineId: null,
  startedAt: null,
  sets: [],
  restTimer: 0,
  isTimerRunning: false,

  startWorkout: (routine) => {
    // Pre-populate sets based on target_sets
    const initialSets: WorkoutSet[] = [];
    routine.exercises.forEach(ex => {
      for (let i = 0; i < ex.target_sets; i++) {
        initialSets.push({
          exercise_id: ex.exercise_id,
          weight: 0,
          reps: 0,
          set_type: 'normal'
        });
      }
    });

    set({ 
      activeSession: true, 
      routineId: routine.id, 
      startedAt: Date.now(),
      sets: initialSets,
      restTimer: 0,
      isTimerRunning: false
    });
  },
  
  addSet: (newSet) => set((state) => ({ 
    sets: [...state.sets, newSet] 
  })),

  updateSet: (index, updates) => set((state) => {
    const newSets = [...state.sets];
    newSets[index] = { ...newSets[index], ...updates };
    return { sets: newSets };
  }),

  startRestTimer: (seconds) => set({ 
    restTimer: seconds, 
    isTimerRunning: true 
  }),

  decrementTimer: () => set((state) => ({
    restTimer: Math.max(0, state.restTimer - 1),
    isTimerRunning: state.restTimer > 1
  })),

  stopRestTimer: () => set({ 
    restTimer: 0, 
    isTimerRunning: false 
  }),

  finishWorkout: () => set({ 
    activeSession: false, 
    routineId: null, 
    startedAt: null,
    sets: [],
    restTimer: 0,
    isTimerRunning: false
  })
}));
