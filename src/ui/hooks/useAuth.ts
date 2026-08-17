import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@core/config/firebase';
import { getUserProfile, createUserProfile } from '@core/services/user.service';
import type { User } from '@core/models';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        
        if (profile) {
          setUser(profile);
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
          await createUserProfile(firebaseUser.uid, newUser);
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
