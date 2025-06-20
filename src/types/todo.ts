export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
  order: number;
  description?: string;
  category: 'today' | 'backlog' | 'postponed';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  blockedBy?: string; // ID of the task this task is blocked by
}

export type TodoCategory = 'today' | 'backlog' | 'postponed'; 