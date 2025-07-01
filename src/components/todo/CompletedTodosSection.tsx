import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { Todo } from '../../types/todo';
import TodoItem from './TodoItem';

interface CompletedTodosSectionProps {
  completedTodos: Todo[];
  onToggleTodo: (todoId: string, completed: boolean) => void;
  onTodoClick: (todo: Todo) => void;
  animatingTaskIds?: Set<string>;
  newTaskIds?: Set<string>;
  completingTaskIds?: Set<string>;
  migrationTaskIds?: Set<string>;
}

const CompletedTodosSection: React.FC<CompletedTodosSectionProps> = ({ 
  completedTodos, 
  onToggleTodo, 
  onTodoClick,
  animatingTaskIds = new Set(),
  newTaskIds = new Set(),
  completingTaskIds = new Set(),
  migrationTaskIds = new Set(),
}) => {
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  if (completedTodos.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          cursor: 'pointer',
          py: 0.5,
          ml: 2,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          borderRadius: 1,
        }}
        onClick={() => setShowCompleted(!showCompleted)}
      >
        <IconButton size="small">
          {showCompleted ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <Typography variant="overline" sx={{ flexGrow: 1, mb: 0, fontWeight: 600 }}>
          Completed ({completedTodos.length})
        </Typography>
      </Box>
      
      <Collapse in={showCompleted}>
        <Box sx={{ mt: 1, ml: 2, '& > *': { mb: 0.5 } }}>
          {completedTodos.map((todo, index) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              index={index}
              onToggle={onToggleTodo}
              onClick={onTodoClick}
              isDraggable={false}
              isAnimating={animatingTaskIds.has(todo.id)}
              isNewTask={newTaskIds.has(todo.id)}
              isCompletingTask={completingTaskIds.has(todo.id)}
              isMigratingTask={migrationTaskIds.has(todo.id)}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default CompletedTodosSection; 