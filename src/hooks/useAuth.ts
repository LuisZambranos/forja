import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../shared/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from '../shared/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // Initialize user in Firestore
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            display_name: firebaseUser.displayName || '',
            role: 'free',
            settings: {
              auto_timer: true
            }
          };
          await setDoc(userRef, newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
