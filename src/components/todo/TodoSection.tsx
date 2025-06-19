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
    <>
      <Typography variant="h6" gutterBottom>
        {title} ({todos.length})
      </Typography>

      <Droppable droppableId={category}>
        {(provided, snapshot) => (
          <Box
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{
              mb: 3,
              minHeight: todos.length === 0 ? 60 : 'auto',
              backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
              border: snapshot.isDraggingOver ? '2px dashed' : '2px solid transparent',
              borderColor: snapshot.isDraggingOver ? 'primary.main' : 'transparent',
              borderRadius: 1,
              transition: 'all 0.2s ease',
            }}
          >
            {todos.length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: category === 'today' ? 80 : 60,
                backgroundColor: category === 'today' && !snapshot.isDraggingOver ? 'grey.50' : 'transparent',
                borderRadius: 2,
                border: category === 'today' && !snapshot.isDraggingOver ? '2px dashed' : 'none',
                borderColor: category === 'today' && !snapshot.isDraggingOver ? 'grey.300' : 'transparent',
              }}>
                {category === 'today' ? (
                  <>
                    <Typography 
                      variant="body2" 
                      color={snapshot.isDraggingOver ? "primary.main" : "text.secondary"}
                      fontWeight={snapshot.isDraggingOver ? 600 : 400}
                      sx={{ mb: 0.5 }}
                    >
                      {snapshot.isDraggingOver 
                        ? "Drop here to work on today!" 
                        : "🎯 Drop a task from backlog to work on today"
                      }
                    </Typography>
                    {!snapshot.isDraggingOver && (
                      <Typography variant="caption" color="text.disabled">
                        Drag tasks here to prioritize them for today
                      </Typography>
                    )}
                  </>
                ) : (
                  <Typography color="text.secondary">
                    {snapshot.isDraggingOver 
                      ? `Drop here for ${category}` 
                      : "No tasks in the backlog."
                    }
                  </Typography>
                )}
              </Box>
            ) : (
              <List>
                {todos.map((todo, index) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    index={index}
                    onToggle={onToggleTodo}
                    onClick={onTodoClick}
                  />
                ))}
              </List>
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </>
  );
};

export default TodoSection; 