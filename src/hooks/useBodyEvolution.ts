import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, getDocs, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../shared/firebase/config';
import type { BodyMetric } from '../shared/types';
import { useAuth } from './useAuth';

export function useBodyEvolution() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['body_metrics', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const q = query(
        collection(db, 'body_metrics'),
        where('owner_id', '==', user.uid),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BodyMetric));
    },
    enabled: !!user?.uid,
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  const addMetricMutation = useMutation({
    mutationFn: async (newMetric: Omit<BodyMetric, 'id' | 'owner_id'>) => {
      if (!user?.uid) throw new Error('No auth');
      const docRef = await addDoc(collection(db, 'body_metrics'), {
        ...newMetric,
        owner_id: user.uid,
      });
      return { id: docRef.id, ...newMetric, owner_id: user.uid };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_metrics', user?.uid] });
    }
  });

  const deleteMetricMutation = useMutation({
    mutationFn: async (metricId: string) => {
      if (!user?.uid) throw new Error('No auth');
      await deleteDoc(doc(db, 'body_metrics', metricId));
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
    deleteMetric: deleteMetricMutation.mutateAsync,
  };
}
