import { collection, doc, getDocs, addDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@core/config/firebase';
import type { BodyMetric } from '@core/models';

export async function getBodyMetricsByUser(uid: string): Promise<BodyMetric[]> {
  const q = query(
    collection(db, 'body_metrics'),
    where('owner_id', '==', uid),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as BodyMetric));
}

export async function createBodyMetric(data: Omit<BodyMetric, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'body_metrics'), data);
  return ref.id;
}

export async function deleteBodyMetric(id: string): Promise<void> {
  const ref = doc(db, 'body_metrics', id);
  await deleteDoc(ref);
}
