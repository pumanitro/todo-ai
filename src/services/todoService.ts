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
  ): Promise<string> {
    const todosRef = ref(database, `users/${userId}/todos`);
    const newTodo = {
      text,
      completed: false,
      timestamp: Date.now(),
      order,
      category,
      ...(dueDate && { dueDate }),
    };
    
    const newTodoRef = await push(todosRef, newTodo);
    return newTodoRef.key!;
  }

  static async updateTodo(userId: string, todoId: string, updates: Partial<Todo>): Promise<void> {
    const todoRef = ref(database, `users/${userId}/todos/${todoId}`);
    await update(todoRef, updates);
  }

  static async deleteTodo(userId: string, todoId: string): Promise<void> {
    const todoRef = ref(database, `users/${userId}/todos/${todoId}`);
    await remove(todoRef);
  }

  static async clearBlockedReferences(userId: string, todoId: string, blockedTasks: Todo[]): Promise<void> {
    const clearBlockedPromises = blockedTasks.map(async (child) => {
      const childRef = ref(database, `users/${userId}/todos/${child.id}`);
      await update(childRef, { blockedBy: null });
    });
    await Promise.all(clearBlockedPromises);
  }

  static async updateMultipleTodos(userId: string, updates: Array<{ id: string; updates: Partial<Todo> }>): Promise<void> {
    const updatePromises = updates.map(async ({ id, updates: todoUpdates }) => {
      const todoRef = ref(database, `users/${userId}/todos/${id}`);
      await update(todoRef, todoUpdates);
    });
    await Promise.all(updatePromises);
  }

  static setupTodosListener(
    userId: string,
    onSnapshot: (snapshot: any) => void,
    onError: (error: any) => void
  ): () => void {
    const todosRef = ref(database, `users/${userId}/todos`);
    return onValue(todosRef, onSnapshot, onError);
  }
}
