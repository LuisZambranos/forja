import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyExercises, getGlobalExercises, createExercise, updateExercise, deleteExercise } from '@core/services/exercises.service';
import type { Exercise } from '@core/models';

export function useMyExercises(uid?: string) {
  return useQuery({
    queryKey: ['exercises', uid],
    queryFn: () => getMyExercises(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 60
  });
}

export function useGlobalExercises() {
  return useQuery({
    queryKey: ['global_exercises'],
    queryFn: () => getGlobalExercises(),
    staleTime: 1000 * 60 * 60
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Exercise, 'id'>) => createExercise(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Exercise> }) => updateExercise(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    }
  });
}
