import { create } from 'zustand';
import type { WorkoutSet } from '../shared/types';

interface WorkoutState {
  activeSession: boolean;
  routineId: string | null;
  startedAt: number | null;
  sets: WorkoutSet[];
  restTimer: number;
  isTimerRunning: boolean;
  
  startWorkout: (routineId: string) => void;
  addSet: (set: WorkoutSet) => void;
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

  startWorkout: (routineId) => set({ 
    activeSession: true, 
    routineId, 
    startedAt: Date.now(),
    sets: [],
    restTimer: 0,
    isTimerRunning: false
  }),
  
  addSet: (newSet) => set((state) => ({ 
    sets: [...state.sets, newSet] 
  })),

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
