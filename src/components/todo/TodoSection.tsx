import React from 'react';
import { Box, Typography } from '@mui/material';
import { Droppable } from '@hello-pangea/dnd';
import { Todo, TodoCategory } from '../../types/todo';
import TodoItem from './TodoItem';

interface TodoSectionProps {
  category: TodoCategory;
  todos: Todo[];
  title: string;
  onToggleTodo: (todoId: string, completed: boolean) => void;
  onTodoClick: (todo: Todo) => void;
  animatingTaskIds?: Set<string>;
}

const TodoSection: React.FC<TodoSectionProps> = ({ 
  category, 
  todos, 
  title, 
  onToggleTodo, 
  onTodoClick,
  animatingTaskIds = new Set() 
}) => {
  const getEmptyStateMessage = () => {
    switch (category) {
      case 'today':
        return {
          dropMessage: "Drop here to work on today!",
          defaultMessage: "🎯 Drop a task from backlog to work on today",
          subMessage: "Drag tasks here to prioritize them for today"
        };
      case 'postponed':
        return {
          dropMessage: "Drop here for postponed tasks",
          defaultMessage: "📅 Tasks with future due dates appear here",
          subMessage: "Set a due date on tasks to automatically organize them"
        };
      case 'backlog':
        return {
          dropMessage: "Drop here for backlog",
          defaultMessage: "No tasks in the backlog.",
          subMessage: ""
        };
      default:
        return {
          dropMessage: `Drop here for ${category}`,
          defaultMessage: `No tasks in ${category}.`,
          subMessage: ""
        };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <Box sx={{ mb: title ? 2 : 1 }}>
      {title && (
        <Typography variant="overline" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      )}

      <Droppable droppableId={category}>
        {(provided, snapshot) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              minHeight: todos.length === 0 ? 60 : 'auto',
              backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              border: snapshot.isDraggingOver ? '2px dashed' : '2px solid transparent',
              borderColor: snapshot.isDraggingOver ? 'primary.main' : 'transparent',
              borderRadius: 1,
              transition: 'all 0.2s ease',
              p: snapshot.isDraggingOver ? 1 : 0,
            }}
          >
            {todos.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: category === 'today' || category === 'postponed' ? 60 : 50,
                backgroundColor: (category === 'today' || category === 'postponed') && !snapshot.isDraggingOver ? 'grey.50' : 'transparent',
                borderRadius: 1,
                border: (category === 'today' || category === 'postponed') && !snapshot.isDraggingOver ? '2px dashed' : 'none',
                borderColor: (category === 'today' || category === 'postponed') && !snapshot.isDraggingOver ? 'grey.300' : 'transparent',
              }}>
                <Typography 
                  variant="body2" 
                  color={snapshot.isDraggingOver ? "primary.main" : "text.secondary"}
                  fontWeight={snapshot.isDraggingOver ? 600 : 400}
                  sx={{ fontSize: '0.9rem' }}
                >
                  {snapshot.isDraggingOver 
                    ? emptyState.dropMessage
                    : emptyState.defaultMessage
                  }
                </Typography>
                {!snapshot.isDraggingOver && emptyState.subMessage && (
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                    {emptyState.subMessage}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ '& > *': { mb: 0.5 } }}>
                {todos.map((todo, index) => (
                  <TodoItem
                    key={todo.stableKey || todo.id}
                    todo={todo}
                    index={index}
                    onToggle={onToggleTodo}
                    onClick={onTodoClick}
                    isAnimating={animatingTaskIds.has(todo.id)}
                  />
                ))}
              </Box>
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

export default TodoSection; 