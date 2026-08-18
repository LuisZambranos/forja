import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { getWorkoutSessionsByUser, finishWorkoutAndStreak, getWorkoutHistoryPaginated, updateWorkoutSessionAndStreak, deleteWorkoutSession } from '@core/services/workout.service';
import type { WorkoutSession, WorkoutSet } from '@core/models';

export function useWorkoutSessions(uid?: string, timeRangeMs?: number) {
  return useQuery({
    queryKey: ['workout_sessions', uid, timeRangeMs],
    queryFn: () => getWorkoutSessionsByUser(uid!, timeRangeMs),
    enabled: !!uid,
    staleTime: 1000 * 60 * 15
  });
}

export function useWorkoutHistoryInfinite(uid?: string) {
  return useInfiniteQuery({
    queryKey: ['workout_history_infinite', uid],
    queryFn: ({ pageParam }) => getWorkoutHistoryPaginated(uid!, pageParam, 10),
    getNextPageParam: (lastPage) => lastPage.lastDoc || undefined,
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
    initialPageParam: null as any,
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

export function useUpdateWorkoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sessionData, sets }: { id: string, sessionData: Partial<WorkoutSession>, sets: WorkoutSet[] }) => 
      updateWorkoutSessionAndStreak(id, sessionData, sets),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['workout_history_infinite'] });
      queryClient.invalidateQueries({ queryKey: ['stats_sessions'] }); 
      if (variables.sessionData.owner_id) {
        queryClient.invalidateQueries({ queryKey: ['profile', variables.sessionData.owner_id] });
      }
    }
  });
}

export function useDeleteWorkoutSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWorkoutSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout_sessions'] });
      queryClient.invalidateQueries({ queryKey: ['workout_history_infinite'] });
      queryClient.invalidateQueries({ queryKey: ['stats_sessions'] }); 
    }
  });
}
