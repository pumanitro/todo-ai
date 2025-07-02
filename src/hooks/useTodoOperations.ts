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
  addNewTaskId: (taskId: string) => void;
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
  const addTodo = async (text: string, dueDate?: string) => {
    try {
      const category = categorizeTodoByDueDate(dueDate);
      const minOrder = getMinOrderInCategory(todos, category);
      
      const newTaskId = await TodoService.addTodo(
        user.uid,
        text,
        category,
        minOrder - 1,
        dueDate
      );
      
      // Track the new task for bounceIn animation
      addNewTaskId(newTaskId);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      // Find any tasks that are blocked by the task being deleted
      const blockedChildren = todos.filter(todo => todo.blockedBy === todoId);
      
      // Clear blockedBy references for any children
      if (blockedChildren.length > 0) {
        await TodoService.clearBlockedReferences(user.uid, todoId, blockedChildren);
      }

      // Delete the main todo
      await TodoService.deleteTodo(user.uid, todoId);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleSaveEdit = async (
    selectedTodo: Todo,
    field: 'text' | 'description' | 'dueDate' | 'blockedBy',
    value: string
  ) => {
    try {
      let updates: any = {
        [field]: value.trim(),
      };

      // If updating due date, recategorize the todo
      if (field === 'dueDate') {
        const newCategory = categorizeTodoByDueDate(value || undefined);
        if (newCategory !== selectedTodo.category) {
          const minOrder = getMinOrderInCategory(todos, newCategory);
          updates.category = newCategory;
          updates.order = minOrder - 1;
        }
        
        // Clear dueDate if empty
        if (!value.trim()) {
          updates.dueDate = null;
        }
      }

      // Handle blockedBy field
      if (field === 'blockedBy') {
        if (!value.trim()) {
          updates.blockedBy = null;
        } else {
          // When a task becomes blocked, it should inherit the parent's category
          const parentTask = todos.find(t => t.id === value.trim());
          if (parentTask) {
            updates.category = parentTask.category;
            // Also update order to be near the parent
            const minOrder = getMinOrderInCategory(todos, parentTask.category);
            updates.order = minOrder - 1;
          }
        }
      }
      
      await TodoService.updateTodo(user.uid, selectedTodo.id, updates);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const newCompletedStatus = !completed;
      const currentTodo = todos.find(todo => todo.id === todoId);
      if (!currentTodo) return;

      // Find blocked children before completing the parent
      const blockedChildren = todos.filter(todo => todo.blockedBy === todoId && !todo.completed);
      
      let newOrder;
      let newCategory: 'today' | 'backlog' | 'postponed';
      
      if (newCompletedStatus) {
        // Trigger feedback when completing a task
        triggerTaskCompletionFeedback();
        // Add bounceOut animation for completing task
        addCompletingTaskId(todoId);
        
        // Completing a task - move to completed section
        const minCompletedOrder = getMinCompletedOrder(todos);
        newOrder = minCompletedOrder - 1;
        newCategory = currentTodo.category; // Keep current category

        // Wait for animation to complete before updating Firebase
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle blocked children when parent is completed
        if (blockedChildren.length > 0) {
          // Start animation for blocked children
          await animateTaskTransition(blockedChildren.map(child => child.id));
          
          // Move blocked children to backlog
          const minBacklogOrder = getMinOrderInCategory(todos, 'backlog');
          
          // Update all blocked children to move to backlog and clear blockedBy
          const childUpdates = blockedChildren.map((child, index) => ({
            id: child.id,
            updates: {
              category: 'backlog' as const,
              order: minBacklogOrder - 1 - index,
              blockedBy: null // Clear the blocking relationship
            }
          }));

          await TodoService.updateMultipleTodos(user.uid, childUpdates);
          
          // Show notification about moved tasks
          showBlockedTasksMovedNotification(blockedChildren.length, currentTodo.text);
        }
      } else {
        // Trigger reverse feedback when uncompleting a task
        triggerTaskUncompletionFeedback();
        // Add backOutUp animation for uncompleting task
        addUncompletingTaskId(todoId);
        
        // Uncompleting a task - recategorize based on due date
        newCategory = categorizeTodoByDueDate(currentTodo.dueDate);
        const minCategoryOrder = getMinOrderInCategory(todos, newCategory);
        newOrder = minCategoryOrder - 1;


        
        // Wait for animation to start and be visible, then update Firebase
        // This ensures both animation visibility and proper categorization
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const updateData: any = { 
        completed: newCompletedStatus,
        order: newOrder,
        category: newCategory,
        ...(newCompletedStatus && { completedAt: Date.now() })
      };
      
      // Explicitly remove completedAt when uncompleting
      if (!newCompletedStatus) {
        updateData.completedAt = null;
      }
      
      await TodoService.updateTodo(user.uid, todoId, updateData);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDragEnd = async (
    draggedTodoId: string,
    destinationCategory: 'today' | 'backlog' | 'postponed',
    destinationIndex: number
  ) => {
    try {
      const draggedTodo = todos.find(todo => todo.id === draggedTodoId);
      if (!draggedTodo) return;

      // Get all blocked children of the dragged task
      const blockedChildren = todos.filter(todo => todo.blockedBy === draggedTodoId);

      const newOrder = calculateDragOrder(todos, destinationCategory, destinationIndex, draggedTodoId);

      // Update the parent task
      await TodoService.updateTodo(user.uid, draggedTodoId, {
        category: destinationCategory,
        order: newOrder
      });

      // Update all blocked children to follow the parent
      if (blockedChildren.length > 0) {
        const childUpdates = blockedChildren.map((child, index) => ({
          id: child.id,
          updates: {
            category: destinationCategory as 'today' | 'backlog' | 'postponed',
            order: newOrder + 0.1 + (index * 0.01) // Ensure children have slightly higher order values
          }
        }));

        await TodoService.updateMultipleTodos(user.uid, childUpdates);
      }

    } catch (error) {
      console.error('Error reordering todos:', error);
    }
  };

  return {
    addTodo,
    deleteTodo,
    handleSaveEdit,
    toggleTodo,
    handleDragEnd,
  };
}; 