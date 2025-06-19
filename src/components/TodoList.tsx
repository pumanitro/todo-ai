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
  IconButton,
  Checkbox,
  Chip,
  Container,
  Tabs,
  Tab,
  Drawer,
  Divider,
} from '@mui/material';
import { Add, Delete, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { database } from '../firebase/config';
import { ref, push, onValue, remove, update } from 'firebase/database';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
}

type FilterType = 'all' | 'active' | 'completed';

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const todosRef = ref(database, 'todos');
    
    const unsubscribe = onValue(todosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const todoList: Todo[] = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          text: value.text,
          completed: value.completed || false,
          timestamp: value.timestamp,
        }));
        
        // Sort by timestamp (newest first)
        todoList.sort((a, b) => b.timestamp - a.timestamp);
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
  }, []);

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    try {
      const todosRef = ref(database, 'todos');
      await push(todosRef, {
        text: newTodo.trim(),
        completed: false,
        timestamp: Date.now(),
      });
      setNewTodo('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      const todoRef = ref(database, `todos/${todoId}`);
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
      const todoRef = ref(database, `todos/${todoId}`);
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

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.filter(todo => !todo.completed).length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Chip 
          label={isConnected ? 'Connected' : 'Connecting...'} 
          color={isConnected ? 'success' : 'warning'}
        />
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

          <Box sx={{ mb: 3 }}>
            <Tabs value={filter} onChange={(_, newValue) => setFilter(newValue)}>
              <Tab label={`All (${todos.length})`} value="all" />
              <Tab label={`Active (${activeCount})`} value="active" />
              <Tab label={`Completed (${completedCount})`} value="completed" />
            </Tabs>
          </Box>

          {filteredTodos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                {filter === 'all' ? 'No tasks yet. Add your first task above! 🎉' :
                 filter === 'active' ? 'No active tasks. Great job! 🎉' :
                 'No completed tasks yet. Keep going! 💪'}
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredTodos.map((todo) => (
                <ListItem 
                  key={todo.id} 
                  divider 
                  button
                  onClick={() => handleTodoClick(todo)}
                  sx={{ cursor: 'pointer' }}
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
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          opacity: todo.completed ? 0.6 : 1,
                        }}
                      >
                        {todo.text}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
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