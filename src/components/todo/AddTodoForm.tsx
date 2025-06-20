import React, { useState, useRef, useEffect } from 'react';
import { Typography, Box, TextField, Button, IconButton } from '@mui/material';
import { Add, Event } from '@mui/icons-material';

interface AddTodoFormProps {
  onAddTodo: (text: string, dueDate?: string) => void;
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAddTodo }) => {
  const [newTodo, setNewTodo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [showDateInput, setShowDateInput] = useState<boolean>(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (newTodo.trim()) {
      onAddTodo(newTodo.trim(), dueDate || undefined);
      setNewTodo('');
      setDueDate('');
      setShowDateInput(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleDateIconClick = () => {
    setShowDateInput(true);
  };



  const handleDateInputBlur = () => {
    // Hide the input if no date is selected
    if (!dueDate) {
      setShowDateInput(false);
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Auto-open calendar when date input appears
  useEffect(() => {
    if (showDateInput && dateInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      }, 100);
    }
  }, [showDateInput]);

  return (
    <>
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
        
        {/* Date Input or Icon Button */}
        {showDateInput ? (
          <TextField
            ref={dateInputRef}
            type="date"
            variant="outlined"
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.target.value);
              // If date is cleared, hide the input
              if (!e.target.value) {
                setShowDateInput(false);
              }
            }}
            onBlur={handleDateInputBlur}
            size="small"
            sx={{ 
              width: 220,
              '& .MuiInputBase-input': {
                cursor: 'pointer'
              }
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        ) : (
          <IconButton
            onClick={handleDateIconClick}
            size="small"
            sx={{ 
              border: '1px solid',
              borderColor: dueDate ? 'primary.main' : 'divider',
              borderRadius: 1,
              backgroundColor: dueDate ? 'primary.50' : 'transparent',
              color: dueDate ? 'primary.main' : 'text.secondary',
              minWidth: 40,
              height: 40,
              position: 'relative',
              '&:hover': {
                backgroundColor: dueDate ? 'primary.100' : 'action.hover',
              }
            }}
          >
            <Event fontSize="small" />
            {dueDate && (
              <Typography 
                variant="caption" 
                sx={{ 
                  position: 'absolute',
                  bottom: -2,
                  fontSize: '8px',
                  lineHeight: 1,
                  color: 'primary.main',
                  fontWeight: 600
                }}
              >
                {formatDateDisplay(dueDate)}
              </Typography>
            )}
          </IconButton>
        )}



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