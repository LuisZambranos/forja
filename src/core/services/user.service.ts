import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@core/config/firebase';
import type { User } from '@core/models';

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) {
    return snap.data() as User;
  }
  return null;
}

export async function updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, data);
}

export async function createUserProfile(uid: string, data: User): Promise<void> {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, data);
}

import { auth } from '@core/config/firebase';
export async function logoutUser(): Promise<void> {
  await auth.signOut();
}

