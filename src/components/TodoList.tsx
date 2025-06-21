import React, { useState, useEffect } from 'react';
import { Card, CardContent, Container, Collapse, IconButton, Box, Typography, Alert, Snackbar, Fab, SwipeableDrawer, useTheme, useMediaQuery } from '@mui/material';
import { ExpandMore, ExpandLess, Add } from '@mui/icons-material';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { database } from '../firebase/config';
import { ref, push, onValue, remove, update } from 'firebase/database';
import { User } from 'firebase/auth';
import { Todo } from '../types/todo';
import UserHeader from './todo/UserHeader';
import AddTodoForm from './todo/AddTodoForm';

import NestedTodoSection from './todo/NestedTodoSection';
import CompletedTodosSection from './todo/CompletedTodosSection';
import TodoDetailsDrawer from './todo/TodoDetailsDrawer';
import TodoItem from './todo/TodoItem';
import PWAInstallPrompt from './PWAInstallPrompt';

interface TodoListProps {
  user: User;
}

const TodoList: React.FC<TodoListProps> = ({ user }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isPostponedExpanded, setIsPostponedExpanded] = useState<boolean>(false);
  const [movedTasksNotification, setMovedTasksNotification] = useState<string>('');
  const [animatingTaskIds, setAnimatingTaskIds] = useState<Set<string>>(new Set());
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [dragFromCategory, setDragFromCategory] = useState<'today' | 'backlog' | 'postponed' | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const transformFirebaseDataToTodos = (data: any): Todo[] => {
    if (!data) return [];
    
    const todoList: Todo[] = Object.entries(data).map(([id, value]: [string, any]) => ({
      id,
      text: value.text,
      completed: value.completed || false,
      timestamp: value.timestamp,
      order: value.order || 0,
      description: value.description || '',
      category: value.category || 'today',
      dueDate: value.dueDate || undefined,
      blockedBy: value.blockedBy || undefined,
    }));
    
    // Sort by order (primary) and timestamp (secondary)
    return todoList.sort((a, b) => {
      if (a.order === b.order) {
        return b.timestamp - a.timestamp;
      }
      return a.order - b.order;
    });
  };



  const showMovedTasksNotification = (tasksCount: number) => {
    const message = tasksCount === 1 
      ? `1 task was moved from Postponed to Today because it's due today`
      : `${tasksCount} tasks were moved from Postponed to Today because they're due today`;
    setMovedTasksNotification(message);
  };

  const showBlockedTasksMovedNotification = (tasksCount: number, parentTaskName: string) => {
    const message = tasksCount === 1 
      ? `1 blocked task moved to Backlog after "${parentTaskName}" was completed`
      : `${tasksCount} blocked tasks moved to Backlog after "${parentTaskName}" was completed`;
    setMovedTasksNotification(message);
  };

  const animateTaskTransition = async (taskIds: string[]) => {
    // Add tasks to animation set
    setAnimatingTaskIds(prev => {
      const newSet = new Set(prev);
      taskIds.forEach(id => newSet.add(id));
      return newSet;
    });

    // Remove from animation set after animation completes
    setTimeout(() => {
      setAnimatingTaskIds(prev => {
        const newSet = new Set(prev);
        taskIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }, 1000); // Animation duration
  };



  useEffect(() => {
    // Helper functions moved inside useEffect to avoid dependency warnings
    const findTasksToMoveToToday = (todoList: Todo[]): Todo[] => {
      return todoList.filter(todo => 
        !todo.completed && 
        todo.category === 'postponed' && 
        categorizeTodoByDueDate(todo.dueDate) === 'today'
      );
    };

    const moveTasksToTodayCategory = async (tasksToMove: Todo[], todoList: Todo[]) => {
      if (tasksToMove.length === 0) return;

      const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
      const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;

      // Move tasks to today category
      const updatePromises = tasksToMove.map(async (task, index) => {
        const todoRef = ref(database, `users/${user.uid}/todos/${task.id}`);
        await update(todoRef, {
          category: 'today',
          order: minTodayOrder - 1 - index
        });
      });

      await Promise.all(updatePromises);
    };
    
    const handleSnapshot = async (snapshot: any) => {
      const data = snapshot.val();
      const todoList = transformFirebaseDataToTodos(data);
      
      // Handle auto-migration of postponed tasks that are now due today
      const tasksToMove = findTasksToMoveToToday(todoList);
      
      if (tasksToMove.length > 0) {
        // Start animation for tasks being moved
        await animateTaskTransition(tasksToMove.map(task => task.id));
        
        // Update Firebase first
        await moveTasksToTodayCategory(tasksToMove, todoList);
        showMovedTasksNotification(tasksToMove.length);
        
        // Now create the updated todoList with the changes we just made
        const todayTodos = todoList.filter(t => !t.completed && t.category === 'today');
        const minTodayOrder = todayTodos.length > 0 ? Math.min(...todayTodos.map(t => t.order)) : 0;
        
        const updatedTodoList = todoList.map(todo => {
          const taskToMoveIndex = tasksToMove.findIndex(t => t.id === todo.id);
          if (taskToMoveIndex >= 0) {
            const updatedTodo = {
              ...todo,
              category: 'today' as const,
              order: minTodayOrder - 1 - taskToMoveIndex
            };
            return updatedTodo;
          }
          return { ...todo }; // Create new object reference even for unchanged todos
        });
        
        setTodos([...updatedTodoList]); // Force new array reference
        setIsConnected(true);
        return;
      }

      setTodos(todoList);
      setIsConnected(true);
    };

    const handleError = (error: any) => {
      console.error('Firebase error:', error);
      setIsConnected(false);
    };
    
    try {
      const todosRef = ref(database, `users/${user.uid}/todos`);
      const unsubscribe = onValue(todosRef, handleSnapshot, handleError);

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
    }
  }, [user.uid]);



  const categorizeTodoByDueDate = (dueDate?: string): 'today' | 'backlog' | 'postponed' => {
    if (!dueDate) return 'backlog';
    
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diffDays = Math.ceil((due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'today'; // Due today or overdue
    } else {
      return 'postponed'; // Due in the future
    }
  };

  const addTodo = async (text: string, dueDate?: string) => {
    try {
      const todosRef = ref(database, `users/${user.uid}/todos`);
      const category = categorizeTodoByDueDate(dueDate);
      
      const todosInCategory = todos.filter(t => t.category === category && !t.completed);
      const minOrder = todosInCategory.length > 0 ? Math.min(...todosInCategory.map(t => t.order)) : 0;
      
      const newTodo = {
        text,
        completed: false,
        timestamp: Date.now(),
        order: minOrder - 1,
        category,
        ...(dueDate && { dueDate }),
      };
      
      await push(todosRef, newTodo);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    try {
      // Find any tasks that are blocked by the task being deleted
      const blockedChildren = todos.filter(todo => todo.blockedBy === todoId);
      
      // Clear blockedBy references for any children
      if (blockedChildren.length > 0) {
        const clearBlockedPromises = blockedChildren.map(async (child) => {
          const childRef = ref(database, `users/${user.uid}/todos/${child.id}`);
          await update(childRef, { blockedBy: null });
        });
        await Promise.all(clearBlockedPromises);
      }

      // Delete the main todo
      const todoRef = ref(database, `users/${user.uid}/todos/${todoId}`);
      await remove(todoRef);
      setIsDrawerOpen(false);
      setSelectedTodo(null);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleTodoClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedTodo(null);
  };

  const handleSaveEdit = async (field: 'text' | 'description' | 'dueDate' | 'blockedBy', value: string) => {
    if (!selectedTodo) return;

    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${selectedTodo.id}`);
      
      let updates: any = {
        [field]: value.trim(),
      };

      // If updating due date, recategorize the todo
      if (field === 'dueDate') {
        const newCategory = categorizeTodoByDueDate(value || undefined);
        if (newCategory !== selectedTodo.category) {
          const todosInNewCategory = todos.filter(t => 
            t.category === newCategory && !t.completed && t.id !== selectedTodo.id
          );
          const minOrder = todosInNewCategory.length > 0 ? 
            Math.min(...todosInNewCategory.map(t => t.order)) : 0;
          
          updates.category = newCategory;
          updates.order = minOrder - 1;
        }
        
        // Clear dueDate if empty
        if (!value.trim()) {
          updates.dueDate = null;
        }
      }

      // Handle blockedBy field
      if (field === 'blockedBy') {
        if (!value.trim()) {
          updates.blockedBy = null;
        } else {
          // When a task becomes blocked, it should inherit the parent's category
          const parentTask = todos.find(t => t.id === value.trim());
          if (parentTask) {
            updates.category = parentTask.category;
            // Also update order to be near the parent
            const parentCategoryTodos = todos.filter(t => 
              t.category === parentTask.category && !t.completed && t.id !== selectedTodo.id
            );
            const minOrder = parentCategoryTodos.length > 0 ? 
              Math.min(...parentCategoryTodos.map(t => t.order)) : 0;
            updates.order = minOrder - 1;
          }
        }
      }
      
      await update(todoRef, updates);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const todoRef = ref(database, `users/${user.uid}/todos/${todoId}`);
      const newCompletedStatus = !completed;
      const currentTodo = todos.find(todo => todo.id === todoId);
      if (!currentTodo) return;
      
      // Find blocked children before completing the parent
      const blockedChildren = todos.filter(todo => todo.blockedBy === todoId && !todo.completed);
      
      let newOrder;
      let newCategory: 'today' | 'backlog' | 'postponed';
      
      if (newCompletedStatus) {
        // Completing a task - move to completed section
        const completedTodos = todos.filter(todo => todo.completed);
        const minCompletedOrder = completedTodos.length > 0 ? Math.min(...completedTodos.map(t => t.order)) : 0;
        newOrder = minCompletedOrder - 1;
        newCategory = currentTodo.category; // Keep current category

        // Handle blocked children when parent is completed
        if (blockedChildren.length > 0) {
          // Start animation for blocked children
          await animateTaskTransition(blockedChildren.map(child => child.id));
          
          // Move blocked children to backlog
          const backlogTodos = todos.filter(t => !t.completed && t.category === 'backlog');
          const minBacklogOrder = backlogTodos.length > 0 ? Math.min(...backlogTodos.map(t => t.order)) : 0;
          
          // Update all blocked children to move to backlog and clear blockedBy
          const childUpdatePromises = blockedChildren.map(async (child, index) => {
            const childRef = ref(database, `users/${user.uid}/todos/${child.id}`);
            await update(childRef, {
              category: 'backlog',
              order: minBacklogOrder - 1 - index,
              blockedBy: null // Clear the blocking relationship
            });
          });

          await Promise.all(childUpdatePromises);
          
          // Show notification about moved tasks
          showBlockedTasksMovedNotification(blockedChildren.length, currentTodo.text);
        }
      } else {
        // Uncompleting a task - recategorize based on due date
        newCategory = categorizeTodoByDueDate(currentTodo.dueDate);
        const todosInNewCategory = todos.filter(todo => !todo.completed && todo.category === newCategory);
        const minCategoryOrder = todosInNewCategory.length > 0 ? Math.min(...todosInNewCategory.map(t => t.order)) : 0;
        newOrder = minCategoryOrder - 1;
      }
      
      await update(todoRef, { 
        completed: newCompletedStatus,
        order: newOrder,
        category: newCategory
      });
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const formatDateGroupTitle = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dateString = date.toDateString();
    const todayString = today.toDateString();
    const tomorrowString = tomorrow.toDateString();
    
    if (dateString === todayString) {
      return 'Today';
    } else if (dateString === tomorrowString) {
      return 'Tomorrow';
    } else {
      // Show date in DD.MM.YYYY format
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
  };

      // Helper function to render nested tasks in postponed section using the same logic as NestedTodoSection
    const renderNestedTasksInPostponed = (parentTasksList: Todo[]) => {
    // Organize tasks into hierarchical structure (same approach as NestedTodoSection)
    const organizeHierarchy = () => {
      const hierarchies: Array<{ parent: Todo; children: Todo[] }> = [];
      const standalone: Todo[] = [];
      
      parentTasksList.forEach(parent => {
        // Find children that are blocked by this parent (regardless of their category)
        const children = todos.filter(child => 
          child.blockedBy === parent.id && 
          !child.completed
        );
        
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

    const { hierarchies, standalone } = organizeHierarchy();
    
    // Create unified list and sort by order (same as NestedTodoSection)
    const allParentTasks = [...standalone, ...hierarchies.map(h => h.parent)];
    allParentTasks.sort((a, b) => {
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
                  />
                </Box>
              ))}
            </Box>
          )}
        </React.Fragment>
      );
    };

    return allParentTasks.map((todo, index) => renderTaskWithChildren(todo, index));
  };

  const handleDragStart = (result: any) => {
    const sourceCategory = result.source.droppableId as 'today' | 'backlog' | 'postponed';
    setDragFromCategory(sourceCategory);
  };

  const handleDragEnd = async (result: DropResult) => {
    // Clear drag state
    setDragFromCategory(null);
    
    if (!result.destination) return;

    const sourceDroppableId = result.source.droppableId;
    const destinationDroppableId = result.destination.droppableId;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceDroppableId === destinationDroppableId && sourceIndex === destinationIndex) return;

    try {
      const draggedTodoId = result.draggableId;
      const draggedTodo = todos.find(todo => todo.id === draggedTodoId);
      if (!draggedTodo) return;

      // Get all blocked children of the dragged task
      const blockedChildren = todos.filter(todo => todo.blockedBy === draggedTodoId);

      const newCategory = destinationDroppableId as 'today' | 'backlog' | 'postponed';
      
      // Get destination todos in the same order as they appear in the UI
      // This must match exactly how NestedTodoSection displays them
      const categoryTodos = todos.filter(todo => 
        !todo.completed && todo.category === newCategory && !todo.blockedBy && todo.id !== draggedTodoId
      );
      
      // Sort them the same way as in NestedTodoSection (by order, then timestamp)
      // This creates the unified list that matches allParentTasks in NestedTodoSection
      const destinationTodos = categoryTodos.sort((a, b) => {
        if (a.order === b.order) {
          return b.timestamp - a.timestamp;
        }
        return a.order - b.order;
      });

      let newOrder: number;
      if (destinationTodos.length === 0) {
        newOrder = 0;
      } else if (destinationIndex === 0) {
        newOrder = Math.min(...destinationTodos.map(t => t.order)) - 1;
      } else if (destinationIndex >= destinationTodos.length) {
        newOrder = Math.max(...destinationTodos.map(t => t.order)) + 1;
      } else {
        const prevOrder = destinationTodos[destinationIndex - 1]?.order || 0;
        const nextOrder = destinationTodos[destinationIndex]?.order || 0;
        newOrder = (prevOrder + nextOrder) / 2;
      }

      // Update the parent task
      const todoRef = ref(database, `users/${user.uid}/todos/${draggedTodoId}`);
      await update(todoRef, {
        category: newCategory,
        order: newOrder
      });

      // Update all blocked children to follow the parent
      if (blockedChildren.length > 0) {
        const childUpdatePromises = blockedChildren.map(async (child, index) => {
          const childRef = ref(database, `users/${user.uid}/todos/${child.id}`);
          await update(childRef, {
            category: newCategory,
            order: newOrder + 0.1 + (index * 0.01) // Ensure children have slightly higher order values
          });
        });

        await Promise.all(childUpdatePromises);
      }

    } catch (error) {
      console.error('Error reordering todos:', error);
    }
  };

  const todayTodos = todos.filter(todo => !todo.completed && todo.category === 'today');
  const postponedTodos = todos.filter(todo => !todo.completed && todo.category === 'postponed');
  const backlogTodos = todos.filter(todo => !todo.completed && todo.category === 'backlog');
  const completedTodos = todos.filter(todo => todo.completed);

  // Group postponed todos by date (only parent tasks, nesting will be handled in rendering)
  const groupPostponedTodosByDate = () => {
    // Only group parent tasks (non-blocked tasks) from postponed category
    const postponedParentTasks = postponedTodos.filter(todo => !todo.blockedBy);
    const grouped: { [date: string]: Todo[] } = {};
    
    postponedParentTasks.forEach(todo => {
      const date = todo.dueDate || 'No Date';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(todo);
    });

    // Sort each group by order and timestamp
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (a.order === b.order) {
          return b.timestamp - a.timestamp;
        }
        return a.order - b.order;
      });
    });

    // Sort dates (nearest first, then future dates)
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (a === 'No Date') return 1; // 'No Date' goes last
      if (b === 'No Date') return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    });

    return sortedDates.map(date => ({
      date,
      parentTasks: grouped[date], // Renamed for clarity
      displayDate: date === 'No Date' ? 'No Date' : formatDateGroupTitle(date)
    }));
  };

  const postponedGroups = groupPostponedTodosByDate();

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <UserHeader user={user} isConnected={isConnected} />



      {/* Today + Backlog Card - Main active tasks */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <NestedTodoSection
              category="today"
              todos={todayTodos}
              title="Today"
              onToggleTodo={toggleTodo}
              onTodoClick={handleTodoClick}
              animatingTaskIds={animatingTaskIds}
              shouldHighlightDrop={dragFromCategory === 'today' || dragFromCategory === 'backlog'}
            />

            {/* Backlog Section with Add Todo Form */}
            <Box sx={{ mb: 0 }}>
              <Typography variant="overline" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                Backlog
              </Typography>
              
              {/* Show AddTodoForm only on desktop */}
              {!isMobile && <AddTodoForm onAddTodo={addTodo} />}

              <NestedTodoSection
                category="backlog"
                todos={backlogTodos}
                title=""
                onToggleTodo={toggleTodo}
                onTodoClick={handleTodoClick}
                animatingTaskIds={animatingTaskIds}
                shouldHighlightDrop={dragFromCategory === 'today' || dragFromCategory === 'backlog'}
              />
            </Box>
          </DragDropContext>
        </CardContent>
      </Card>

      {/* Postponed Tasks Card - Separate section */}
      {postponedTodos.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                py: 0.5,
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
              <Typography variant="overline" sx={{ flexGrow: 1, mb: 0, fontWeight: 600 }}>
                Postponed ({postponedTodos.length})
              </Typography>
            </Box>
            
            <Collapse in={isPostponedExpanded}>
              <Box sx={{ mt: 1, pl: 2 }}>
                {postponedGroups.map((group, groupIndex) => (
                  <Box key={groupIndex} sx={{ mb: groupIndex < postponedGroups.length - 1 ? 2.5 : 0 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.primary',
                        mb: 1,
                        fontSize: '0.95rem'
                      }}
                    >
                      {group.displayDate}
                    </Typography>
                    <Box sx={{ '& > *': { mb: 0.5 } }}>
                      {renderNestedTasksInPostponed(group.parentTasks)}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks - Less visible */}
      {completedTodos.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <CompletedTodosSection
            completedTodos={completedTodos}
            onToggleTodo={toggleTodo}
            onTodoClick={handleTodoClick}
            animatingTaskIds={animatingTaskIds}
          />
        </Box>
      )}

      <TodoDetailsDrawer
        isOpen={isDrawerOpen}
        todo={selectedTodo}
        todos={todos}
        onClose={handleCloseDrawer}
        onSaveEdit={handleSaveEdit}
        onDelete={deleteTodo}
      />

      {/* Mobile FAB - positioned in bottom right corner */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add task"
          onClick={() => setIsAddDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.fab,
          }}
        >
          <Add />
        </Fab>
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