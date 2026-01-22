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
}

export type TodoCategory = 'today' | 'backlog' | 'postponed'; 