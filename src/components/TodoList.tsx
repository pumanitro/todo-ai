import React, { useState } from 'react';
import { Container, Collapse, IconButton, Box, Typography, Alert, Snackbar, Fab, SwipeableDrawer, useTheme, useMediaQuery, ToggleButtonGroup, ToggleButton, Tooltip, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { ExpandMore, ExpandLess, Add, ViewList, CalendarMonth, Today, Schedule } from '@mui/icons-material';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { User } from 'firebase/auth';
import { Todo } from '../types/todo';
import UserHeader from './todo/UserHeader';
import AddTodoForm from './todo/AddTodoForm';

import NestedTodoSection from './todo/NestedTodoSection';
import CompletedTodosSection from './todo/CompletedTodosSection';
import TodoDetailsDrawer from './todo/TodoDetailsDrawer';
import TodoItem from './todo/TodoItem';
import PostponedCalendarView from './todo/PostponedCalendarView';
import PWAInstallPrompt from './PWAInstallPrompt';

// Custom hooks and utilities
import { useTodos } from '../hooks/useTodos';
import { useTodoOperations } from '../hooks/useTodoOperations';
import { useBadgeManager } from '../hooks/useBadgeManager';
import { usePostponedViewMode, PostponedViewMode } from '../hooks/usePostponedViewMode';
import { organizeTaskHierarchy, groupPostponedTodosByDate } from '../utils/todoUtils';
import { formatDateGroupTitle } from '../utils/dateUtils';
import { extractHashtagsFromTexts, textContainsHashtag } from '../utils/linkUtils';

interface TodoListProps {
  user: User;
}

const TodoList: React.FC<TodoListProps> = ({ user }) => {
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPostponedExpanded, setIsPostponedExpanded] = useState<boolean>(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [dragFromCategory, setDragFromCategory] = useState<'today' | 'backlog' | 'postponed' | null>(null);
  const [mobileTab, setMobileTab] = useState<'today' | 'postponed'>('today');
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Custom hooks for state management and operations
  const {
    todos,
    isConnected,
    isOnline,
    hasPendingSync,
    syncNow,
    animateTaskTransition,
    animatingTaskIds,
    movedTasksNotification,
    setMovedTasksNotification,
    showBlockedTasksMovedNotification,
    newTaskIds,
    completingTaskIds,
    uncompletingTaskIds,
    addNewTaskId,
    addCompletingTaskId,
    addUncompletingTaskId,
  } = useTodos(user);

  const { addTodo, deleteTodo, handleSaveEdit, toggleTodo, handleDragEnd } = useTodoOperations({
    user,
    todos,
    animateTaskTransition,
    showBlockedTasksMovedNotification,
    addNewTaskId,
    addCompletingTaskId,
    addUncompletingTaskId,
  });

  // Badge management for PWA icon and browser tab
  const { todayTodoCount, badgeSupported, isAndroidDevice } = useBadgeManager({ todos, isConnected });

  // Postponed view mode preference
  const { viewMode: postponedViewMode, setViewMode: setPostponedViewMode } = usePostponedViewMode(user);

  const handleViewModeChange = (_event: React.MouseEvent<HTMLElement>, newMode: PostponedViewMode | null) => {
    if (newMode !== null) {
      setPostponedViewMode(newMode);
    }
  };

  console.log('IIJ todayTodoCount', todayTodoCount);

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTodo(null);
  };

  const handleSaveEditWrapper = async (field: 'text' | 'description' | 'dueDate' | 'blockedBy', value: string) => {
    if (!selectedTodo) return;
    await handleSaveEdit(selectedTodo, field, value);
  };

  const handleDeleteWrapper = async (todoId: string) => {
    await deleteTodo(todoId);
    setIsDrawerOpen(false);
    setSelectedTodo(null);
  };

  // Helper function to render nested tasks in postponed section using the same logic as NestedTodoSection
  const renderNestedTasksInPostponed = (parentTasksList: Todo[]) => {
    const { hierarchies, standalone } = organizeTaskHierarchy(todos, 'postponed');
    
    // Create unified list and sort by order (same as NestedTodoSection)
    const allParentTasks = [...standalone, ...hierarchies.map(h => h.parent)];
    const filteredTasks = allParentTasks.filter(task => 
      parentTasksList.some(parentTask => parentTask.id === task.id)
    );
    
    filteredTasks.sort((a, b) => {
      if (a.order === b.order) {
        return b.timestamp - a.timestamp;
      }
      return a.order - b.order;
    });

    const renderTaskWithChildren = (todo: Todo, index: number) => {
      // Find if this todo has children
      const hierarchy = hierarchies.find(h => h.parent.id === todo.id);
      const children = hierarchy ? hierarchy.children : undefined;
      
      return (
        <React.Fragment key={todo.id}>
          {/* Parent Task */}
          <Box sx={{ mb: 0.5 }}>
            <TodoItem
              todo={todo}
              index={index}
              onToggle={toggleTodo}
              onClick={handleTodoClick}
              isDraggable={false}
              hideDueDate={true}
              isAnimating={animatingTaskIds.has(todo.id)}
              isNewTask={newTaskIds.has(todo.id)}
              isCompletingTask={completingTaskIds.has(todo.id)}
              isUncompletingTask={uncompletingTaskIds.has(todo.id)}
            />
          </Box>
          
          {/* Nested Children */}
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
                    todo={child}
                    index={childIndex}
                    onToggle={toggleTodo}
                    onClick={handleTodoClick}
                    isDraggable={false}
                    hideDueDate={true}
                    isAnimating={animatingTaskIds.has(child.id)}
                    isNewTask={newTaskIds.has(child.id)}
                    isCompletingTask={completingTaskIds.has(child.id)}
                    isUncompletingTask={uncompletingTaskIds.has(child.id)}
                  />
                </Box>
              ))}
            </Box>
          )}
        </React.Fragment>
      );
    };

    return filteredTasks.map((todo, index) => renderTaskWithChildren(todo, index));
  };

  const handleDragStart = (result: any) => {
    const sourceCategory = result.source.droppableId as 'today' | 'backlog' | 'postponed';
    setDragFromCategory(sourceCategory);
  };

  const handleDragEndWrapper = async (result: DropResult) => {
    // Clear drag state
    setDragFromCategory(null);
    
    if (!result.destination) return;

    const sourceDroppableId = result.source.droppableId;
    const destinationDroppableId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceDroppableId === destinationDroppableId && sourceIndex === destinationIndex) return;

    await handleDragEnd(
      result.draggableId,
      destinationDroppableId as 'today' | 'backlog' | 'postponed',
      destinationIndex
    );
  };

  // Extract all unique hashtags from all todos
  const allHashtags = extractHashtagsFromTexts(todos.map(t => t.text));

  // Helper function to apply hashtag filter
  const applyHashtagFilter = (todoList: Todo[]) => {
    if (!selectedHashtag) return todoList;
    return todoList.filter(todo => textContainsHashtag(todo.text, selectedHashtag));
  };

  // Filter todos by category, then apply hashtag filter
  const todayTodos = applyHashtagFilter(todos.filter(todo => !todo.completed && todo.category === 'today'));
  const postponedTodos = applyHashtagFilter(todos.filter(todo => !todo.completed && todo.category === 'postponed'));
  const backlogTodos = applyHashtagFilter(todos.filter(todo => !todo.completed && todo.category === 'backlog'));
  const completedTodos = applyHashtagFilter(todos.filter(todo => todo.completed));

  // Group postponed todos by date (only parent tasks, nesting will be handled in rendering)
  const postponedGroups = groupPostponedTodosByDate(postponedTodos, formatDateGroupTitle);

  // Helper to render postponed list content (reused in both desktop and mobile views)
  const renderPostponedListContent = () => (
    <Box sx={{ mt: 1, pl: isMobile ? 0 : 2 }}>
      {postponedGroups.map((group, groupIndex) => {
        // Calculate days until this date
        let daysLabel: string | null = null;
        let diffDays = 0;
        if (group.date && group.date !== 'No Date') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const targetDate = new Date(group.date);
          targetDate.setHours(0, 0, 0, 0);
          diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 1 && diffDays <= 3) {
            daysLabel = `in ${diffDays}d`;
          } else if (diffDays >= 4 && diffDays <= 6) {
            daysLabel = 'in <1w';
          } else if (diffDays >= 7) {
            daysLabel = '1w+';
          }
        }
        
        // Get pill color based on days - red/orange/yellow → green → gray
        const getPillStyle = () => {
          if (diffDays === 1) return { bg: '#d32f2f', color: '#ffffff' }; // 1d - red
          if (diffDays === 2) return { bg: '#ff9800', color: '#ffffff' }; // 2d - orange
          if (diffDays === 3) return { bg: '#ffc107', color: '#5d4037' }; // 3d - yellow
          if (diffDays <= 6) return { bg: '#4caf50', color: '#ffffff' }; // 4-6d - green (<1w)
          return { bg: '#e0e0e0', color: '#757575' }; // 7d+ - gray (1w+)
        };
        const pillStyle = getPillStyle();
        
        return (
          <Box key={groupIndex} sx={{ mb: groupIndex < postponedGroups.length - 1 ? 2.5 : 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  fontSize: '0.95rem'
                }}
              >
                {group.displayDate}
              </Typography>
              {daysLabel && (
                <Box
                  sx={{
                    px: 0.75,
                    py: 0.125,
                    borderRadius: 1,
                    backgroundColor: pillStyle.bg,
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    color: pillStyle.color,
                  }}
                >
                  {daysLabel}
                </Box>
              )}
            </Box>
            <Box sx={{ '& > *': { mb: 0.5 } }}>
              {renderNestedTasksInPostponed(group.parentTasks)}
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 2, px: { xs: 2.5, sm: 3, md: 4 }, pb: { xs: 10, sm: 2 } }}>
      <UserHeader 
        user={user} 
        isConnected={isConnected} 
        isOnline={isOnline}
        hasPendingSync={hasPendingSync}
        onSyncNow={syncNow}
      />

      {/* Mobile: Conditional rendering based on selected tab */}
      {isMobile ? (
        <>
          {mobileTab === 'today' ? (
            <>
              {/* Today + Backlog - Main active tasks */}
              <Box sx={{ mb: 3 }}>
                <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEndWrapper}>
                  <NestedTodoSection
                    category="today"
                    todos={todayTodos}
                    title="Today"
                    onToggleTodo={toggleTodo}
                    onTodoClick={handleTodoClick}
                    animatingTaskIds={animatingTaskIds}
                    newTaskIds={newTaskIds}
                    completingTaskIds={completingTaskIds}
                    uncompletingTaskIds={uncompletingTaskIds}
                    shouldHighlightDrop={dragFromCategory === 'today' || dragFromCategory === 'backlog'}
                    allHashtags={allHashtags}
                    selectedHashtag={selectedHashtag}
                    onHashtagSelect={setSelectedHashtag}
                  />

                  {/* Backlog Section */}
                  <Box sx={{ mb: 0, mt: 2 }}>
                    <Typography variant="overline" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                      Backlog
                    </Typography>

                    <NestedTodoSection
                      category="backlog"
                      todos={backlogTodos}
                      title=""
                      onToggleTodo={toggleTodo}
                      onTodoClick={handleTodoClick}
                      animatingTaskIds={animatingTaskIds}
                      newTaskIds={newTaskIds}
                      completingTaskIds={completingTaskIds}
                      uncompletingTaskIds={uncompletingTaskIds}
                      shouldHighlightDrop={dragFromCategory === 'today' || dragFromCategory === 'backlog'}
                    />
                  </Box>
                </DragDropContext>
              </Box>

              {/* Completed Tasks */}
              {completedTodos.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <CompletedTodosSection
                    completedTodos={completedTodos}
                    onToggleTodo={toggleTodo}
                    onTodoClick={handleTodoClick}
                    animatingTaskIds={animatingTaskIds}
                    newTaskIds={newTaskIds}
                    completingTaskIds={completingTaskIds}
                    uncompletingTaskIds={uncompletingTaskIds}
                  />
                </Box>
              )}
            </>
          ) : (
            /* Mobile Postponed Tab */
            <Box sx={{ mb: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  py: 0.5,
                  mb: 1,
                }}
              >
                <Typography variant="overline" sx={{ fontWeight: 600 }}>
                  Postponed ({postponedTodos.length})
                </Typography>
                
                {/* View Mode Toggle */}
                <ToggleButtonGroup
                  value={postponedViewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                >
                  <ToggleButton value="list" aria-label="list view" sx={{ p: 0.5 }}>
                    <ViewList fontSize="small" />
                  </ToggleButton>
                  <ToggleButton value="calendar" aria-label="calendar view" sx={{ p: 0.5 }}>
                    <CalendarMonth fontSize="small" />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              {postponedTodos.length > 0 ? (
                postponedViewMode === 'list' ? (
                  renderPostponedListContent()
                ) : (
                  <PostponedCalendarView
                    todos={postponedTodos}
                    onTodoClick={handleTodoClick}
                  />
                )
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4, 
                  color: 'text.secondary' 
                }}>
                  <Schedule sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">
                    No postponed tasks
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </>
      ) : (
        /* Desktop: Show all sections */
        <>
          {/* Today + Backlog - Main active tasks */}
          <Box sx={{ mb: 3 }}>
            <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEndWrapper}>
              <NestedTodoSection
                category="today"
                todos={todayTodos}
                title="Today"
                onToggleTodo={toggleTodo}
                onTodoClick={handleTodoClick}
                animatingTaskIds={animatingTaskIds}
                newTaskIds={newTaskIds}
                completingTaskIds={completingTaskIds}
                uncompletingTaskIds={uncompletingTaskIds}
                shouldHighlightDrop={dragFromCategory === 'today' || dragFromCategory === 'backlog'}
                badgeCount={todayTodoCount}
                allHashtags={allHashtags}
                selectedHashtag={selectedHashtag}
                onHashtagSelect={setSelectedHashtag}
              />

              {/* Backlog Section with Add Todo Form */}
              <Box sx={{ mb: 0, mt: 2 }}>
                <Typography variant="overline" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                  Backlog
                </Typography>
                
                <AddTodoForm onAddTodo={addTodo} allHashtags={allHashtags} />

                <NestedTodoSection
                  category="backlog"
                  todos={backlogTodos}
                  title=""
                  onToggleTodo={toggleTodo}
                  onTodoClick={handleTodoClick}
                  animatingTaskIds={animatingTaskIds}
                  newTaskIds={newTaskIds}
                  completingTaskIds={completingTaskIds}
                  uncompletingTaskIds={uncompletingTaskIds}
                  shouldHighlightDrop={dragFromCategory === 'today' || dragFromCategory === 'backlog'}
                />
              </Box>
            </DragDropContext>
          </Box>

          {/* Postponed Tasks - Separate section */}
          {postponedTodos.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  py: 0.5,
                  borderRadius: 1,
                }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    flexGrow: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    borderRadius: 1,
                  }}
                  onClick={() => setIsPostponedExpanded(!isPostponedExpanded)}
                >
                  <IconButton size="small">
                    {isPostponedExpanded ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  <Typography variant="overline" sx={{ mb: 0, fontWeight: 600 }}>
                    Postponed ({postponedTodos.length})
                  </Typography>
                </Box>
                
                {/* View Mode Toggle */}
                <ToggleButtonGroup
                  value={postponedViewMode}
                  exclusive
                  onChange={handleViewModeChange}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <ToggleButton value="list" aria-label="list view" sx={{ p: 0.5 }}>
                    <Tooltip title="List View">
                      <ViewList fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="calendar" aria-label="calendar view" sx={{ p: 0.5 }}>
                    <Tooltip title="Calendar View">
                      <CalendarMonth fontSize="small" />
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              
              <Collapse in={isPostponedExpanded}>
                {postponedViewMode === 'list' ? (
                  <Box sx={{ pl: 2 }}>
                    {renderPostponedListContent()}
                  </Box>
                ) : (
                  <PostponedCalendarView
                    todos={postponedTodos}
                    onTodoClick={handleTodoClick}
                  />
                )}
              </Collapse>
            </Box>
          )}

          {/* Completed Tasks - Less visible */}
          {completedTodos.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <CompletedTodosSection
                completedTodos={completedTodos}
                onToggleTodo={toggleTodo}
                onTodoClick={handleTodoClick}
                animatingTaskIds={animatingTaskIds}
                newTaskIds={newTaskIds}
                completingTaskIds={completingTaskIds}
                uncompletingTaskIds={uncompletingTaskIds}
              />
            </Box>
          )}
        </>
      )}

      <TodoDetailsDrawer
        isOpen={isDrawerOpen}
        todo={selectedTodo}
        todos={todos}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEditWrapper}
        onDelete={handleDeleteWrapper}
      />

      {/* Mobile FAB - positioned above bottom navigation */}
      {isMobile && mobileTab === 'today' && (
        <Fab
          color="primary"
          aria-label="add task"
          onClick={() => setIsAddDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 72,
            right: 16,
            zIndex: theme.zIndex.fab,
          }}
        >
          <Add />
        </Fab>
      )}

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0,
            zIndex: theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
          }} 
          elevation={3}
        >
          <BottomNavigation
            value={mobileTab}
            onChange={(_event, newValue) => setMobileTab(newValue)}
            showLabels
            sx={{
              height: 56,
              '& .MuiBottomNavigationAction-root': {
                minWidth: 0,
                py: 1,
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                '&.Mui-selected': {
                  fontSize: '0.75rem',
                },
              },
            }}
          >
            <BottomNavigationAction 
              label="Today" 
              value="today" 
              icon={
                <Box sx={{ position: 'relative' }}>
                  <Today />
                  {todayTodoCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -6,
                        right: -10,
                        minWidth: 18,
                        height: 18,
                        borderRadius: '9px',
                        backgroundColor: 'error.main',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        px: 0.5,
                      }}
                    >
                      {todayTodoCount > 99 ? '99+' : todayTodoCount}
                    </Box>
                  )}
                </Box>
              } 
            />
            <BottomNavigationAction 
              label="Postponed" 
              value="postponed" 
              icon={<Schedule />} 
            />
          </BottomNavigation>
        </Paper>
      )}

      {/* Mobile Bottom Drawer for Add Task */}
      <SwipeableDrawer
        anchor="bottom"
        open={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        onOpen={() => setIsAddDrawerOpen(true)}
        disableSwipeToOpen
        sx={{
          '& .MuiDrawer-paper': {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            pb: 2,
          },
        }}
      >
        <Box sx={{ px: 3, py: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontSize: '1rem' }}>
            Add New Backlog Task
          </Typography>
          <AddTodoForm 
            onAddTodo={(text, dueDate) => {
              addTodo(text, dueDate);
              setIsAddDrawerOpen(false);
            }}
            allHashtags={allHashtags}
          />
        </Box>
      </SwipeableDrawer>

      <Snackbar
        open={!!movedTasksNotification}
        autoHideDuration={6000}
        onClose={() => setMovedTasksNotification('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setMovedTasksNotification('')} 
          severity="info" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {movedTasksNotification}
        </Alert>
      </Snackbar>

      <PWAInstallPrompt />
    </Container>
  );
};

export default TodoList; 