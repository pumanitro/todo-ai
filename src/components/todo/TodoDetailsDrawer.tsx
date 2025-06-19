import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, Divider, TextField, Button } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Todo } from '../../types/todo';

interface TodoDetailsDrawerProps {
  isOpen: boolean;
  todo: Todo | null;
  onClose: () => void;
  onSaveEdit: (field: 'text' | 'description', value: string) => void;
  onDelete: (todoId: string) => void;
}

const TodoDetailsDrawer: React.FC<TodoDetailsDrawerProps> = ({ 
  isOpen, 
  todo, 
  onClose, 
  onSaveEdit, 
  onDelete 
}) => {
  const [editedName, setEditedName] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');

  useEffect(() => {
    if (todo) {
      setEditedName(todo.text);
      setEditedDescription(todo.description || '');
    }
  }, [todo]);

  const handleClose = () => {
    onClose();
    setEditedName('');
    setEditedDescription('');
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 300,
          padding: 3,
        },
      }}
    >
      {todo && (
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
              onBlur={() => onSaveEdit('text', editedName)}
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
              onBlur={() => onSaveEdit('description', editedDescription)}
              placeholder="Add a description for this task..."
              sx={{ mb: 2 }}
            />
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Added: {new Date(todo.timestamp).toLocaleString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Status: {todo.completed ? 'Completed' : 'Active'}
          </Typography>

          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(todo.id)}
            fullWidth
          >
            Remove Task
          </Button>
        </Box>
      )}
    </Drawer>
  );
};

export default TodoDetailsDrawer; 