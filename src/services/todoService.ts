import { database } from '../firebase/config';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { Todo } from '../types/todo';

export class TodoService {
  static async addTodo(
    userId: string,
    text: string,
    category: 'today' | 'backlog' | 'postponed',
    order: number,
    dueDate?: string
  ): Promise<void> {
    try {
      const todosRef = ref(database, `users/${userId}/todos`);
      const newTodo = {
        text,
        completed: false,
        timestamp: Date.now(),
        order,
        category,
        ...(dueDate && { dueDate }),
      };
      
      await push(todosRef, newTodo);
    } catch (error) {
      console.error('Error adding todo:', error);
      throw error;
    }
  }

  static async updateTodo(userId: string, todoId: string, updates: Partial<Todo>): Promise<void> {
    try {
      const todoRef = ref(database, `users/${userId}/todos/${todoId}`);
      await update(todoRef, updates);
    } catch (error) {
      console.error('Error updating todo:', error);
      throw error;
    }
  }

  static async deleteTodo(userId: string, todoId: string): Promise<void> {
    try {
      const todoRef = ref(database, `users/${userId}/todos/${todoId}`);
      await remove(todoRef);
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw error;
    }
  }

  static async clearBlockedReferences(userId: string, todoId: string, blockedTasks: Todo[]): Promise<void> {
    try {
      const clearBlockedPromises = blockedTasks.map(async (child) => {
        const childRef = ref(database, `users/${userId}/todos/${child.id}`);
        await update(childRef, { blockedBy: null });
      });
      await Promise.all(clearBlockedPromises);
    } catch (error) {
      console.error('Error clearing blocked references:', error);
      throw error;
    }
  }

  static async updateMultipleTodos(userId: string, updates: Array<{ id: string; updates: Partial<Todo> }>): Promise<void> {
    try {
      const updatePromises = updates.map(async ({ id, updates: todoUpdates }) => {
        const todoRef = ref(database, `users/${userId}/todos/${id}`);
        await update(todoRef, todoUpdates);
      });
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating multiple todos:', error);
      throw error;
    }
  }

  static setupTodosListener(
    userId: string,
    onSnapshot: (snapshot: any) => void,
    onError: (error: any) => void
  ): () => void {
    try {
      const todosRef = ref(database, `users/${userId}/todos`);
      return onValue(todosRef, onSnapshot, onError);
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
      throw error;
    }
  }
} 