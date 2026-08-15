import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@core/config/firebase';
import type { Exercise } from '@core/models';

export async function getMyExercises(uid: string): Promise<Exercise[]> {
  const q = query(collection(db, 'exercises'), where('owner_id', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
}

export async function getGlobalExercises(): Promise<Exercise[]> {
  const q = query(collection(db, 'exercises'), where('is_global', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Exercise));
}

export async function getExerciseById(id: string): Promise<Exercise | null> {
  const snap = await getDoc(doc(db, 'exercises', id));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Exercise;
  }
  return null;
}

export async function createExercise(data: Omit<Exercise, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'exercises'), data);
  return ref.id;
}

export async function updateExercise(id: string, data: Partial<Exercise>): Promise<void> {
  const ref = doc(db, 'exercises', id);
  await updateDoc(ref, data);
}

export async function deleteExercise(id: string): Promise<void> {
  const ref = doc(db, 'exercises', id);
  await deleteDoc(ref);
}
