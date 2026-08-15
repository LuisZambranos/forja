export interface User {
  uid: string;
  email: string;
  display_name: string;
  role: 'free' | 'premium';
  height_cm?: number;
  initial_weight_kg?: number;
  sex?: 'male' | 'female';
  current_streak?: number;
  last_workout_date?: string;
  lifetime_tonnage?: number;
  settings: {
    auto_timer: boolean;
  };
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  owner_id: string | null;
  is_global: boolean;
}

export interface RoutineExercise {
  exercise_id: string;
  target_sets: number;
  target_reps: number;
  rest_seconds?: number; // Mantenido por compatibilidad con rutinas antiguas
}

export interface Routine {
  id: string;
  owner_id: string;
  name: string;
  is_public: boolean;
  exercises: RoutineExercise[];
  scheduled_days?: number[];
  rest_between_sets?: number;
  rest_between_exercises?: number;
}

export interface WorkoutSet {
  exercise_id: string;
  weight: number;
  reps: number;
  set_type: 'normal' | 'warmup' | 'drop';
}

export interface WorkoutSession {
  id: string;
  owner_id: string;
  routine_id: string;
  started_at: number;
  finished_at: number;
  duration_seconds: number;
  sets: WorkoutSet[];
}
