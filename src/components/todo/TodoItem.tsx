import React from 'react';
import { ListItem, ListItemText, Checkbox, Box, Typography, Chip } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, DragIndicator, Description, Event } from '@mui/icons-material';
import { Draggable } from '@hello-pangea/dnd';
import { Todo } from '../../types/todo';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (todoId: string, completed: boolean) => void;
  onClick: (todo: Todo) => void;
  isDraggable?: boolean;
  hideDueDate?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, index, onToggle, onClick, isDraggable = true, hideDueDate = false }) => {
  const getDueDateDisplay = (dueDate: string) => {
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diffDays = Math.ceil((due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    let color: 'error' | 'warning' | 'info' | 'default' = 'default';
    let label = due.toLocaleDateString();

    if (diffDays < 0) {
      color = 'error';
      label = `Overdue (${Math.abs(diffDays)}d)`;
    } else if (diffDays === 0) {
      color = 'warning';
      label = 'Today';
    } else if (diffDays === 1) {
      color = 'info';
      label = 'Tomorrow';
    } else if (diffDays <= 7) {
      color = 'info';
      label = `${diffDays}d`;
    }

    return { color, label };
  };

  const todoContent = (provided?: any, snapshot?: any) => (
    <Box sx={{ mb: 1 }}>
      <ListItem 
        ref={provided?.innerRef}
        {...(provided?.draggableProps || {})}
        {...(provided?.dragHandleProps || {})}
        button
        onClick={() => onClick(todo)}
        sx={{ 
          cursor: isDraggable ? (snapshot?.isDragging ? 'grabbing' : 'grab') : 'pointer',
          backgroundColor: snapshot?.isDragging ? 'action.hover' : 'transparent',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          display: 'flex',
          alignItems: 'center',
          py: 0.5,
          px: 1,
          minHeight: 'auto',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          mb: 0,
        }}
      >
        <Box 
          onClick={(e) => e.stopPropagation()}
          sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
        >
          <Checkbox
            checked={todo.completed}
            onChange={() => onToggle(todo.id, todo.completed)}
            icon={<RadioButtonUnchecked />}
            checkedIcon={<CheckCircle />}
            color="primary"
            size="small"
            sx={{ p: 0.5 }}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <Typography 
            variant="body2"
            sx={todo.completed ? { 
              textDecoration: 'line-through',
              opacity: 0.6,
            } : {}}
          >
            {todo.text}
          </Typography>
          {todo.dueDate && !hideDueDate && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Event fontSize="small" sx={{ color: 'text.disabled', fontSize: '14px' }} />
              <Chip
                label={getDueDateDisplay(todo.dueDate).label}
                color={getDueDateDisplay(todo.dueDate).color}
                size="small"
                variant="outlined"
                sx={{ 
                  height: '20px', 
                  fontSize: '0.7rem',
                  opacity: todo.completed ? 0.6 : 1,
                }}
              />
            </Box>
          )}
        </Box>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            ml: 'auto',
            color: 'text.disabled',
            gap: 0.5,
            opacity: todo.completed ? 0.6 : 1,
          }}
        >
          {todo.description && (
            <Description fontSize="small" />
          )}
          {!todo.completed && isDraggable && <DragIndicator fontSize="small" />}
        </Box>
      </ListItem>
    </Box>
  );

  if (!isDraggable) {
    return todoContent();
  }

  return (
    <Draggable draggableId={todo.id} index={index}>
      {(provided, snapshot) => todoContent(provided, snapshot)}
    </Draggable>
  );
};

export default TodoItem; 