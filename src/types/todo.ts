export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
  order: number;
  description?: string;
  category: 'today' | 'backlog' | 'postponed';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}

export type TodoCategory = 'today' | 'backlog' | 'postponed'; 