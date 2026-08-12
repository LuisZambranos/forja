import { useQuery } from '@tanstack/react-query';
import { collection, query, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '../shared/firebase/config';

export function useFirestoreQuery<T>(
  queryKey: unknown[],
  collectionName: string,
  constraints: QueryConstraint[] = [],
  staleTime: number = 0
) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      const q = query(collection(db, collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
    },
    staleTime
  });
}
