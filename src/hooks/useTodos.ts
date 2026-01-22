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
  addNewTaskId: (taskId: string, replaceId?: string) => void;
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
  // Show syncing indicator ONLY when transitioning from offline to online
  const [showReconnectSync, setShowReconnectSync] = useState<boolean>(false);
  const wasOfflineRef = useRef<boolean>(!navigator.onLine);
  
  // Ref to track current todos for visibility listener
  const todosRef = useRef<Todo[]>([]);
  
  // Track newId → stableKey mapping for optimistic updates
  // This gets populated when a new task is created and Firebase returns the real ID
  const stableKeyMapRef = useRef<Map<string, string>>(new Map());

  // Track online/offline status - show syncing only on offline->online transition
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Only show syncing indicator if we were previously offline
      if (wasOfflineRef.current) {
        setShowReconnectSync(true);
        wasOfflineRef.current = false;
        // Auto-hide after 3 seconds
        setTimeout(() => setShowReconnectSync(false), 3000);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setShowReconnectSync(false);
    };
    
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
            
      // Preserve stableKey from existing todos (for animation stability)
      const existingTodos = queryClient.getQueryData<Todo[]>(['todos', user.uid]) || [];
      
      // Find temp todos that exist in cache (will be replaced by Firebase todo)
      const tempTodosByKey = new Map<string, string>();
      const existingIds = new Set<string>();
      existingTodos.forEach(t => {
        existingIds.add(t.id);
        if (t.id.startsWith('temp_') && t.stableKey) {
          const key = `${t.text}|${t.category || 'today'}`;
          tempTodosByKey.set(key, t.stableKey);
        }
      });
      
      // Preserve stableKey from non-temp existing todos
      const existingStableKeys = new Map<string, string>();
      existingTodos.forEach(t => {
        if (t.stableKey && !t.id.startsWith('temp_')) {
          existingStableKeys.set(t.id, t.stableKey);
        }
      });
      
      // Find new todos (in Firebase but not in existing cache)
      const newTodoIds = new Set<string>();
      todoList.forEach(t => {
        if (!existingIds.has(t.id) && !t.id.startsWith('temp_')) {
          newTodoIds.add(t.id);
        }
      });
      
      const mergedTodoList = todoList.map(t => {
        let stableKey = stableKeyMapRef.current.get(t.id);
        if (!stableKey && newTodoIds.has(t.id)) {
          const key = `${t.text}|${t.category || 'today'}`;
          stableKey = tempTodosByKey.get(key);
        }
        if (!stableKey) {
          stableKey = existingStableKeys.get(t.id) || t.stableKey;
        }
        return { ...t, stableKey };
      });
      
      // Update query cache with new data
      queryClient.setQueryData(['todos', user.uid], mergedTodoList);
            
            // Resolve on first load
            resolve(mergedTodoList);
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
      
      // Preserve stableKey from existing todos (for animation stability)
      const existingTodos = queryClient.getQueryData<Todo[]>(['todos', user.uid]) || [];
      
      // Find temp todos that exist in cache (will be replaced by Firebase todo)
      // Key: "text|category" → stableKey
      const tempTodosByKey = new Map<string, string>();
      const existingIds = new Set<string>();
      existingTodos.forEach(t => {
        existingIds.add(t.id);
        if (t.id.startsWith('temp_') && t.stableKey) {
          const key = `${t.text}|${t.category || 'today'}`;
          tempTodosByKey.set(key, t.stableKey);
        }
      });
      
      // Also preserve stableKey from non-temp existing todos
      const existingStableKeys = new Map<string, string>();
      existingTodos.forEach(t => {
        if (t.stableKey && !t.id.startsWith('temp_')) {
          existingStableKeys.set(t.id, t.stableKey);
        }
      });
      
      // Find new todos (in Firebase but not in existing cache)
      const newTodoIds = new Set<string>();
      todoList.forEach(t => {
        if (!existingIds.has(t.id) && !t.id.startsWith('temp_')) {
          newTodoIds.add(t.id);
        }
      });
      
      const mergedTodoList = todoList.map(t => {
        // Priority: 1) stableKeyMapRef, 2) match temp→new by text+category, 3) existing stableKey
        let stableKey = stableKeyMapRef.current.get(t.id);
        if (!stableKey && newTodoIds.has(t.id)) {
          // This is a new Firebase todo - check if it matches a temp todo by text+category
          const key = `${t.text}|${t.category || 'today'}`;
          stableKey = tempTodosByKey.get(key);
        }
        if (!stableKey) {
          stableKey = existingStableKeys.get(t.id) || t.stableKey;
        }
        return { ...t, stableKey };
      });
      
      // Update TanStack Query cache
      queryClient.setQueryData(['todos', user.uid], mergedTodoList);
      
      // Handle auto-migration of postponed tasks that are now due today
      const tasksToMove = findTasksToMoveToToday(mergedTodoList);
      
      if (tasksToMove.length > 0) {
        await handleAutoMigration(tasksToMove, mergedTodoList);
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

  // Syncing indicator only shows when coming back online (for 3 seconds)
  const hasPendingSync = showReconnectSync;

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

  // Ref to track scheduled cleanup timeouts for new task animations
  const newTaskCleanupRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  const addNewTaskId = (taskId: string, replaceId?: string) => {
    // If replacing tempId with realId, register the stableKey mapping
    // The stableKey is the tempId itself (since optimistic todo has stableKey = tempId)
    if (replaceId) {
      stableKeyMapRef.current.set(taskId, replaceId);
    }
    
    setNewTaskIds(prev => {
      const newSet = new Set(prev);
      // If replacing an ID (tempId -> realId), keep the tempId in the set
      // since we now check by stableKey (which equals tempId)
      // The cleanup timeout will handle removal after animation completes
      if (replaceId) {
        // Don't modify newSet - keep replaceId (the stableKey) in the set
        // The existing timeout for replaceId will clean it up
        return prev; // No change needed
      }
      newSet.add(taskId);
      return newSet;
    });
    
    // Schedule cleanup for this taskId
    const timeout = setTimeout(() => {
      setNewTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      newTaskCleanupRef.current.delete(taskId);
    }, replaceId ? 500 : 1000); // Shorter timeout for replacement since animation already started
    
    newTaskCleanupRef.current.set(taskId, timeout);
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
