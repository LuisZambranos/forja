import type { WorkoutSet } from '@core/models';

/**
 * Calcula el 1RM (1 Repetition Maximum) usando la fórmula de Epley.
 * Fórmula: Peso * (1 + Reps / 30)
 */
export function calculate1RMEpley(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return weight * (1 + reps / 30);
}

export interface PRRecord {
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string; // ISO date string
}

/**
 * Encuentra el mejor set (basado en el 1RM estimado más alto) de una lista de sets.
 */
export function getBestSet(sets: WorkoutSet[]): { weight: number, reps: number, estimated1RM: number } | null {
  const validSets = sets.filter(s => s.weight !== undefined && s.reps !== undefined);
  if (!validSets || validSets.length === 0) return null;

  let bestSet = validSets[0];
  let max1RM = calculate1RMEpley(bestSet.weight!, bestSet.reps!);

  for (let i = 1; i < validSets.length; i++) {
    const set = validSets[i];
    const current1RM = calculate1RMEpley(set.weight!, set.reps!);
    if (current1RM > max1RM) {
      max1RM = current1RM;
      bestSet = set;
    }
  }

  return {
    weight: bestSet.weight!,
    reps: bestSet.reps!,
    estimated1RM: max1RM,
  };
}
