import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@core/config/firebase';
import type { BodyMetric } from '@core/models';

export async function getBodyMetricsByUser(uid: string): Promise<BodyMetric[]> {
  const q = query(
    collection(db, 'body_metrics'),
    where('owner_id', '==', uid)
  );
  const snap = await getDocs(q);
  const metrics = snap.docs.map(d => ({ id: d.id, ...d.data() } as BodyMetric));
  return metrics.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function createBodyMetric(data: Omit<BodyMetric, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'body_metrics'), data);
  return ref.id;
}

export async function updateBodyMetric(id: string, data: Partial<BodyMetric>): Promise<void> {
  const ref = doc(db, 'body_metrics', id);
  await updateDoc(ref, data);
}

export async function deleteBodyMetric(id: string): Promise<void> {
  const ref = doc(db, 'body_metrics', id);
  await deleteDoc(ref);
}
