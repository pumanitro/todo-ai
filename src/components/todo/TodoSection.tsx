import React from 'react';
import { Box, Typography, List } from '@mui/material';
import { Droppable } from '@hello-pangea/dnd';
import { Todo, TodoCategory } from '../../types/todo';
import TodoItem from './TodoItem';

interface TodoSectionProps {
  category: TodoCategory;
  todos: Todo[];
  title: string;
  onToggleTodo: (todoId: string, completed: boolean) => void;
  onTodoClick: (todo: Todo) => void;
}

const TodoSection: React.FC<TodoSectionProps> = ({ 
  category, 
  todos, 
  title, 
  onToggleTodo, 
  onTodoClick 
}) => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
        {title} ({todos.length})
      </Typography>

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
                height: category === 'today' ? 60 : 50,
                backgroundColor: category === 'today' && !snapshot.isDraggingOver ? 'grey.50' : 'transparent',
                borderRadius: 1,
                border: category === 'today' && !snapshot.isDraggingOver ? '2px dashed' : 'none',
                borderColor: category === 'today' && !snapshot.isDraggingOver ? 'grey.300' : 'transparent',
              }}>
                {category === 'today' ? (
                  <>
                    <Typography 
                      variant="body2" 
                      color={snapshot.isDraggingOver ? "primary.main" : "text.secondary"}
                      fontWeight={snapshot.isDraggingOver ? 600 : 400}
                      sx={{ fontSize: '0.9rem' }}
                    >
                      {snapshot.isDraggingOver 
                        ? "Drop here to work on today!" 
                        : "🎯 Drop a task from backlog to work on today"
                      }
                    </Typography>
                    {!snapshot.isDraggingOver && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                        Drag tasks here to prioritize them for today
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography color="text.secondary" variant="body2" sx={{ fontSize: '0.9rem' }}>
                    {snapshot.isDraggingOver 
                      ? `Drop here for ${category}` 
                      : "No tasks in the backlog."
                    }
                  </Typography>
                )}
              </Box>
            ) : (
              <Box sx={{ '& > *': { mb: 0.5 } }}>
                {todos.map((todo, index) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onToggle={onToggleTodo}
                    onClick={onTodoClick}
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