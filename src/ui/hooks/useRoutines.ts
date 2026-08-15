import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyRoutines, getRoutineById, createRoutine, updateRoutine, deleteRoutine } from '@core/services/routines.service';
import type { Routine } from '@core/models';

export function useMyRoutines(uid?: string) {
  return useQuery({
    queryKey: ['routines', uid],
    queryFn: () => getMyRoutines(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5
  });
}

export function useRoutine(id?: string) {
  return useQuery({
    queryKey: ['routine', id],
    queryFn: () => getRoutineById(id!),
    enabled: !!id
  });
}

export function useCreateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Routine, 'id'>) => createRoutine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });
}

export function useUpdateRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Routine> }) => updateRoutine(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routine', variables.id] });
    }
  });
}

export function useDeleteRoutine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRoutine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
    }
  });
}
