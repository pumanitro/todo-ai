import React from 'react';
import { ListItem, Checkbox, Box, Typography, Chip } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, DragIndicator, Description, Event } from '@mui/icons-material';
import { Draggable } from '@hello-pangea/dnd';
import { Todo } from '../../types/todo';
import { renderTextWithLinks } from '../../utils/linkUtils';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (todoId: string, completed: boolean) => void;
  onClick: (todo: Todo) => void;
  isDraggable?: boolean;
  hideDueDate?: boolean;
  isAnimating?: boolean;
  blockedChildren?: Todo[];
  isNewTask?: boolean;
  isCompletingTask?: boolean;
  isMigratingTask?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, index, onToggle, onClick, isDraggable = true, hideDueDate = false, isAnimating = false, blockedChildren = [], isNewTask = false, isCompletingTask = false, isMigratingTask = false }) => {
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

  // Simple CSS for shake animation
  const shakeAnimationStyles = {
    '@keyframes shakeX': {
      'from, to': {
        transform: 'translate3d(0, 0, 0)',
      },
      '10%, 30%, 50%, 70%, 90%': {
        transform: 'translate3d(-5px, 0, 0)',
      },
      '20%, 40%, 60%, 80%': {
        transform: 'translate3d(5px, 0, 0)',
      },
    },
  };

  const todoContent = (provided?: any, snapshot?: any) => (
    <Box sx={{ mb: 1, position: 'relative', ...shakeAnimationStyles }}>

      <ListItem 
        ref={provided?.innerRef}
        {...(provided?.draggableProps || {})}
        {...(provided?.dragHandleProps || {})}
        button
        onClick={() => onClick(todo)}
        className={`${isNewTask ? 'animate__animated animate__bounceIn' : ''} ${isCompletingTask ? 'animate__animated animate__backOutDown' : ''} ${isMigratingTask ? 'animate__animated animate__backOutUp' : ''}`}
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
          borderColor: isAnimating ? '#64b5f6' : 'divider',
          borderWidth: isAnimating ? '2px' : '1px',
          borderRadius: 1,
          mb: 0,
          
          // Simple shake animation styles
          ...(isAnimating && {
            animation: 'shakeX 0.8s ease-in-out',
          }),
        }}
      >
        <Box 
          onClick={(e) => e.stopPropagation()}
          sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
        >
          <Checkbox
            checked={todo.completed || isCompletingTask}
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
            sx={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              lineHeight: 1.3,
              ...(todo.completed || isCompletingTask ? { 
                textDecoration: 'line-through',
              } : {})
            }}
          >
            {renderTextWithLinks(todo.text)}
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
                }}
              />
            </Box>
          )}
        </Box>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            ml: 1,
            flexShrink: 0,
            color: 'text.disabled',
            gap: 0.5,
          }}
        >
          {todo.description && (
            <Description fontSize="small" />
          )}
          {!todo.completed && isDraggable && <DragIndicator fontSize="small" />}
        </Box>
      </ListItem>
      
      {/* Show blocked children during drag preview */}
      {snapshot?.isDragging && blockedChildren.length > 0 && (
        <Box sx={{ 
          mt: 0.5,
          pl: 2,
          borderLeft: '3px solid',
          borderLeftColor: 'primary.main',
          ml: 1
        }}>
          {blockedChildren.map((child, childIndex) => (
            <Box 
              key={child.id} 
              sx={{ 
                mb: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 0.25,
                px: 1,
                backgroundColor: 'primary.light',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'primary.main',
                opacity: 0.9
              }}
            >
              <Box sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: 'primary.main',
                flexShrink: 0
              }} />
              <Typography 
                variant="caption" 
                sx={{ 
                  fontSize: '0.75rem', 
                  color: 'primary.dark',
                  fontWeight: 500,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  lineHeight: 1.2,
                  flex: 1,
                  minWidth: 0
                }}
              >
                {renderTextWithLinks(child.text)}
              </Typography>
            </Box>
          ))}
          
          {/* Small indicator showing how many children will move */}
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem', 
              color: 'primary.main',
              fontStyle: 'italic',
              mt: 0.5,
              display: 'block'
            }}
          >
            + {blockedChildren.length} blocked task{blockedChildren.length > 1 ? 's' : ''} will move
          </Typography>
        </Box>
      )}
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