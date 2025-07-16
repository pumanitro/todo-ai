import { useEffect, useMemo } from 'react';
import { Todo } from '../types/todo';
import { 
  generateBadgedFavicon, 
  updateFavicon, 
  updateAppBadge, 
  updateDocumentTitle,
  clearAllBadges 
} from '../utils/badgeUtils';

interface UseBadgeManagerProps {
  todos: Todo[];
  isConnected: boolean;
}

export const useBadgeManager = ({ todos, isConnected }: UseBadgeManagerProps) => {
  // Calculate count of today's todos (including overdue)
  const todayTodoCount = useMemo(() => {
    return todos.filter(todo => 
      !todo.completed && 
      todo.category === 'today'
    ).length;
  }, [todos]);

  // Update all badge indicators when count changes
  useEffect(() => {
    const updateBadges = async () => {
      if (!isConnected) {
        // Don't update badges when offline to avoid confusion
        return;
      }

      try {
        // Update PWA app badge
        await updateAppBadge(todayTodoCount);
        
        // Update document title
        updateDocumentTitle(todayTodoCount);
        
        // Update favicon with badge
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
  }, [todayTodoCount, isConnected]);

  // Clear badges when component unmounts
  useEffect(() => {
    return () => {
      clearAllBadges();
    };
  }, []);

  return {
    todayTodoCount
  };
}; 