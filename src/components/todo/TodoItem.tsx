import React from 'react';
import { ListItem, ListItemText, Checkbox, Box, Typography } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, DragIndicator, Description } from '@mui/icons-material';
import { Draggable } from '@hello-pangea/dnd';
import { Todo } from '../../types/todo';

interface TodoItemProps {
  todo: Todo;
  index: number;
  onToggle: (todoId: string, completed: boolean) => void;
  onClick: (todo: Todo) => void;
  isDraggable?: boolean;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, index, onToggle, onClick, isDraggable = true }) => {
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
        <ListItemText
          primary={
            <Typography 
              variant="body2"
              sx={todo.completed ? { 
                textDecoration: 'line-through',
                opacity: 0.6,
              } : {}}
            >
              {todo.text}
            </Typography>
          }
          sx={{ m: 0 }}
        />
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