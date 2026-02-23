import { useState, useEffect } from 'react';
import { ref, set, onValue } from 'firebase/database';
import { database } from '../firebase/config';
import { User } from 'firebase/auth';
import { EisenhowerTag } from '../types/todo';

interface UseEisenhowerFilterReturn {
  eisenhowerFilter: EisenhowerTag | null;
  setEisenhowerFilter: (tag: EisenhowerTag | null) => void;
}

export const useEisenhowerFilter = (user: User | null): UseEisenhowerFilterReturn => {
  const [eisenhowerFilter, setFilterState] = useState<EisenhowerTag | null>('do');

  useEffect(() => {
    if (user?.uid) {
      const filterRef = ref(database, `users/${user.uid}/settings/eisenhowerFilter`);
      const unsubscribe = onValue(filterRef, (snapshot) => {
        const value = snapshot.val();
        if (value === 'do' || value === 'schedule' || value === 'delegate' || value === 'delete') {
          setFilterState(value);
        } else if (value === 'all') {
          setFilterState(null);
        } else {
          setFilterState('do');
        }
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  const setEisenhowerFilter = (tag: EisenhowerTag | null) => {
    setFilterState(tag);
    if (user?.uid) {
      const filterRef = ref(database, `users/${user.uid}/settings/eisenhowerFilter`);
      set(filterRef, tag || 'all').catch((error) => {
        console.error('Error saving eisenhower filter:', error);
      });
    }
  };

  return { eisenhowerFilter, setEisenhowerFilter };
};
