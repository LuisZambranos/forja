import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, getDoc, writeBatch, increment, limit, QueryConstraint } from 'firebase/firestore';

export interface LastTimeStats {
  weight: number;
  reps: number;
  totalSets: number;
}

export async function getLastExerciseStats(uid: string, exerciseId: string): Promise<LastTimeStats | null> {
  const q = query(
    collection(db, 'workout_sessions'),
    where('owner_id', '==', uid),
    where('exercise_ids', 'array-contains', exerciseId),
    orderBy('finished_at', 'desc'),
    limit(1)
  );
  const snaps = await getDocs(q);
  if (snaps.empty) return null;
  
  const session = snaps.docs[0].data() as WorkoutSession;
  const matching = (session.sets || []).filter(s => s.exercise_id === exerciseId);
  
  if (matching.length > 0) {
    const bestSet = matching.reduce((prev, curr) => (curr.weight > prev.weight ? curr : prev));
    return { weight: bestSet.weight, reps: bestSet.reps, totalSets: matching.length };
  }
  return null;
}
import { db } from '@core/config/firebase';
import type { WorkoutSession, WorkoutSet } from '@core/models';

export async function getWorkoutSessionsByUser(uid: string, timeRangeMs?: number): Promise<WorkoutSession[]> {
  const constraints: QueryConstraint[] = [
    where('owner_id', '==', uid)
  ];
  
  if (timeRangeMs) {
    const timeAgo = Date.now() - timeRangeMs;
    constraints.push(where('finished_at', '>=', timeAgo));
    constraints.push(orderBy('finished_at', 'desc'));
  }
  
  const q = query(collection(db, 'workout_sessions'), ...constraints);
  const snap = await getDocs(q);
  
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkoutSession));
}

export async function getWorkoutSessionById(id: string): Promise<WorkoutSession | null> {
  const snap = await getDoc(doc(db, 'workout_sessions', id));
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as WorkoutSession;
  }
  return null;
}

export async function createWorkoutSession(data: Omit<WorkoutSession, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'workout_sessions'), data);
  return ref.id;
}

export async function finishWorkoutAndStreak(sessionData: Omit<WorkoutSession, 'id'>, completedSets: WorkoutSet[]): Promise<void> {
  const batch = writeBatch(db);
  const sessionRef = doc(collection(db, 'workout_sessions'));
  
  batch.set(sessionRef, {
    ...sessionData,
    id: sessionRef.id
  });

  const userRef = doc(db, 'users', sessionData.owner_id);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    const currentStreak = userData.current_streak || 0;
    const maxStreak = userData.max_streak || 0;
    const lastWorkoutDateStr = userData.last_workout_date || '';
    
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    let newStreak = currentStreak;
    let newDate = todayStr;
    let newMaxStreak = maxStreak;

    if (lastWorkoutDateStr !== todayStr) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      if (lastWorkoutDateStr === yesterdayStr) {
        newStreak = currentStreak + 1;
      } else {
        newStreak = 1;
      }
    }
    
    if (newStreak > newMaxStreak) {
      newMaxStreak = newStreak;
    }
    const sessionTonnage = completedSets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
    
    batch.set(userRef, {
      current_streak: newStreak,
      max_streak: newMaxStreak,
      last_workout_date: newDate,
      lifetime_tonnage: increment(sessionTonnage)
    }, { merge: true });
  }

  await batch.commit();
}

export async function updateWorkoutSession(id: string, data: Partial<WorkoutSession>): Promise<void> {
  const ref = doc(db, 'workout_sessions', id);
  await updateDoc(ref, data);
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const ref = doc(db, 'workout_sessions', id);
  await deleteDoc(ref);
}

