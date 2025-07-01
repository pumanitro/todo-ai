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
  newTaskIds: Set<string>;
  completingTaskIds: Set<string>;
  migrationTaskIds: Set<string>;
  addNewTaskId: (taskId: string) => void;
  addCompletingTaskId: (taskId: string) => void;
  addMigrationTaskId: (taskId: string) => void;
}

export const useTodos = (user: User): UseTodosReturn => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [movedTasksNotification, setMovedTasksNotification] = useState<string>('');
  const [animatingTaskIds, setAnimatingTaskIds] = useState<Set<string>>(new Set());
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(new Set());
  const [migrationTaskIds, setMigrationTaskIds] = useState<Set<string>>(new Set());

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

  const addNewTaskId = (taskId: string) => {
    setNewTaskIds(prev => new Set(prev).add(taskId));
    // Remove from new task set after animation completes
    setTimeout(() => {
      setNewTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000); // Animation duration
  };

  const addCompletingTaskId = (taskId: string) => {
    setCompletingTaskIds(prev => new Set(prev).add(taskId));
    // Remove from completing task set after animation completes
    setTimeout(() => {
      setCompletingTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000); // Animation duration
  };

  const addMigrationTaskId = (taskId: string) => {
    setMigrationTaskIds(prev => new Set(prev).add(taskId));
    // Remove from migration task set after animation completes
    setTimeout(() => {
      setMigrationTaskIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }, 1000); // Animation duration
  };

  useEffect(() => {
    const moveTasksToTodayCategory = async (tasksToMove: Todo[], todoList: Todo[]) => {
      if (tasksToMove.length === 0) return;

      const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
      const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;

      // Collect all tasks to update (parents + their blocked children)
      const allUpdates: Array<{ id: string; updates: any }> = [];
      let orderOffset = 0;

      tasksToMove.forEach((parentTask) => {
        // Add the parent task update
        allUpdates.push({
          id: parentTask.id,
          updates: {
            category: 'today' as const,
            order: minTodayOrder - 1 - orderOffset
          }
        });
        orderOffset++;

        // Find and add blocked children
        const blockedChildren = todoList.filter(todo => 
          todo.blockedBy === parentTask.id && !todo.completed
        );

        blockedChildren.forEach((child, childIndex) => {
          allUpdates.push({
            id: child.id,
            updates: {
              category: 'today' as const,
              order: minTodayOrder - 1 - orderOffset + 0.1 + (childIndex * 0.01) // Ensure children have slightly higher order values
            }
          });
        });
      });

      await TodoService.updateMultipleTodos(user.uid, allUpdates);
    };
    const handleSnapshot = async (snapshot: any) => {
      const data = snapshot.val();
      const todoList = transformFirebaseDataToTodos(data);
      
      // Handle auto-migration of postponed tasks that are now due today
      const tasksToMove = findTasksToMoveToToday(todoList);
      
      if (tasksToMove.length > 0) {
        // Collect all task IDs that will be animated (parents + blocked children)
        const allTaskIdsToAnimate: string[] = [];
        tasksToMove.forEach(parentTask => {
          allTaskIdsToAnimate.push(parentTask.id);
          
          // Find blocked children of this parent
          const blockedChildren = todoList.filter(todo => 
            todo.blockedBy === parentTask.id && !todo.completed
          );
          blockedChildren.forEach(child => allTaskIdsToAnimate.push(child.id));
        });
        
        // Start migration animation for all tasks being moved (parents + children)
        allTaskIdsToAnimate.forEach(taskId => addMigrationTaskId(taskId));
        
        // Update Firebase first
        await moveTasksToTodayCategory(tasksToMove, todoList);
        
        // Count total tasks moved (parents + children)
        const totalTasksMoved = allTaskIdsToAnimate.length;
        showMovedTasksNotification(totalTasksMoved);
        
        // Now create the updated todoList with the changes we just made
        const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
        const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;
        
        // Collect all tasks that were moved (parents + their blocked children)
        const allMovedTaskIds = new Set<string>();
        
        tasksToMove.forEach((parentTask) => {
          allMovedTaskIds.add(parentTask.id);
          
          // Find blocked children of this parent
          const blockedChildren = todoList.filter(todo => 
            todo.blockedBy === parentTask.id && !todo.completed
          );
          blockedChildren.forEach(child => allMovedTaskIds.add(child.id));
        });
        
        const updatedTodoList = todoList.map(todo => {
          if (allMovedTaskIds.has(todo.id)) {
            // Check if this is a parent task being moved
            const taskToMoveIndex = tasksToMove.findIndex(t => t.id === todo.id);
            if (taskToMoveIndex >= 0) {
              // This is a parent task
              const updatedTodo = {
                ...todo,
                category: 'today' as const,
                order: minTodayOrder - 1 - taskToMoveIndex
              };
              return updatedTodo;
            } else {
              // This is a blocked child - find its parent
              const parentTask = tasksToMove.find(parent => {
                const blockedChildren = todoList.filter(t => t.blockedBy === parent.id && !t.completed);
                return blockedChildren.some(child => child.id === todo.id);
              });
              
              if (parentTask) {
                const parentIndex = tasksToMove.findIndex(t => t.id === parentTask.id);
                const blockedChildren = todoList.filter(t => t.blockedBy === parentTask.id && !t.completed);
                const childIndex = blockedChildren.findIndex(child => child.id === todo.id);
                
                return {
                  ...todo,
                  category: 'today' as const,
                  order: minTodayOrder - 1 - parentIndex + 0.1 + (childIndex * 0.01)
                };
              }
            }
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
    newTaskIds,
    completingTaskIds,
    migrationTaskIds,
    addNewTaskId,
    addCompletingTaskId,
    addMigrationTaskId,
  };
}; 