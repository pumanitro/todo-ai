import { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { User } from 'firebase/auth';

export type ViewMode = 'list' | 'calendar';

interface UseViewModeSettingReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => Promise<void>;
  isLoading: boolean;
}

/**
 * Persists a per-user "list | calendar" view preference under
 * `users/{uid}/settings/{settingKey}` in Firebase. Used by both the Today
 * section (todayViewMode) and any other section that toggles between a list
 * and a calendar.
 */
export const useViewModeSetting = (
  user: User | null,
  settingKey: string
): UseViewModeSettingReturn => {
  const [viewMode, setViewModeState] = useState<ViewMode>('list');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load view mode preference from Firebase
  useEffect(() => {
    if (user?.uid) {
      const viewModeRef = ref(database, `users/${user.uid}/settings/${settingKey}`);
      const unsubscribe = onValue(viewModeRef, (snapshot) => {
        const value = snapshot.val();
        setViewModeState(value === 'calendar' || value === 'list' ? value : 'list');
        setIsLoading(false);
      });

      return () => unsubscribe();
    } else {
      setIsLoading(false);
    }
  }, [user?.uid, settingKey]);

  // Save view mode preference to Firebase
  const setViewMode = async (mode: ViewMode): Promise<void> => {
    if (!user?.uid) return;

    try {
      const viewModeRef = ref(database, `users/${user.uid}/settings/${settingKey}`);
      await set(viewModeRef, mode);
      setViewModeState(mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  };

  return {
    viewMode,
    setViewMode,
    isLoading,
  };
};
