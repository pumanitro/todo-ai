import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Chip,
  Container,
  Drawer,
  Divider,
  Collapse,
  IconButton,
  Avatar,
} from '@mui/material';
import { Add, Delete, CheckCircle, RadioButtonUnchecked, DragIndicator, ExpandMore, ExpandLess, Logout } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { database, auth } from '../firebase/config';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { signOut, User } from 'firebase/auth';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
  order: number;
}

interface TodoListProps {
  user: User;
}

const TodoList: React.FC<TodoListProps> = ({ user }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  useEffect(() => {
    // Use user-specific path
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
        }));
        
        // Sort by order (lowest first), then by timestamp (newest first) for items without order
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

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      const todosRef = ref(database, `users/${user.uid}/todos`);
      // Get the highest order number and add 1 for the new todo
      const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order)) : -1;
      await push(todosRef, {
        text: newTodo.trim(),
        completed: false,
        timestamp: Date.now(),
        order: maxOrder + 1,
      });
      setNewTodo('');
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

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${todoId}`);
      await update(todoRef, { completed: !completed });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      addTodo();
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    try {
      // Create a new array with the reordered items (only active todos for drag/drop)
      const activeTodos = todos.filter(todo => !todo.completed);
      const reorderedTodos = Array.from(activeTodos);
      const [reorderedItem] = reorderedTodos.splice(sourceIndex, 1);
      reorderedTodos.splice(destinationIndex, 0, reorderedItem);

      // Update the order values for all affected active todos
      const updates: { [key: string]: any } = {};
      reorderedTodos.forEach((todo, index) => {
        updates[`users/${user.uid}/todos/${todo.id}/order`] = index;
      });

      // Update the database with the new order
      await update(ref(database), updates);
    } catch (error) {
      console.error('Error reordering todos:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const activeTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={user.photoURL || undefined} alt={user.displayName || 'User'} />
          <Typography variant="h6">
            Hello, {user.displayName?.split(' ')[0] || 'User'}!
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={isConnected ? 'Connected' : 'Connecting...'} 
            color={isConnected ? 'success' : 'warning'}
          />
          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Add New Task
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="What needs to be done?"
              variant="outlined"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a new task..."
            />
            <Button
              variant="contained"
              onClick={addTodo}
              disabled={!newTodo.trim()}
              startIcon={<Add />}
              sx={{ minWidth: 120 }}
            >
              Add Task
            </Button>
          </Box>

          <Typography variant="h6" gutterBottom>
            Active Tasks ({activeTodos.length})
          </Typography>

          {activeTodos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No active tasks. Great job! 🎉
              </Typography>
            </Box>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="todos">
                {(provided) => (
                  <List
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {activeTodos.map((todo, index) => (
                      <Draggable 
                        key={todo.id} 
                        draggableId={todo.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <ListItem 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            divider 
                            button
                            onClick={() => handleTodoClick(todo)}
                            sx={{ 
                              cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                              backgroundColor: snapshot.isDragging ? 'action.hover' : 'transparent',
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Box 
                              onClick={(e) => e.stopPropagation()}
                              sx={{ display: 'flex', alignItems: 'center' }}
                            >
                              <Checkbox
                                checked={todo.completed}
                                onChange={() => toggleTodo(todo.id, todo.completed)}
                                icon={<RadioButtonUnchecked />}
                                checkedIcon={<CheckCircle />}
                                color="primary"
                              />
                            </Box>
                            <ListItemText
                              primary={
                                <Typography>
                                  {todo.text}
                                </Typography>
                              }
                            />
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                ml: 1,
                                color: 'text.disabled',
                              }}
                            >
                              <DragIndicator />
                            </Box>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
          )}

          {completedTodos.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  py: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  borderRadius: 1,
                }}
                onClick={() => setShowCompleted(!showCompleted)}
              >
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Completed Tasks ({completedTodos.length})
                </Typography>
                <IconButton size="small">
                  {showCompleted ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              
              <Collapse in={showCompleted}>
                <List>
                  {completedTodos.map((todo) => (
                    <ListItem 
                      key={todo.id}
                      divider 
                      button
                      onClick={() => handleTodoClick(todo)}
                      sx={{ 
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        },
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box 
                        onClick={(e) => e.stopPropagation()}
                        sx={{ display: 'flex', alignItems: 'center' }}
                      >
                        <Checkbox
                          checked={todo.completed}
                          onChange={() => toggleTodo(todo.id, todo.completed)}
                          icon={<RadioButtonUnchecked />}
                          checkedIcon={<CheckCircle />}
                          color="primary"
                        />
                      </Box>
                      <ListItemText
                        primary={
                          <Typography 
                            sx={{ 
                              textDecoration: 'line-through',
                              opacity: 0.6,
                            }}
                          >
                            {todo.text}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Box>
          )}
        </CardContent>
      </Card>

      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            padding: 3,
          },
        }}
      >
        {selectedTodo && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Task Details
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body1" sx={{ mb: 2, wordBreak: 'break-word' }}>
              {selectedTodo.text}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Added: {new Date(selectedTodo.timestamp).toLocaleString()}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Status: {selectedTodo.completed ? 'Completed' : 'Active'}
            </Typography>

            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={() => deleteTodo(selectedTodo.id)}
              fullWidth
            >
              Remove Task
            </Button>
          </Box>
        )}
      </Drawer>
    </Container>
  );
};

export default TodoList; 