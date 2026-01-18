import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { Todo } from '../types/todo';
import { TodoService } from '../services/todoService';
import { 
  transformFirebaseDataToTodos, 
  findTasksToMoveToToday 
} from '../utils/todoUtils';

interface UseTodosReturn {
  todos: Todo[];
  isConnected: boolean;
  isOnline: boolean;
  hasPendingSync: boolean;
  showMovedTasksNotification: (tasksCount: number) => void;
  showBlockedTasksMovedNotification: (tasksCount: number, parentTaskName: string) => void;
  animateTaskTransition: (taskIds: string[]) => Promise<void>;
  animatingTaskIds: Set<string>;
  movedTasksNotification: string;
  setMovedTasksNotification: (message: string) => void;
  newTaskIds: Set<string>;
  completingTaskIds: Set<string>;
  uncompletingTaskIds: Set<string>;
  addNewTaskId: (taskId: string) => void;
  addCompletingTaskId: (taskId: string) => void;
  addUncompletingTaskId: (taskId: string) => void;
  syncNow: () => Promise<void>;
}

export const useTodos = (user: User): UseTodosReturn => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [movedTasksNotification, setMovedTasksNotification] = useState<string>('');
  const [animatingTaskIds, setAnimatingTaskIds] = useState<Set<string>>(new Set());
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [uncompletingTaskIds, setUncompletingTaskIds] = useState<Set<string>>(new Set());
  
  // Ref to track current todos for visibility listener
  const todosRef = useRef<Todo[]>([]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Use TanStack Query with Firebase real-time listener
  const { data: todos = [], isSuccess: isConnected } = useQuery({
    queryKey: ['todos', user.uid],
    queryFn: () => {
      return new Promise<Todo[]>((resolve, reject) => {
        // Set up Firebase listener
        const unsubscribe = TodoService.setupTodosListener(
          user.uid,
          (snapshot) => {
            const data = snapshot.val();
            const todoList = transformFirebaseDataToTodos(data);
            
            // Update query cache with new data
            queryClient.setQueryData(['todos', user.uid], todoList);
            
            // Resolve on first load
            resolve(todoList);
          },
          (error) => {
            console.error('Firebase error:', error);
            reject(error);
          }
        );

        // Store unsubscribe for cleanup
        return () => unsubscribe();
      });
    },
    // Keep data fresh
    staleTime: Infinity, // Firebase handles real-time updates
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    networkMode: 'offlineFirst', // Show cached data when offline
    refetchOnMount: false, // Firebase listener handles updates
    refetchOnWindowFocus: false, // Firebase listener handles updates
    refetchOnReconnect: false, // Firebase listener handles updates
  });

  // Set up Firebase listener separately to handle real-time updates
  useEffect(() => {
    const handleSnapshot = async (snapshot: any) => {
      const data = snapshot.val();
      const todoList = transformFirebaseDataToTodos(data);
      
      // Update TanStack Query cache
      queryClient.setQueryData(['todos', user.uid], todoList);
      
      // Handle auto-migration of postponed tasks that are now due today
      const tasksToMove = findTasksToMoveToToday(todoList);
      
      if (tasksToMove.length > 0) {
        await handleAutoMigration(tasksToMove, todoList);
      }
    };

    const handleError = (error: any) => {
      console.error('Firebase error:', error);
    };
    
    const unsubscribe = TodoService.setupTodosListener(user.uid, handleSnapshot, handleError);
    
    // Add auto-migration trigger when app becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && todosRef.current.length > 0) {
        const tasksToMove = findTasksToMoveToToday(todosRef.current);
        if (tasksToMove.length > 0) {
          const currentData = todosRef.current.reduce((acc, todo) => {
            acc[todo.id] = { ...todo };
            return acc;
          }, {} as any);
          handleSnapshot({ val: () => currentData });
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user.uid, queryClient]);

  // Update ref whenever todos change
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  // Check for pending mutations
  const hasPendingSync = queryClient.isMutating() > 0 || 
    queryClient.getMutationCache().getAll().some(m => m.state.isPaused);

  const handleAutoMigration = async (tasksToMove: Todo[], todoList: Todo[]) => {
    const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
    const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;

    const allUpdates: Array<{ id: string; updates: any }> = [];
    const allTaskIdsToAnimate: string[] = [];
    let orderOffset = 0;

    tasksToMove.forEach((parentTask) => {
      allTaskIdsToAnimate.push(parentTask.id);
      allUpdates.push({
        id: parentTask.id,
        updates: {
          category: 'today' as const,
          order: minTodayOrder - 1 - orderOffset
        }
      });
      orderOffset++;

      const blockedChildren = todoList.filter(todo => 
        todo.blockedBy === parentTask.id && !todo.completed
      );

      blockedChildren.forEach((child, childIndex) => {
        allTaskIdsToAnimate.push(child.id);
        allUpdates.push({
          id: child.id,
          updates: {
            category: 'today' as const,
            order: minTodayOrder - 1 - orderOffset + 0.1 + (childIndex * 0.01)
          }
        });
      });
    });

    await animateTaskTransition(allTaskIdsToAnimate);
    await TodoService.updateMultipleTodos(user.uid, allUpdates);
    showMovedTasksNotification(allTaskIdsToAnimate.length);
  };

  const showMovedTasksNotification = (tasksCount: number) => {
    const message = tasksCount === 1 
      ? `1 task was moved from Postponed to Today because it's due today`
      : `${tasksCount} tasks were moved from Postponed to Today because they're due today`;
    setMovedTasksNotification(message);
  };

  const showBlockedTasksMovedNotification = (tasksCount: number, parentTaskName: string) => {
    const message = tasksCount === 1 
      ? `1 blocked task moved to Backlog after "${parentTaskName}" was completed`
      : `${tasksCount} blocked tasks moved to Backlog after "${parentTaskName}" was completed`;
    setMovedTasksNotification(message);
  };

  const animateTaskTransition = async (taskIds: string[]) => {
    setAnimatingTaskIds(prev => {
      const newSet = new Set(prev);
      taskIds.forEach(id => newSet.add(id));
      return newSet;
    });

    setTimeout(() => {
      setAnimatingTaskIds(prev => {
        const newSet = new Set(prev);
        taskIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }, 1000);
  };

  const addNewTaskId = (taskId: string) => {
    setNewTaskIds(prev => new Set(prev).add(taskId));
    setTimeout(() => {
      setNewTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000);
  };

  const addCompletingTaskId = (taskId: string) => {
    setCompletingTaskIds(prev => new Set(prev).add(taskId));
    setTimeout(() => {
      setCompletingTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000);
  };

  const addUncompletingTaskId = (taskId: string) => {
    setUncompletingTaskIds(prev => new Set(prev).add(taskId));
    setTimeout(() => {
      setUncompletingTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000);
  };

  const syncNow = async () => {
    // Resume any paused mutations
    await queryClient.resumePausedMutations();
  };

  return {
    todos,
    isConnected,
    isOnline,
    hasPendingSync,
    showMovedTasksNotification,
    showBlockedTasksMovedNotification,
    animateTaskTransition,
    animatingTaskIds,
    movedTasksNotification,
    setMovedTasksNotification,
    newTaskIds,
    completingTaskIds,
    uncompletingTaskIds,
    addNewTaskId,
    addCompletingTaskId,
    addUncompletingTaskId,
    syncNow,
  };
};
