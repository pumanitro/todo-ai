import React, { useState } from 'react';
import { Typography, Box, TextField, Button } from '@mui/material';
import { Add } from '@mui/icons-material';

interface AddTodoFormProps {
  onAddTodo: (text: string) => void;
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAddTodo }) => {
  const [newTodo, setNewTodo] = useState<string>('');

  const handleSubmit = () => {
    if (newTodo.trim()) {
      onAddTodo(newTodo.trim());
      setNewTodo('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        Add New Task
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <TextField
          fullWidth
          label="What needs to be done?"
          variant="outlined"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a new task..."
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!newTodo.trim()}
          startIcon={<Add />}
          sx={{ minWidth: 100, whiteSpace: 'nowrap' }}
          size="small"
        >
          Add Task
        </Button>
      </Box>
    </>
  );
};

export default AddTodoForm; 