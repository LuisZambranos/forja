import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, QueryConstraint, FirestoreError } from 'firebase/firestore';
import { db } from '../shared/firebase/config';

export function useFirestoreQuery<T>(
  queryKey: unknown[],
  collectionName: string,
  constraints: QueryConstraint[] = [],
  staleTime: number = 0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey,
    enabled,
    queryFn: async () => {
      try {
        const q = query(collection(db, collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
      } catch (err: unknown) {
        const code = (err as FirestoreError)?.code ?? 'unknown';
        const message = (err as FirestoreError)?.message ?? String(err);
        console.error(
          `[useFirestoreQuery] Error en colección "${collectionName}" (code: ${code}):`,
          message
        );
        throw err; // Re-lanzar para que React Query lo capture en error/isError
      }
    },
    staleTime
  });
}
