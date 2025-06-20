import React, { useState, useEffect } from 'react';
import { Card, CardContent, Container, Collapse, IconButton, Box, Typography, Alert, Snackbar } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { database } from '../firebase/config';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { User } from 'firebase/auth';
import { Todo } from '../types/todo';
import UserHeader from './todo/UserHeader';
import AddTodoForm from './todo/AddTodoForm';
import TodoSection from './todo/TodoSection';
import CompletedTodosSection from './todo/CompletedTodosSection';
import TodoDetailsDrawer from './todo/TodoDetailsDrawer';
import TodoItem from './todo/TodoItem';

interface TodoListProps {
  user: User;
}

const TodoList: React.FC<TodoListProps> = ({ user }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPostponedExpanded, setIsPostponedExpanded] = useState<boolean>(false);
  const [movedTasksNotification, setMovedTasksNotification] = useState<string>('');

  useEffect(() => {
    const todosRef = ref(database, `users/${user.uid}/todos`);
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const todoList: Todo[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          text: value.text,
          completed: value.completed || false,
          timestamp: value.timestamp,
          order: value.order || 0,
          description: value.description || '',
          category: value.category || 'today',
          dueDate: value.dueDate || undefined,
        }));
        
        todoList.sort((a, b) => {
          if (a.order === b.order) {
            return b.timestamp - a.timestamp;
          }
          return a.order - b.order;
        });

        // Check for postponed tasks that should be moved to today
        const tasksToMove = todoList.filter(todo => 
          !todo.completed && 
          todo.category === 'postponed' && 
          categorizeTodoByDueDate(todo.dueDate) === 'today'
        );

        if (tasksToMove.length > 0) {
          // Move tasks to today category
          const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
          const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;

          tasksToMove.forEach(async (task, index) => {
            const todoRef = ref(database, `users/${user.uid}/todos/${task.id}`);
            await update(todoRef, {
              category: 'today',
              order: minTodayOrder - 1 - index
            });
          });

          // Show notification
          const message = tasksToMove.length === 1 
            ? `1 task was moved from Postponed to Today because it's due today`
            : `${tasksToMove.length} tasks were moved from Postponed to Today because they're due today`;
          setMovedTasksNotification(message);
        }

        setTodos(todoList);
        setIsConnected(true);
      } else {
        setTodos([]);
        setIsConnected(true);
      }
    }, (error) => {
      console.error('Firebase error:', error);
      setIsConnected(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const categorizeTodoByDueDate = (dueDate?: string): 'today' | 'backlog' | 'postponed' => {
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

  const addTodo = async (text: string, dueDate?: string) => {
    try {
      const todosRef = ref(database, `users/${user.uid}/todos`);
      const category = categorizeTodoByDueDate(dueDate);
      
      const todosInCategory = todos.filter(t => t.category === category && !t.completed);
      const minOrder = todosInCategory.length > 0 ? Math.min(...todosInCategory.map(t => t.order)) : 0;
      
      const newTodo = {
        text,
        completed: false,
        timestamp: Date.now(),
        order: minOrder - 1,
        category,
        ...(dueDate && { dueDate }),
      };
      
      await push(todosRef, newTodo);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${todoId}`);
      await remove(todoRef);
      setIsDrawerOpen(false);
      setSelectedTodo(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTodo(null);
  };

  const handleSaveEdit = async (field: 'text' | 'description' | 'dueDate', value: string) => {
    if (!selectedTodo) return;

    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${selectedTodo.id}`);
      
      let updates: any = {
        [field]: value.trim(),
      };

      // If updating due date, recategorize the todo
      if (field === 'dueDate') {
        const newCategory = categorizeTodoByDueDate(value || undefined);
        if (newCategory !== selectedTodo.category) {
          const todosInNewCategory = todos.filter(t => 
            t.category === newCategory && !t.completed && t.id !== selectedTodo.id
          );
          const minOrder = todosInNewCategory.length > 0 ? 
            Math.min(...todosInNewCategory.map(t => t.order)) : 0;
          
          updates.category = newCategory;
          updates.order = minOrder - 1;
        }
        
        // Clear dueDate if empty
        if (!value.trim()) {
          updates.dueDate = null;
        }
      }
      
      await update(todoRef, updates);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${todoId}`);
      const newCompletedStatus = !completed;
      const currentTodo = todos.find(todo => todo.id === todoId);
      if (!currentTodo) return;
      
      let newOrder;
      let newCategory: 'today' | 'backlog' | 'postponed';
      
      if (newCompletedStatus) {
        // Completing a task - move to completed section
        const completedTodos = todos.filter(todo => todo.completed);
        const minCompletedOrder = completedTodos.length > 0 ? Math.min(...completedTodos.map(t => t.order)) : 0;
        newOrder = minCompletedOrder - 1;
        newCategory = currentTodo.category; // Keep current category
      } else {
        // Uncompleting a task - recategorize based on due date
        newCategory = categorizeTodoByDueDate(currentTodo.dueDate);
        const todosInNewCategory = todos.filter(todo => !todo.completed && todo.category === newCategory);
        const minCategoryOrder = todosInNewCategory.length > 0 ? Math.min(...todosInNewCategory.map(t => t.order)) : 0;
        newOrder = minCategoryOrder - 1;
      }
      
      await update(todoRef, { 
        completed: newCompletedStatus,
        order: newOrder,
        category: newCategory
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceDroppableId = result.source.droppableId;
    const destinationDroppableId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceDroppableId === destinationDroppableId && sourceIndex === destinationIndex) return;

    try {
      const draggedTodoId = result.draggableId;
      const draggedTodo = todos.find(todo => todo.id === draggedTodoId);
      if (!draggedTodo) return;

      const newCategory = destinationDroppableId as 'today' | 'backlog' | 'postponed';
      
      const destinationTodos = todos.filter(todo => 
        !todo.completed && todo.category === newCategory
      );

      let newOrder;
      if (destinationTodos.length === 0) {
        newOrder = 0;
      } else if (destinationIndex === 0) {
        newOrder = Math.min(...destinationTodos.map(t => t.order)) - 1;
      } else if (destinationIndex >= destinationTodos.length) {
        newOrder = Math.max(...destinationTodos.map(t => t.order)) + 1;
      } else {
        const prevOrder = destinationTodos[destinationIndex - 1]?.order || 0;
        const nextOrder = destinationTodos[destinationIndex]?.order || 0;
        newOrder = (prevOrder + nextOrder) / 2;
      }

      const todoRef = ref(database, `users/${user.uid}/todos/${draggedTodoId}`);
      await update(todoRef, {
        category: newCategory,
        order: newOrder
      });

    } catch (error) {
      console.error('Error reordering todos:', error);
    }
  };

  const todayTodos = todos.filter(todo => !todo.completed && todo.category === 'today');
  const postponedTodos = todos.filter(todo => !todo.completed && todo.category === 'postponed');
  const backlogTodos = todos.filter(todo => !todo.completed && todo.category === 'backlog');
  const completedTodos = todos.filter(todo => todo.completed);

  // Group postponed todos by date
  const groupPostponedTodosByDate = () => {
    const grouped: { [date: string]: Todo[] } = {};
    
    postponedTodos.forEach(todo => {
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
      todos: grouped[date],
      displayDate: date === 'No Date' ? 'No Date' : formatDateGroupTitle(date)
    }));
  };

  const formatDateGroupTitle = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dateString = date.toDateString();
    const todayString = today.toDateString();
    const tomorrowString = tomorrow.toDateString();
    
    if (dateString === todayString) {
      return 'Today';
    } else if (dateString === tomorrowString) {
      return 'Tomorrow';
    } else {
      // Show day of week and date
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const postponedGroups = groupPostponedTodosByDate();

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <UserHeader user={user} isConnected={isConnected} />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <AddTodoForm onAddTodo={addTodo} />

          <DragDropContext onDragEnd={handleDragEnd}>
            <TodoSection
              category="today"
              todos={todayTodos}
              title="Today"
              onToggleTodo={toggleTodo}
              onTodoClick={handleTodoClick}
            />

            <TodoSection
              category="backlog"
              todos={backlogTodos}
              title="Backlog"
              onToggleTodo={toggleTodo}
              onTodoClick={handleTodoClick}
            />
          </DragDropContext>

          {/* Postponed Section - Collapsible */}
          {postponedTodos.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  py: 0.5,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  borderRadius: 1,
                }}
                onClick={() => setIsPostponedExpanded(!isPostponedExpanded)}
              >
                <Typography variant="h6" sx={{ flexGrow: 1, mb: 0, fontWeight: 600 }}>
                  Postponed Tasks ({postponedTodos.length})
                </Typography>
                <IconButton size="small">
                  {isPostponedExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
                              <Collapse in={isPostponedExpanded}>
                <Box sx={{ mt: 1 }}>
                  {postponedGroups.map((group, groupIndex) => (
                    <Box key={groupIndex} sx={{ mb: groupIndex < postponedGroups.length - 1 ? 2.5 : 0 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1,
                          fontSize: '0.95rem'
                        }}
                      >
                        {group.displayDate} ({group.todos.length})
                      </Typography>
                      <Box sx={{ '& > *': { mb: 0.5 } }}>
                        {group.todos.map((todo, todoIndex) => (
                          <TodoItem
                            key={todo.id}
                            todo={todo}
                            index={todoIndex}
                            onToggle={toggleTodo}
                            onClick={handleTodoClick}
                            isDraggable={false}
                            hideDueDate={true}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}

          <CompletedTodosSection
            completedTodos={completedTodos}
            onToggleTodo={toggleTodo}
            onTodoClick={handleTodoClick}
          />
        </CardContent>
      </Card>

      <TodoDetailsDrawer
        isOpen={isDrawerOpen}
        todo={selectedTodo}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEdit}
        onDelete={deleteTodo}
      />

      <Snackbar
        open={!!movedTasksNotification}
        autoHideDuration={6000}
        onClose={() => setMovedTasksNotification('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setMovedTasksNotification('')} 
          severity="info" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {movedTasksNotification}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TodoList; 