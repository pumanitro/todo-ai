import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, Divider, TextField, Button, Select, MenuItem, FormControl, InputLabel, ListSubheader } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { Todo } from '../../types/todo';
import { renderTextWithLinks } from '../../utils/linkUtils';

interface TodoDetailsDrawerProps {
  isOpen: boolean;
  todo: Todo | null;
  todos: Todo[]; // Add todos list for dropdown
  onClose: () => void;
  onSaveEdit: (field: 'text' | 'description' | 'dueDate' | 'blockedBy', value: string) => void;
  onDelete: (todoId: string) => void;
}

const TodoDetailsDrawer: React.FC<TodoDetailsDrawerProps> = ({ 
  isOpen, 
  todo, 
  todos,
  onClose, 
  onSaveEdit, 
  onDelete 
}) => {
  const [editedName, setEditedName] = useState<string>('');
  const [editedDescription, setEditedDescription] = useState<string>('');
  const [editedDueDate, setEditedDueDate] = useState<string>('');
  const [editedBlockedBy, setEditedBlockedBy] = useState<string>('');

  useEffect(() => {
    if (todo) {
      setEditedName(todo.text);
      setEditedDescription(todo.description || '');
      setEditedDueDate(todo.dueDate || '');
      setEditedBlockedBy(todo.blockedBy || '');
    }
  }, [todo]);

  const handleClose = () => {
    onClose();
    setEditedName('');
    setEditedDescription('');
    setEditedDueDate('');
    setEditedBlockedBy('');
  };

  // Get available tasks for blocking grouped by category
  const getAvailableBlockingTasks = () => {
    if (!todo) return { today: [], backlog: [], postponed: [] };
    
    // Filter available tasks (exclude current task, completed tasks, nested tasks, and circular dependencies)
    const availableTasks = todos.filter(t => 
      t.id !== todo.id && // Can't block itself
      !t.completed && // Can't be blocked by completed tasks
      !t.blockedBy && // Don't include nested/blocked tasks
      t.blockedBy !== todo.id // Prevent circular dependencies
    );

    // Group by category and sort within each group
    const todayTasks = availableTasks
      .filter(t => t.category === 'today')
      .sort((a, b) => {
        if (a.order === b.order) {
          return b.timestamp - a.timestamp;
        }
        return a.order - b.order;
      });

    const backlogTasks = availableTasks
      .filter(t => t.category === 'backlog')
      .sort((a, b) => {
        if (a.order === b.order) {
          return b.timestamp - a.timestamp;
        }
        return a.order - b.order;
      });

    const postponedTasks = availableTasks
      .filter(t => t.category === 'postponed')
      .sort((a, b) => {
        if (a.order === b.order) {
          return b.timestamp - a.timestamp;
        }
        return a.order - b.order;
      });

    return { today: todayTasks, backlog: backlogTasks, postponed: postponedTasks };
  };

  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diffDays = Math.ceil((due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day(s)`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} day(s)`;
    }
  };

  const getBlockingTaskText = () => {
    if (!editedBlockedBy) return 'None';
    const blockingTask = todos.find(t => t.id === editedBlockedBy);
    return blockingTask ? blockingTask.text : 'None';
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 300,
          padding: 3,
        },
      }}
    >
      {todo && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Task Details
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Task Name"
              variant="outlined"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => onSaveEdit('text', editedName)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={4}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={() => onSaveEdit('description', editedDescription)}
              placeholder="Add a description for this task..."
              sx={{ mb: 1 }}
            />
            {editedDescription && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.300' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Preview:
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {renderTextWithLinks(editedDescription)}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              variant="outlined"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              onBlur={() => onSaveEdit('dueDate', editedDueDate)}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Blocked By</InputLabel>
              <Select
                value={editedBlockedBy}
                label="Blocked By"
                onChange={(e) => {
                  setEditedBlockedBy(e.target.value);
                  onSaveEdit('blockedBy', e.target.value);
                }}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                
                {(() => {
                  const groupedTasks = getAvailableBlockingTasks();
                  const items = [];
                  
                  // Today section
                  if (groupedTasks.today.length > 0) {
                    items.push(
                      <ListSubheader key="today-header" sx={{ fontWeight: 600, color: 'primary.main' }}>
                        TODAY
                      </ListSubheader>
                    );
                    groupedTasks.today.forEach((task) => {
                      items.push(
                        <MenuItem key={task.id} value={task.id} sx={{ pl: 3 }}>
                          {task.text}
                        </MenuItem>
                      );
                    });
                  }
                  
                  // Backlog section
                  if (groupedTasks.backlog.length > 0) {
                    items.push(
                      <ListSubheader key="backlog-header" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        BACKLOG
                      </ListSubheader>
                    );
                    groupedTasks.backlog.forEach((task) => {
                      items.push(
                        <MenuItem key={task.id} value={task.id} sx={{ pl: 3 }}>
                          {task.text}
                        </MenuItem>
                      );
                    });
                  }
                  
                  // Postponed section
                  if (groupedTasks.postponed.length > 0) {
                    items.push(
                      <ListSubheader key="postponed-header" sx={{ fontWeight: 600, color: 'warning.main' }}>
                        POSTPONED
                      </ListSubheader>
                    );
                    groupedTasks.postponed.forEach((task) => {
                      items.push(
                        <MenuItem key={task.id} value={task.id} sx={{ pl: 3 }}>
                          {task.text}
                        </MenuItem>
                      );
                    });
                  }
                  
                  return items;
                })()}
              </Select>
            </FormControl>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Added: {new Date(todo.timestamp).toLocaleString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Status: {todo.completed ? 'Completed' : 'Active'}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Due: {formatDueDate(todo.dueDate || '')}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Blocked By: {getBlockingTaskText()}
          </Typography>

          <Button
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={() => onDelete(todo.id)}
            fullWidth
          >
            Remove Task
          </Button>
        </Box>
      )}
    </Drawer>
  );
};

export default TodoDetailsDrawer; 