import { Todo } from '../types/todo';

export const categorizeTodoByDueDate = (dueDate?: string): 'today' | 'backlog' | 'postponed' => {
  if (!dueDate) return 'backlog';
  
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(dueDate);
  const todayDate = new Date(today);
  const diffDays = Math.ceil((due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'today'; // Due today or overdue
  } else {
    return 'postponed'; // Due in the future
  }
};

export const transformFirebaseDataToTodos = (data: any): Todo[] => {
  if (!data) return [];
  
  const todoList: Todo[] = Object.entries(data).map(([id, value]: [string, any]) => ({
    id,
    text: value.text,
    completed: value.completed || false,
    timestamp: value.timestamp,
    order: value.order || 0,
    description: value.description || '',
    category: value.category || 'today',
    dueDate: value.dueDate || undefined,
    blockedBy: value.blockedBy || undefined,
  }));
  
  // Sort by order (primary) and timestamp (secondary)
  return todoList.sort((a, b) => {
    if (a.order === b.order) {
      return b.timestamp - a.timestamp;
    }
    return a.order - b.order;
  });
};

export const findTasksToMoveToToday = (todoList: Todo[]): Todo[] => {
  return todoList.filter(todo => 
    !todo.completed && 
    todo.category === 'postponed' && 
    categorizeTodoByDueDate(todo.dueDate) === 'today'
  );
};

export const calculateNewOrder = (
  todos: Todo[],
  category: 'today' | 'backlog' | 'postponed',
  position: 'top' | 'bottom' = 'top'
): number => {
  const todosInCategory = todos.filter(t => t.category === category && !t.completed);
  
  if (todosInCategory.length === 0) return 0;
  
  if (position === 'top') {
    return Math.min(...todosInCategory.map(t => t.order)) - 1;
  } else {
    return Math.max(...todosInCategory.map(t => t.order)) + 1;
  }
};

export const getMinOrderInCategory = (todos: Todo[], category: 'today' | 'backlog' | 'postponed'): number => {
  const todosInCategory = todos.filter(t => t.category === category && !t.completed);
  return todosInCategory.length > 0 ? Math.min(...todosInCategory.map(t => t.order)) : 0;
};

export const getMinCompletedOrder = (todos: Todo[]): number => {
  const completedTodos = todos.filter(todo => todo.completed);
  return completedTodos.length > 0 ? Math.min(...completedTodos.map(t => t.order)) : 0;
};

export const organizeTaskHierarchy = (todos: Todo[], category: 'today' | 'backlog' | 'postponed') => {
  const categoryTodos = todos.filter(todo => !todo.completed && todo.category === category);
  const parentTasks = categoryTodos.filter(todo => !todo.blockedBy);
  
  const hierarchies: Array<{ parent: Todo; children: Todo[] }> = [];
  const standalone: Todo[] = [];
  
  parentTasks.forEach(parent => {
    // Find children that are blocked by this parent (regardless of their category)
    const children = todos.filter(child => 
      child.blockedBy === parent.id && 
      !child.completed
    );
    
    if (children.length > 0) {
      hierarchies.push({
        parent,
        children: children.sort((a, b) => {
          if (a.order === b.order) {
            return b.timestamp - a.timestamp;
          }
          return a.order - b.order;
        })
      });
    } else {
      standalone.push(parent);
    }
  });
  
  return { hierarchies, standalone };
};

export const groupPostponedTodosByDate = (postponedTodos: Todo[], formatDateGroupTitle: (date: string) => string) => {
  // Only group parent tasks (non-blocked tasks) from postponed category
  const postponedParentTasks = postponedTodos.filter(todo => !todo.blockedBy);
  const grouped: { [date: string]: Todo[] } = {};
  
  postponedParentTasks.forEach(todo => {
    const date = todo.dueDate || 'No Date';
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(todo);
  });

  // Sort each group by order and timestamp
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => {
      if (a.order === b.order) {
        return b.timestamp - a.timestamp;
      }
      return a.order - b.order;
    });
  });

  // Sort dates (nearest first, then future dates)
  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'No Date') return 1; // 'No Date' goes last
    if (b === 'No Date') return -1;
    return new Date(a).getTime() - new Date(b).getTime();
  });

  return sortedDates.map(date => ({
    date,
    parentTasks: grouped[date],
    displayDate: date === 'No Date' ? 'No Date' : formatDateGroupTitle(date)
  }));
};

export const calculateDragOrder = (
  todos: Todo[],
  category: 'today' | 'backlog' | 'postponed',
  destinationIndex: number,
  draggedTodoId: string
): number => {
  // Get destination todos in the same order as they appear in the UI
  const categoryTodos = todos.filter(todo => 
    !todo.completed && todo.category === category && !todo.blockedBy && todo.id !== draggedTodoId
  );
  
  // Sort them the same way as in NestedTodoSection (by order, then timestamp)
  const destinationTodos = categoryTodos.sort((a, b) => {
    if (a.order === b.order) {
      return b.timestamp - a.timestamp;
    }
    return a.order - b.order;
  });

  if (destinationTodos.length === 0) {
    return 0;
  } else if (destinationIndex === 0) {
    return Math.min(...destinationTodos.map(t => t.order)) - 1;
  } else if (destinationIndex >= destinationTodos.length) {
    return Math.max(...destinationTodos.map(t => t.order)) + 1;
  } else {
    const prevOrder = destinationTodos[destinationIndex - 1]?.order || 0;
    const nextOrder = destinationTodos[destinationIndex]?.order || 0;
    return (prevOrder + nextOrder) / 2;
  }
}; 