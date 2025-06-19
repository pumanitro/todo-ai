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
    <ListItem 
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      divider 
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
      }}
    >
      <Box 
        onClick={(e) => e.stopPropagation()}
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <Checkbox
          checked={todo.completed}
          onChange={() => onToggle(todo.id, todo.completed)}
          icon={<RadioButtonUnchecked />}
          checkedIcon={<CheckCircle />}
          color="primary"
        />
      </Box>
      <ListItemText
        primary={
          <Typography 
            sx={todo.completed ? { 
              textDecoration: 'line-through',
              opacity: 0.6,
            } : {}}
          >
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
          opacity: todo.completed ? 0.6 : 1,
        }}
      >
        {todo.description && (
          <Description fontSize="small" />
        )}
        {!todo.completed && isDraggable && <DragIndicator />}
      </Box>
    </ListItem>
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