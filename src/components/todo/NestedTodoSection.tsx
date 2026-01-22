import React, { useState } from 'react';
import { Box, Typography, Badge, IconButton, Menu, MenuItem, Chip } from '@mui/material';
import { FilterList, Close } from '@mui/icons-material';
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
  uncompletingTaskIds?: Set<string>;
  badgeCount?: number;
  // Hashtag filter props
  allHashtags?: string[];
  selectedHashtag?: string | null;
  onHashtagSelect?: (hashtag: string | null) => void;
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
  uncompletingTaskIds = new Set(),
  badgeCount,
  allHashtags = [],
  selectedHashtag,
  onHashtagSelect,
}) => {
  // Menu anchor state for hashtag filter
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const filterMenuOpen = Boolean(filterAnchorEl);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleHashtagSelect = (hashtag: string | null) => {
    if (onHashtagSelect) {
      onHashtagSelect(hashtag);
    }
    handleFilterClose();
  };

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
    <React.Fragment key={todo.stableKey || todo.id}>
      {/* Parent Task - standalone in its own Box */}
      <Box sx={{ mb: 0.5 }}>
        <TodoItem
          todo={todo}
          index={dragIndex}
          onToggle={onToggleTodo}
          onClick={onTodoClick}
          isDraggable={true}
          isAnimating={animatingTaskIds.has(todo.id)}
          isNewTask={newTaskIds.has(todo.stableKey || todo.id)}
          isCompletingTask={completingTaskIds.has(todo.id)}
          isUncompletingTask={uncompletingTaskIds.has(todo.id)}
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
            <Box key={child.stableKey || child.id} sx={{ mb: 0.5, position: 'relative' }}>
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
                isNewTask={newTaskIds.has(child.stableKey || child.id)}
                isCompletingTask={completingTaskIds.has(child.id)}
                isUncompletingTask={uncompletingTaskIds.has(child.id)}
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="overline" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            {badgeCount !== undefined && badgeCount > 0 && (
              <Badge
                badgeContent={badgeCount}
                color="error"
                sx={{ 
                  ml: 1.5,
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    height: '16px',
                    minWidth: '16px',
                  }
                }}
              />
            )}
          </Box>
          
          {/* Hashtag Filter */}
          {allHashtags.length > 0 && onHashtagSelect && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {selectedHashtag && (
                <Chip
                  label={selectedHashtag}
                  size="small"
                  onDelete={() => handleHashtagSelect(null)}
                  deleteIcon={<Close fontSize="small" />}
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    '& .MuiChip-deleteIcon': {
                      fontSize: '0.875rem',
                      color: 'white',
                      '&:hover': {
                        color: 'rgba(255,255,255,0.7)',
                      },
                    },
                  }}
                />
              )}
              <IconButton
                size="small"
                onClick={handleFilterClick}
                sx={{
                  color: selectedHashtag ? 'primary.main' : 'text.secondary',
                  p: 0.5,
                }}
              >
                <FilterList fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={filterAnchorEl}
                open={filterMenuOpen}
                onClose={handleFilterClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                {selectedHashtag && (
                  <MenuItem 
                    onClick={() => handleHashtagSelect(null)}
                    sx={{ color: 'error.main', fontSize: '0.875rem' }}
                  >
                    Clear filter
                  </MenuItem>
                )}
                {allHashtags.map((hashtag) => (
                  <MenuItem
                    key={hashtag}
                    onClick={() => handleHashtagSelect(hashtag)}
                    selected={selectedHashtag === hashtag}
                    sx={{ 
                      fontSize: '0.875rem',
                      color: 'primary.main',
                      fontWeight: selectedHashtag === hashtag ? 600 : 400,
                    }}
                  >
                    {hashtag}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
        </Box>
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