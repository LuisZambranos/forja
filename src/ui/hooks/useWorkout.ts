import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkoutSessionsByUser, finishWorkoutAndStreak } from '@core/services/workout.service';
import type { WorkoutSession, WorkoutSet } from '@core/models';

export function useWorkoutSessions(uid?: string, timeRangeMs?: number) {
  return useQuery({
    queryKey: ['workout_sessions', uid, timeRangeMs],
    queryFn: () => getWorkoutSessionsByUser(uid!, timeRangeMs),
    enabled: !!uid,
    staleTime: 1000 * 60 * 15
  });
}

export function useSaveWorkoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionData, sets }: { sessionData: Omit<WorkoutSession, 'id'>, sets: WorkoutSet[] }) => 
      finishWorkoutAndStreak(sessionData, sets),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['stats_sessions'] }); 
      queryClient.invalidateQueries({ queryKey: ['profile', variables.sessionData.owner_id] });
    }
  });
}
