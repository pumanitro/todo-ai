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
import { Add, Delete, CheckCircle, RadioButtonUnchecked, DragIndicator, ExpandMore, ExpandLess, Logout, Description } from '@mui/icons-material';
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
  description?: string;
  category: 'today' | 'backlog';
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
  const [editedName, setEditedName] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');

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
          description: value.description || '',
          category: value.category || 'today', // Default to 'today' for existing tasks
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
      // Get the lowest order number for 'today' category and subtract 1 to put new todo at the top
      const todayTodos = todos.filter(t => t.category === 'today' && !t.completed);
      const minOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;
      await push(todosRef, {
        text: newTodo.trim(),
        completed: false,
        timestamp: Date.now(),
        order: minOrder - 1,
        category: 'today', // New tasks default to 'today'
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
    setEditedName(todo.text);
    setEditedDescription(todo.description || '');
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTodo(null);
    setEditedName('');
    setEditedDescription('');
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
      
      // Calculate new order to put the task at the top of its new list
      let newOrder;
      if (newCompletedStatus) {
        // Task is being completed - put at top of completed list
        const completedTodos = todos.filter(todo => todo.completed);
        const minCompletedOrder = completedTodos.length > 0 ? Math.min(...completedTodos.map(t => t.order)) : 0;
        newOrder = minCompletedOrder - 1;
      } else {
        // Task is being uncompleted - put at top of today list
        const todayTodos = todos.filter(todo => !todo.completed && todo.category === 'today');
        const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;
        newOrder = minTodayOrder - 1;
      }
      
      await update(todoRef, { 
        completed: newCompletedStatus,
        order: newOrder,
        category: newCompletedStatus ? 'today' : 'today' // Keep category, just change completion status
      });
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

    const sourceDroppableId = result.source.droppableId;
    const destinationDroppableId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    // If dropped in the same position, do nothing
    if (sourceDroppableId === destinationDroppableId && sourceIndex === destinationIndex) return;

    try {
      const draggedTodoId = result.draggableId;
      const draggedTodo = todos.find(todo => todo.id === draggedTodoId);
      if (!draggedTodo) return;

      // Determine the new category
      const newCategory = destinationDroppableId as 'today' | 'backlog';
      
      // Get the todos in the destination list
      const destinationTodos = todos.filter(todo => 
        !todo.completed && todo.category === newCategory
      );

      // Calculate the new order
      let newOrder;
      if (destinationTodos.length === 0) {
        newOrder = 0;
      } else if (destinationIndex === 0) {
        // Moving to the top
        newOrder = Math.min(...destinationTodos.map(t => t.order)) - 1;
      } else if (destinationIndex >= destinationTodos.length) {
        // Moving to the bottom
        newOrder = Math.max(...destinationTodos.map(t => t.order)) + 1;
      } else {
        // Moving to the middle
        const prevOrder = destinationTodos[destinationIndex - 1]?.order || 0;
        const nextOrder = destinationTodos[destinationIndex]?.order || 0;
        newOrder = (prevOrder + nextOrder) / 2;
      }

      // Update the dragged todo
      const todoRef = ref(database, `users/${user.uid}/todos/${draggedTodoId}`);
      await update(todoRef, {
        category: newCategory,
        order: newOrder
      });

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

  const todayTodos = todos.filter(todo => !todo.completed && todo.category === 'today');
  const backlogTodos = todos.filter(todo => !todo.completed && todo.category === 'backlog');
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

          <DragDropContext onDragEnd={handleDragEnd}>
            <Typography variant="h6" gutterBottom>
              Today ({todayTodos.length})
            </Typography>

            <Droppable droppableId="today">
              {(provided, snapshot) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    mb: 3,
                    minHeight: todayTodos.length === 0 ? 60 : 'auto',
                    backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                    border: snapshot.isDraggingOver ? '2px dashed' : '2px solid transparent',
                    borderColor: snapshot.isDraggingOver ? 'primary.main' : 'transparent',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {todayTodos.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 60,
                    }}>
                      <Typography color="text.secondary">
                        {snapshot.isDraggingOver ? 'Drop here for today' : 'No tasks for today.'}
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {todayTodos.map((todo, index) => (
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
                                  gap: 0.5,
                                }}
                              >
                                {todo.description && (
                                  <Description fontSize="small" />
                                )}
                                <DragIndicator />
                              </Box>
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                    </List>
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>

            <Typography variant="h6" gutterBottom>
              Backlog ({backlogTodos.length})
            </Typography>

            <Droppable droppableId="backlog">
              {(provided, snapshot) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{
                    mb: 3,
                    minHeight: backlogTodos.length === 0 ? 60 : 'auto',
                    backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                    border: snapshot.isDraggingOver ? '2px dashed' : '2px solid transparent',
                    borderColor: snapshot.isDraggingOver ? 'primary.main' : 'transparent',
                    borderRadius: 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {backlogTodos.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 60,
                    }}>
                      <Typography color="text.secondary">
                        {snapshot.isDraggingOver ? 'Drop here for backlog' : 'No tasks in the backlog.'}
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {backlogTodos.map((todo, index) => (
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
                                  gap: 0.5,
                                }}
                              >
                                {todo.description && (
                                  <Description fontSize="small" />
                                )}
                                <DragIndicator />
                              </Box>
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                    </List>
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

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
                      {todo.description && (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            ml: 1,
                            color: 'text.disabled',
                            opacity: 0.6,
                          }}
                        >
                          <Description fontSize="small" />
                        </Box>
                      )}
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
            
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Task Name"
                variant="outlined"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={() => handleSaveEdit('text', editedName)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                multiline
                rows={4}
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                onBlur={() => handleSaveEdit('description', editedDescription)}
                placeholder="Add a description for this task..."
                sx={{ mb: 2 }}
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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