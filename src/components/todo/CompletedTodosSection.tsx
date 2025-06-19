import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse, List } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Todo } from '../../types/todo';
import TodoItem from './TodoItem';

interface CompletedTodosSectionProps {
  completedTodos: Todo[];
  onToggleTodo: (todoId: string, completed: boolean) => void;
  onTodoClick: (todo: Todo) => void;
}

const CompletedTodosSection: React.FC<CompletedTodosSectionProps> = ({ 
  completedTodos, 
  onToggleTodo, 
  onTodoClick 
}) => {
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  if (completedTodos.length === 0) {
    return null;
  }

  return (
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
          {completedTodos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggle={onToggleTodo}
              onClick={onTodoClick}
              isDraggable={false}
            />
          ))}
        </List>
      </Collapse>
    </Box>
  );
};

export default CompletedTodosSection; 