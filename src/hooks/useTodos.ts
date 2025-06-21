import { useState, useEffect } from 'react';
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
  showMovedTasksNotification: (tasksCount: number) => void;
  showBlockedTasksMovedNotification: (tasksCount: number, parentTaskName: string) => void;
  animateTaskTransition: (taskIds: string[]) => Promise<void>;
  animatingTaskIds: Set<string>;
  movedTasksNotification: string;
  setMovedTasksNotification: (message: string) => void;
}

export const useTodos = (user: User): UseTodosReturn => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [movedTasksNotification, setMovedTasksNotification] = useState<string>('');
  const [animatingTaskIds, setAnimatingTaskIds] = useState<Set<string>>(new Set());

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
    // Add tasks to animation set
    setAnimatingTaskIds(prev => {
      const newSet = new Set(prev);
      taskIds.forEach(id => newSet.add(id));
      return newSet;
    });

    // Remove from animation set after animation completes
    setTimeout(() => {
      setAnimatingTaskIds(prev => {
        const newSet = new Set(prev);
        taskIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }, 1000); // Animation duration
  };

  useEffect(() => {
    const moveTasksToTodayCategory = async (tasksToMove: Todo[], todoList: Todo[]) => {
      if (tasksToMove.length === 0) return;

      const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
      const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;

      // Move tasks to today category
      const updates = tasksToMove.map((task, index) => ({
        id: task.id,
        updates: {
          category: 'today' as const,
          order: minTodayOrder - 1 - index
        }
      }));

      await TodoService.updateMultipleTodos(user.uid, updates);
    };
    const handleSnapshot = async (snapshot: any) => {
      const data = snapshot.val();
      const todoList = transformFirebaseDataToTodos(data);
      
      // Handle auto-migration of postponed tasks that are now due today
      const tasksToMove = findTasksToMoveToToday(todoList);
      
      if (tasksToMove.length > 0) {
        // Start animation for tasks being moved
        await animateTaskTransition(tasksToMove.map(task => task.id));
        
        // Update Firebase first
        await moveTasksToTodayCategory(tasksToMove, todoList);
        showMovedTasksNotification(tasksToMove.length);
        
        // Now create the updated todoList with the changes we just made
        const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
        const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;
        
        const updatedTodoList = todoList.map(todo => {
          const taskToMoveIndex = tasksToMove.findIndex(t => t.id === todo.id);
          if (taskToMoveIndex >= 0) {
            const updatedTodo = {
              ...todo,
              category: 'today' as const,
              order: minTodayOrder - 1 - taskToMoveIndex
            };
            return updatedTodo;
          }
          return { ...todo }; // Create new object reference even for unchanged todos
        });
        
        setTodos([...updatedTodoList]); // Force new array reference
        setIsConnected(true);
        return;
      }

      setTodos(todoList);
      setIsConnected(true);
    };

    const handleError = (error: any) => {
      console.error('Firebase error:', error);
      setIsConnected(false);
    };
    
    try {
      const unsubscribe = TodoService.setupTodosListener(user.uid, handleSnapshot, handleError);
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
    }
  }, [user.uid]);

  return {
    todos,
    isConnected,
    showMovedTasksNotification,
    showBlockedTasksMovedNotification,
    animateTaskTransition,
    animatingTaskIds,
    movedTasksNotification,
    setMovedTasksNotification,
  };
}; 