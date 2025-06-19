import React, { useState, useEffect } from 'react';
import { Card, CardContent, Container } from '@mui/material';
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

interface TodoListProps {
  user: User;
}

const TodoList: React.FC<TodoListProps> = ({ user }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

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
        }));
        
        todoList.sort((a, b) => {
          if (a.order === b.order) {
            return b.timestamp - a.timestamp;
          }
          return a.order - b.order;
        });
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

  const addTodo = async (text: string) => {
    try {
      const todosRef = ref(database, `users/${user.uid}/todos`);
      const backlogTodos = todos.filter(t => t.category === 'backlog' && !t.completed);
      const minOrder = backlogTodos.length > 0 ? Math.min(...backlogTodos.map(t => t.order)) : 0;
      await push(todosRef, {
        text,
        completed: false,
        timestamp: Date.now(),
        order: minOrder - 1,
        category: 'backlog',
      });
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

  const handleSaveEdit = async (field: 'text' | 'description', value: string) => {
    if (!selectedTodo) return;

    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${selectedTodo.id}`);
      await update(todoRef, {
        [field]: value.trim(),
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${todoId}`);
      const newCompletedStatus = !completed;
      
      let newOrder;
      if (newCompletedStatus) {
        const completedTodos = todos.filter(todo => todo.completed);
        const minCompletedOrder = completedTodos.length > 0 ? Math.min(...completedTodos.map(t => t.order)) : 0;
        newOrder = minCompletedOrder - 1;
      } else {
        const todayTodos = todos.filter(todo => !todo.completed && todo.category === 'today');
        const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;
        newOrder = minTodayOrder - 1;
      }
      
      await update(todoRef, { 
        completed: newCompletedStatus,
        order: newOrder,
        category: newCompletedStatus ? 'today' : 'today'
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

      const newCategory = destinationDroppableId as 'today' | 'backlog';
      
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
  const backlogTodos = todos.filter(todo => !todo.completed && todo.category === 'backlog');
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <UserHeader user={user} isConnected={isConnected} />

      <Card sx={{ mb: 4 }}>
        <CardContent>
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
    </Container>
  );
};

export default TodoList; 