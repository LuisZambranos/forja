import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@core/config/firebase';
import type { Routine } from '@core/models';

export async function getMyRoutines(uid: string): Promise<Routine[]> {
  const q = query(collection(db, 'routines'), where('owner_id', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Routine));
}

export async function getRoutineById(id: string): Promise<Routine | null> {
  const snap = await getDoc(doc(db, 'routines', id));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Routine;
  }
  return null;
}

export async function createRoutine(data: Omit<Routine, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'routines'), data);
  return ref.id;
}

export async function updateRoutine(id: string, data: Partial<Routine>): Promise<void> {
  const ref = doc(db, 'routines', id);
  await updateDoc(ref, data);
}

export async function deleteRoutine(id: string): Promise<void> {
  const ref = doc(db, 'routines', id);
  await deleteDoc(ref);
}
