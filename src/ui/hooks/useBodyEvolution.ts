import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBodyMetricsByUser, createBodyMetric, deleteBodyMetric, updateBodyMetric } from '@core/services/progress.service';
import type { BodyMetric } from '@core/models';
import { useAuth } from './useAuth';

export function useBodyEvolution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['body_metrics', user?.uid],
    queryFn: () => getBodyMetricsByUser(user!.uid),
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  const addMetricMutation = useMutation({
    mutationFn: async (newMetric: Omit<BodyMetric, 'id' | 'owner_id'>) => {
      if (!user?.uid) throw new Error('No auth');
      const id = await createBodyMetric({
        ...newMetric,
        owner_id: user.uid,
      });
      return { id, ...newMetric, owner_id: user.uid };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_metrics', user?.uid] });
    }
  });

  const deleteMetricMutation = useMutation({
    mutationFn: async (metricId: string) => {
      if (!user?.uid) throw new Error('No auth');
      await deleteBodyMetric(metricId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_metrics', user?.uid] });
    }
  });

  const updateMetricMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<BodyMetric> }) => {
      if (!user?.uid) throw new Error('No auth');
      await updateBodyMetric(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_metrics', user?.uid] });
    }
  });

  return {
    metrics: metricsQuery.data || [],
    isLoading: metricsQuery.isLoading,
    addMetric: addMetricMutation.mutateAsync,
    isAdding: addMetricMutation.isPending,
    updateMetric: updateMetricMutation.mutateAsync,
    isUpdating: updateMetricMutation.isPending,
    deleteMetric: deleteMetricMutation.mutateAsync,
  };
}
