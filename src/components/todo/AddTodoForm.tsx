import React, { useState, useRef, useEffect } from 'react';
import { Typography, Box, TextField, Button, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Add, Event } from '@mui/icons-material';

interface AddTodoFormProps {
  onAddTodo: (text: string, dueDate?: string) => void;
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAddTodo }) => {
  const [newTodo, setNewTodo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [showDateInput, setShowDateInput] = useState<boolean>(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    // Hide the input if no date is selected (only on desktop)
    if (!dueDate && !isMobile) {
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

  // Auto-open calendar when date input appears (desktop only)
  useEffect(() => {
    if (showDateInput && dateInputRef.current && !isMobile) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      }, 100);
    }
  }, [showDateInput, isMobile]);

  // On mobile, always show date input; on desktop, use the toggle behavior
  const shouldShowDateInput = isMobile || showDateInput;

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1.5, 
        mb: 2 
      }}>
        {/* Text Input - Full width on mobile, takes remaining space on desktop */}
        <TextField
          fullWidth
          label="What needs to be done?"
          variant="outlined"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a new task..."
          size="small"
          sx={{ 
            width: { xs: '100%', sm: 'auto' },
            flex: { sm: 1 }
          }}
        />
        
        {/* Buttons Container - Separate row on mobile */}
        <Box sx={{ 
          display: 'flex', 
          gap: 1.5,
          justifyContent: { xs: 'flex-end', sm: 'flex-start' },
          width: { xs: '100%', sm: 'auto' }
        }}>
          {/* Date Input or Icon Button */}
          {shouldShowDateInput ? (
            <TextField
              ref={dateInputRef}
              type="date"
              variant="outlined"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                // If date is cleared, hide the input (only on desktop)
                if (!e.target.value && !isMobile) {
                  setShowDateInput(false);
                }
              }}
              onBlur={handleDateInputBlur}
              size="small"
              label={isMobile ? "Due Date" : undefined}
              sx={{ 
                width: { xs: 'auto', sm: 220 },
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
            sx={{ 
              minWidth: { xs: 'auto', sm: 100 }, 
              whiteSpace: 'nowrap',
              flex: { xs: 1, sm: 'none' }
            }}
            size="small"
          >
            Add Task
          </Button>
        </Box>
      </Box>
    </>
  );
};

export default AddTodoForm; 