import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from 'firebase/auth';
import { Todo } from '../types/todo';
import { TodoService } from '../services/todoService';
import { triggerTaskCompletionFeedback, triggerTaskUncompletionFeedback } from '../utils/feedbackUtils';
import { 
  categorizeTodoByDueDate, 
  getMinOrderInCategory, 
  getMinCompletedOrder,
  calculateDragOrder 
} from '../utils/todoUtils';

interface UseTodoOperationsProps {
  user: User;
  todos: Todo[];
  animateTaskTransition: (taskIds: string[]) => Promise<void>;
  showBlockedTasksMovedNotification: (tasksCount: number, parentTaskName: string) => void;
  addNewTaskId: (taskId: string, replaceId?: string) => void;
  addCompletingTaskId: (taskId: string) => void;
  addUncompletingTaskId: (taskId: string) => void;
}

export const useTodoOperations = ({
  user,
  todos,
  animateTaskTransition,
  showBlockedTasksMovedNotification,
  addNewTaskId,
  addCompletingTaskId,
  addUncompletingTaskId,
}: UseTodoOperationsProps) => {
  const queryClient = useQueryClient();
  const queryKey = ['todos', user.uid];

  // Add todo mutation with optimistic update
  const addMutation = useMutation({
    mutationFn: async ({ text, dueDate }: { text: string; dueDate?: string }) => {
      const category = categorizeTodoByDueDate(dueDate);
      const minOrder = getMinOrderInCategory(todos, category);
      return TodoService.addTodo(user.uid, text, category, minOrder - 1, dueDate);
    },
    onMutate: async ({ text, dueDate }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey });
      
      // Snapshot the previous value
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      
      // Optimistically add the new todo
      const category = categorizeTodoByDueDate(dueDate);
      const minOrder = getMinOrderInCategory(todos, category);
      const tempId = `temp_${Date.now()}`;
      const optimisticTodo: Todo = {
        id: tempId,
        text,
        completed: false,
        timestamp: Date.now(),
        order: minOrder - 1,
        category,
        stableKey: tempId, // Stable key for React to prevent remount on ID change
        ...(dueDate && { dueDate }),
      };
      
      queryClient.setQueryData<Todo[]>(queryKey, (old) => 
        old ? [...old, optimisticTodo] : [optimisticTodo]
      );
      
      // Track for animation
      addNewTaskId(tempId);
      
      return { previousTodos, tempId };
    },
    onSuccess: (newId, _, context) => {
      // Replace temp id with real id in animation tracking so animation continues smoothly
      if (context?.tempId) {
        addNewTaskId(newId, context.tempId);
      }
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    networkMode: 'offlineFirst',
  });

  // Update todo mutation
  const updateMutation = useMutation({
    mutationFn: async ({ todoId, updates }: { todoId: string; updates: Partial<Todo> }) => {
      return TodoService.updateTodo(user.uid, todoId, updates);
    },
    onMutate: async ({ todoId, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.map(todo => todo.id === todoId ? { ...todo, ...updates } : todo)
      );
      
      return { previousTodos };
    },
    onError: (_, __, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    networkMode: 'offlineFirst',
  });

  // Delete todo mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ todoId, blockedChildren }: { todoId: string; blockedChildren: Todo[] }) => {
      if (blockedChildren.length > 0) {
        await TodoService.clearBlockedReferences(user.uid, todoId, blockedChildren);
      }
      return TodoService.deleteTodo(user.uid, todoId);
    },
    onMutate: async ({ todoId, blockedChildren }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.filter(todo => todo.id !== todoId).map(todo =>
          blockedChildren.some(child => child.id === todo.id)
            ? { ...todo, blockedBy: null }
            : todo
        )
      );
      
      return { previousTodos };
    },
    onError: (_, __, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    networkMode: 'offlineFirst',
  });

  // Toggle todo mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ todoId, newCompletedStatus, newOrder, newCategory, blockedChildren, currentTodo }: {
      todoId: string;
      newCompletedStatus: boolean;
      newOrder: number;
      newCategory: 'today' | 'backlog' | 'postponed';
      blockedChildren: Todo[];
      currentTodo: Todo;
    }) => {
      const updateData: any = { 
        completed: newCompletedStatus,
        order: newOrder,
        category: newCategory,
        ...(newCompletedStatus && { completedAt: Date.now() })
      };
      
      if (!newCompletedStatus) {
        updateData.completedAt = null;
      }

      // Handle blocked children when completing
      if (newCompletedStatus && blockedChildren.length > 0) {
        const minBacklogOrder = getMinOrderInCategory(todos, 'backlog');
        const childUpdates = blockedChildren.map((child, index) => ({
          id: child.id,
          updates: {
            category: 'backlog' as const,
            order: minBacklogOrder - 1 - index,
            blockedBy: null
          }
        }));
        await TodoService.updateMultipleTodos(user.uid, childUpdates);
      }

      return TodoService.updateTodo(user.uid, todoId, updateData);
    },
    onMutate: async ({ todoId, newCompletedStatus, newOrder, newCategory, blockedChildren }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.map(todo => {
          if (todo.id === todoId) {
            return {
              ...todo,
              completed: newCompletedStatus,
              order: newOrder,
              category: newCategory,
              ...(newCompletedStatus ? { completedAt: Date.now() } : { completedAt: undefined })
            };
          }
          // Handle blocked children becoming unblocked
          if (newCompletedStatus && blockedChildren.some(child => child.id === todo.id)) {
            const minBacklogOrder = getMinOrderInCategory(todos, 'backlog');
            const childIndex = blockedChildren.findIndex(child => child.id === todo.id);
            return {
              ...todo,
              category: 'backlog' as const,
              order: minBacklogOrder - 1 - childIndex,
              blockedBy: null
            };
          }
          return todo;
        })
      );
      
      return { previousTodos };
    },
    onError: (_, __, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    networkMode: 'offlineFirst',
  });

  // Multiple updates mutation
  const updateMultipleMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; updates: Partial<Todo> }>) => {
      return TodoService.updateMultipleTodos(user.uid, updates);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.map(todo => {
          const update = updates.find(u => u.id === todo.id);
          return update ? { ...todo, ...update.updates } : todo;
        })
      );
      
      return { previousTodos };
    },
    onError: (_, __, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(queryKey, context.previousTodos);
      }
    },
    networkMode: 'offlineFirst',
  });

  const addTodo = async (text: string, dueDate?: string) => {
    addMutation.mutate({ text, dueDate });
  };

  const deleteTodo = async (todoId: string) => {
    const blockedChildren = todos.filter(todo => todo.blockedBy === todoId);
    deleteMutation.mutate({ todoId, blockedChildren });
  };

  const handleSaveEdit = async (
    selectedTodo: Todo,
    field: 'text' | 'description' | 'dueDate' | 'blockedBy',
    value: string
  ) => {
    let updates: any = {
      [field]: value.trim(),
    };

    if (field === 'dueDate') {
      const newCategory = categorizeTodoByDueDate(value || undefined);
      if (newCategory !== selectedTodo.category) {
        const minOrder = getMinOrderInCategory(todos, newCategory);
        updates.category = newCategory;
        updates.order = minOrder - 1;
      }
      
      if (!value.trim()) {
        updates.dueDate = null;
      }
    }

    if (field === 'blockedBy') {
      if (!value.trim()) {
        updates.blockedBy = null;
      } else {
        const parentTask = todos.find(t => t.id === value.trim());
        if (parentTask) {
          updates.category = parentTask.category;
          const minOrder = getMinOrderInCategory(todos, parentTask.category);
          updates.order = minOrder - 1;
        }
      }
    }
    
    updateMutation.mutate({ todoId: selectedTodo.id, updates });
  };

  const toggleTodo = async (todoId: string, completed: boolean) => {
    const newCompletedStatus = !completed;
    const currentTodo = todos.find(todo => todo.id === todoId);
    if (!currentTodo) return;

    const blockedChildren = todos.filter(todo => todo.blockedBy === todoId && !todo.completed);
    
    let newOrder;
    let newCategory: 'today' | 'backlog' | 'postponed';
    
    if (newCompletedStatus) {
      triggerTaskCompletionFeedback();
      addCompletingTaskId(todoId);
      
      const minCompletedOrder = getMinCompletedOrder(todos);
      newOrder = minCompletedOrder - 1;
      newCategory = currentTodo.category;

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (blockedChildren.length > 0) {
        await animateTaskTransition(blockedChildren.map(child => child.id));
        showBlockedTasksMovedNotification(blockedChildren.length, currentTodo.text);
      }
    } else {
      triggerTaskUncompletionFeedback();
      addUncompletingTaskId(todoId);
      
      newCategory = categorizeTodoByDueDate(currentTodo.dueDate);
      const minCategoryOrder = getMinOrderInCategory(todos, newCategory);
      newOrder = minCategoryOrder - 1;

      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    toggleMutation.mutate({
      todoId,
      newCompletedStatus,
      newOrder,
      newCategory,
      blockedChildren,
      currentTodo,
    });
  };

  const handleDragEnd = async (
    draggedTodoId: string,
    destinationCategory: 'today' | 'backlog' | 'postponed',
    destinationIndex: number
  ) => {
    const draggedTodo = todos.find(todo => todo.id === draggedTodoId);
    if (!draggedTodo) return;

    const blockedChildren = todos.filter(todo => todo.blockedBy === draggedTodoId);
    const newOrder = calculateDragOrder(todos, destinationCategory, destinationIndex, draggedTodoId);

    // Build all updates
    const updates: Array<{ id: string; updates: Partial<Todo> }> = [
      { id: draggedTodoId, updates: { category: destinationCategory, order: newOrder } }
    ];

    blockedChildren.forEach((child, index) => {
      updates.push({
        id: child.id,
        updates: {
          category: destinationCategory,
          order: newOrder + 0.1 + (index * 0.01)
        }
      });
    });

    updateMultipleMutation.mutate(updates);
  };

  return {
    addTodo,
    deleteTodo,
    handleSaveEdit,
    toggleTodo,
    handleDragEnd,
  };
};
