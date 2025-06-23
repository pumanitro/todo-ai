import React from 'react';
import { Box, Typography } from '@mui/material';
import { Droppable } from '@hello-pangea/dnd';
import { Todo, TodoCategory } from '../../types/todo';
import TodoItem from './TodoItem';

interface NestedTodoSectionProps {
  category: TodoCategory;
  todos: Todo[];
  title: string;
  onToggleTodo: (todoId: string, completed: boolean) => void;
  onTodoClick: (todo: Todo) => void;
  animatingTaskIds?: Set<string>;
  shouldHighlightDrop?: boolean;
  newTaskIds?: Set<string>;
  completingTaskIds?: Set<string>;
}

interface TodoHierarchy {
  parent: Todo;
  children: Todo[];
}

const NestedTodoSection: React.FC<NestedTodoSectionProps> = ({ 
  category, 
  todos, 
  title, 
  onToggleTodo, 
  onTodoClick,
  animatingTaskIds = new Set(),
  shouldHighlightDrop = false,
  newTaskIds = new Set(),
  completingTaskIds = new Set(),
}) => {
  // Organize todos into hierarchical structure
  const organizeTodosHierarchy = (): { hierarchies: TodoHierarchy[]; standalone: Todo[] } => {
    const parentTasks = todos.filter(t => !t.blockedBy);
    const blockedTasks = todos.filter(t => t.blockedBy);
    
    // Sort parent tasks by order (same logic as in TodoList transformFirebaseDataToTodos)
    parentTasks.sort((a, b) => {
      if (a.order === b.order) {
        return b.timestamp - a.timestamp;
      }
      return a.order - b.order;
    });
    
    const hierarchies: TodoHierarchy[] = [];
    const standalone: Todo[] = [];
    
    parentTasks.forEach(parent => {
      const children = blockedTasks.filter(child => child.blockedBy === parent.id);
      
      if (children.length > 0) {
        hierarchies.push({
          parent,
          children: children.sort((a, b) => {
            if (a.order === b.order) {
              return b.timestamp - a.timestamp;
            }
            return a.order - b.order;
          })
        });
      } else {
        standalone.push(parent);
      }
    });
    
    return { hierarchies, standalone };
  };

  const { hierarchies, standalone } = organizeTodosHierarchy();
  
  // Create a unified list of all parent tasks and sort by order (not by type)
  const allParentTasks = [...standalone, ...hierarchies.map(h => h.parent)];
  allParentTasks.sort((a, b) => {
    if (a.order === b.order) {
      return b.timestamp - a.timestamp;
    }
    return a.order - b.order;
  });
  
  const allDisplayTodos = allParentTasks;

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

  const renderTodoWithChildren = (todo: Todo, dragIndex: number, children?: Todo[]) => (
    <React.Fragment key={todo.id}>
      {/* Parent Task - standalone in its own Box */}
      <Box sx={{ mb: 0.5 }}>
        <TodoItem
          todo={todo}
          index={dragIndex}
          onToggle={onToggleTodo}
          onClick={onTodoClick}
          isDraggable={true}
          isAnimating={animatingTaskIds.has(todo.id)}
          isNewTask={newTaskIds.has(todo.id)}
          isCompletingTask={completingTaskIds.has(todo.id)}
          blockedChildren={children || []}
        />
      </Box>
      
      {/* Nested Children - rendered separately to not interfere with parent drag */}
      {children && children.length > 0 && (
        <Box sx={{ ml: 3, mt: -0.5, mb: 0.5, position: 'relative' }}>
          {/* Visual connector line */}
          <Box 
            sx={{ 
              position: 'absolute',
              left: -12,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: 'divider',
              opacity: 0.5
            }} 
          />
          
          {children.map((child, childIndex) => (
            <Box key={child.id} sx={{ mb: 0.5, position: 'relative' }}>
              {/* Horizontal connector line */}
              <Box 
                sx={{ 
                  position: 'absolute',
                  left: -12,
                  top: '50%',
                  width: 12,
                  height: 2,
                  backgroundColor: 'divider',
                  opacity: 0.5,
                  transform: 'translateY(-50%)'
                }} 
              />
              
              <TodoItem
                todo={{...child, text: `${child.text}`}}
                index={childIndex}
                onToggle={onToggleTodo}
                onClick={onTodoClick}
                isDraggable={false}
                isAnimating={animatingTaskIds.has(child.id)}
                isNewTask={newTaskIds.has(child.id)}
                isCompletingTask={completingTaskIds.has(child.id)}
              />
            </Box>
          ))}
        </Box>
      )}
    </React.Fragment>
  );

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
              minHeight: allDisplayTodos.length === 0 ? 60 : 'auto',
              backgroundColor: (snapshot.isDraggingOver || shouldHighlightDrop) ? 'action.hover' : 'transparent',
              border: (snapshot.isDraggingOver || shouldHighlightDrop) ? '2px dashed' : '2px solid transparent',
              borderColor: (snapshot.isDraggingOver || shouldHighlightDrop) ? 'primary.main' : 'transparent',
              borderRadius: 1,
              transition: 'all 0.2s ease',
              p: (snapshot.isDraggingOver || shouldHighlightDrop) ? 1 : 0,
            }}
          >
            {allDisplayTodos.length === 0 ? (
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
                  color={(snapshot.isDraggingOver || shouldHighlightDrop) ? "primary.main" : "text.secondary"}
                  fontWeight={(snapshot.isDraggingOver || shouldHighlightDrop) ? 600 : 400}
                  sx={{ fontSize: '0.9rem' }}
                >
                  {(snapshot.isDraggingOver || shouldHighlightDrop)
                    ? emptyState.dropMessage
                    : emptyState.defaultMessage
                  }
                </Typography>
                {!(snapshot.isDraggingOver || shouldHighlightDrop) && emptyState.subMessage && (
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                    {emptyState.subMessage}
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                {/* Render all todos in correct order */}
                {allDisplayTodos.map((todo, index) => {
                  // Find if this todo has children
                  const hierarchy = hierarchies.find(h => h.parent.id === todo.id);
                  const children = hierarchy ? hierarchy.children : undefined;
                  
                  return renderTodoWithChildren(todo, index, children);
                })}
              </Box>
            )}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Box>
  );
};

export default NestedTodoSection; 