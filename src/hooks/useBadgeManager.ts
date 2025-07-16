import { useEffect, useMemo, useState } from 'react';
import { Todo } from '../types/todo';
import { 
  generateBadgedFavicon, 
  updateFavicon, 
  updateDocumentTitle,
  clearAllBadges,
  updatePlatformBadge,
  initializeBadgeSystem,
  isAndroid
} from '../utils/badgeUtils';

interface UseBadgeManagerProps {
  todos: Todo[];
  isConnected: boolean;
}

export const useBadgeManager = ({ todos, isConnected }: UseBadgeManagerProps) => {
  const [badgeSupported, setBadgeSupported] = useState<boolean>(false);
  const [initializationAttempted, setInitializationAttempted] = useState<boolean>(false);

  // Calculate count of today's todos (including overdue)
  const todayTodoCount = useMemo(() => {
    return todos.filter(todo => 
      !todo.completed && 
      todo.category === 'today'
    ).length;
  }, [todos]);

  // Initialize badge system on first load
  useEffect(() => {
    const initBadges = async () => {
      if (initializationAttempted) return;
      
      setInitializationAttempted(true);
      
      try {
        const supported = await initializeBadgeSystem();
        setBadgeSupported(supported);
        
        if (isAndroid() && supported) {
          console.log('Android badge system initialized with notification permissions');
        } else if (supported) {
          console.log('Badge API supported');
        } else {
          console.log('Badge system not available on this platform');
        }
      } catch (error) {
        console.error('Error initializing badge system:', error);
        setBadgeSupported(false);
      }
    };

    initBadges();
  }, [initializationAttempted]);

  // Update all badge indicators when count changes
  useEffect(() => {
    const updateBadges = async () => {
      if (!isConnected) {
        // Don't update badges when offline to avoid confusion
        return;
      }

      if (!badgeSupported) {
        // If badges aren't supported, still update document title and favicon
        updateDocumentTitle(todayTodoCount);
        
        if (todayTodoCount > 0) {
          const badgedFavicon = generateBadgedFavicon(todayTodoCount);
          updateFavicon(badgedFavicon);
        } else {
          // Reset to original favicon when no todos
          const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (existingFavicon) {
            existingFavicon.remove();
          }
          
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = '/favicon.ico';
          document.head.appendChild(link);
        }
        return;
      }

      try {
        // Update platform-specific badge (Android notifications or Badge API)
        await updatePlatformBadge(todayTodoCount);
        
        // Update document title
        updateDocumentTitle(todayTodoCount);
        
        // Update favicon with badge (works on all platforms)
        if (todayTodoCount > 0) {
          const badgedFavicon = generateBadgedFavicon(todayTodoCount);
          updateFavicon(badgedFavicon);
        } else {
          // Reset to original favicon when no todos
          const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (existingFavicon) {
            existingFavicon.remove();
          }
          
          const link = document.createElement('link');
          link.rel = 'icon';
          link.href = '/favicon.ico';
          document.head.appendChild(link);
        }
      } catch (error) {
        console.error('Error updating badges:', error);
      }
    };

    updateBadges();
  }, [todayTodoCount, isConnected, badgeSupported]);

  // Clear badges when component unmounts
  useEffect(() => {
    return () => {
      clearAllBadges();
    };
  }, []);

  return {
    todayTodoCount,
    badgeSupported,
    isAndroidDevice: isAndroid()
  };
}; 