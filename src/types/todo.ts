export type EisenhowerTag = 'do' | 'schedule' | 'delegate' | 'delete';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
  order: number;
  description?: string;
  category: 'today' | 'backlog' | 'postponed';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  blockedBy?: string | null; // ID of the task this task is blocked by
  completedAt?: number; // Timestamp when task was completed
  stableKey?: string; // Used for React key stability during optimistic updates (not persisted to Firebase)
  eisenhowerTag?: EisenhowerTag | null;
}

export type TodoCategory = 'today' | 'backlog' | 'postponed';

export const EISENHOWER_OPTIONS: { value: EisenhowerTag; label: string; description: string; color: string }[] = [
  { value: 'do', label: 'Do', description: 'Urgent & Important', color: '#2e7d32' },
  { value: 'schedule', label: 'Schedule', description: 'Important & Not Urgent', color: '#1976d2' },
  { value: 'delegate', label: 'Delegate', description: 'Not Important & Urgent', color: '#ff9800' },
  { value: 'delete', label: 'Delete', description: 'Not Urgent & Not Important', color: '#757575' },
]; 