import { useEffect, useMemo } from 'react';
import { Todo } from '../types/todo';
import { 
  isAndroid
} from '../utils/badgeUtils';

interface UseBadgeManagerProps {
  todos: Todo[];
  isConnected: boolean;
}

export const useBadgeManager = ({ todos, isConnected }: UseBadgeManagerProps) => {
  // Calculate count of today's todos (including overdue) - keeping for potential future use
  const todayTodoCount = useMemo(() => {
    return todos.filter(todo => 
      !todo.completed && 
      todo.category === 'today'
    ).length;
  }, [todos]);

  // Badge functionality disabled - no updates to favicon, title, or app badge
  useEffect(() => {
    // Intentionally empty - all badge functionality removed
  }, [todayTodoCount, isConnected]);

  // Clear any existing badges on unmount
  useEffect(() => {
    return () => {
      // Reset document title to default
      document.title = 'Todo Flow';
      
      // Reset to original favicon
      const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (existingFavicon) {
        existingFavicon.remove();
      }
      
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = '/favicon.ico';
      document.head.appendChild(link);

      // Clear app badge if supported
      if ('clearAppBadge' in navigator) {
        try {
          (navigator as any).clearAppBadge();
        } catch (error) {
          // Ignore errors
        }
      }
    };
  }, []);

  return {
    todayTodoCount,
    badgeSupported: false, // Always false since badges are disabled
    isAndroidDevice: isAndroid()
  };
}; 