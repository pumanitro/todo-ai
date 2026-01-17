import { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { User } from 'firebase/auth';

export type PostponedViewMode = 'list' | 'calendar';

interface UsePostponedViewModeReturn {
  viewMode: PostponedViewMode;
  setViewMode: (mode: PostponedViewMode) => Promise<void>;
  isLoading: boolean;
}

export const usePostponedViewMode = (user: User | null): UsePostponedViewModeReturn => {
  const [viewMode, setViewModeState] = useState<PostponedViewMode>('list');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load view mode preference from Firebase
  useEffect(() => {
    if (user?.uid) {
      const viewModeRef = ref(database, `users/${user.uid}/settings/postponedViewMode`);
      const unsubscribe = onValue(viewModeRef, (snapshot) => {
        const value = snapshot.val();
        if (value === 'calendar' || value === 'list') {
          setViewModeState(value);
        } else {
          setViewModeState('list'); // Default to list view
        }
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user?.uid]);

  // Save view mode preference to Firebase
  const setViewMode = async (mode: PostponedViewMode): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      const viewModeRef = ref(database, `users/${user.uid}/settings/postponedViewMode`);
      await set(viewModeRef, mode);
      setViewModeState(mode);
    } catch (error) {
      console.error('Error saving postponed view mode:', error);
    }
  };

  return {
    viewMode,
    setViewMode,
    isLoading,
  };
};
