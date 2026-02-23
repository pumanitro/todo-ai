import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, Divider, TextField, Button, Select, MenuItem, FormControl, InputLabel, ListSubheader, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { Delete, Close, Add } from '@mui/icons-material';
import { Todo, EisenhowerTag } from '../../types/todo';
import EisenhowerTagPicker from './EisenhowerTagPicker';

interface TaskFormDrawerProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  // Edit mode props
  todo?: Todo | null;
  todos?: Todo[];
  onSaveEdit?: (field: 'text' | 'description' | 'dueDate' | 'blockedBy' | 'eisenhowerTag', value: string) => void;
  onDelete?: (todoId: string) => void;
  // Add mode props
  onAddTodo?: (text: string, dueDate?: string, eisenhowerTag?: EisenhowerTag, description?: string) => void;
  // Common
  onClose: () => void;
}

const TaskFormDrawer: React.FC<TaskFormDrawerProps> = ({
  isOpen,
  mode,
  todo,
  todos = [],
  onSaveEdit,
  onDelete,
  onAddTodo,
  onClose,
}) => {
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedDueDate, setEditedDueDate] = useState('');
  const [editedBlockedBy, setEditedBlockedBy] = useState('');
  const [editedEisenhowerTag, setEditedEisenhowerTag] = useState<EisenhowerTag | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (mode === 'edit' && todo) {
      setEditedName(todo.text);
      setEditedDescription(todo.description || '');
      setEditedDueDate(todo.dueDate || '');
      setEditedBlockedBy(todo.blockedBy || '');
      setEditedEisenhowerTag(todo.eisenhowerTag || null);
    }
  }, [todo, mode]);

  const resetForm = () => {
    setEditedName('');
    setEditedDescription('');
    setEditedDueDate('');
    setEditedBlockedBy('');
    setEditedEisenhowerTag(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleAddSubmit = () => {
    if (editedName.trim() && onAddTodo) {
      onAddTodo(
        editedName.trim(),
        editedDueDate || undefined,
        editedEisenhowerTag || undefined,
        editedDescription.trim() || undefined,
      );
      resetForm();
      onClose();
    }
  };

  // Get available tasks for blocking grouped by category
  const getAvailableBlockingTasks = () => {
    if (!todo) return { today: [], backlog: [], postponed: [] };

    const availableTasks = todos.filter(t =>
      t.id !== todo.id &&
      !t.completed &&
      !t.blockedBy &&
      t.blockedBy !== todo.id
    );

    const sortFn = (a: Todo, b: Todo) => {
      if (a.order === b.order) return b.timestamp - a.timestamp;
      return a.order - b.order;
    };

    return {
      today: availableTasks.filter(t => t.category === 'today').sort(sortFn),
      backlog: availableTasks.filter(t => t.category === 'backlog').sort(sortFn),
      postponed: availableTasks.filter(t => t.category === 'postponed').sort(sortFn),
    };
  };

  const formatDueDate = (dueDate: string) => {
    if (!dueDate) return 'No due date';
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(dueDate);
    const todayDate = new Date(today);
    const diffDays = Math.ceil((due.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day(s)`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} day(s)`;
  };

  const getBlockingTaskText = () => {
    if (!editedBlockedBy) return 'None';
    const blockingTask = todos.find(t => t.id === editedBlockedBy);
    return blockingTask ? blockingTask.text : 'None';
  };

  const title = mode === 'add' ? 'Add New Task' : 'Task Details';
  const isEdit = mode === 'edit';

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={isOpen}
      onClose={handleClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? '100%' : 300,
          maxHeight: isMobile ? '90%' : 'auto',
          padding: 3,
          borderTopLeftRadius: isMobile ? 16 : 0,
          borderTopRightRadius: isMobile ? 16 : 0,
        },
      }}
    >
      {(mode === 'add' || todo) && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">{title}</Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {/* Form fields */}
          <Box sx={{ overflowY: 'auto', flex: 1, pt: 1 }}>
            <TextField
              fullWidth
              label="Task Name"
              variant="outlined"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => isEdit && onSaveEdit?.('text', editedName)}
              placeholder="What needs to be done?"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              minRows={2}
              maxRows={6}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={() => isEdit && onSaveEdit?.('description', editedDescription)}
              placeholder="Add a description for this task..."
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="date"
              label="Due Date"
              variant="outlined"
              value={editedDueDate}
              onChange={(e) => setEditedDueDate(e.target.value)}
              onBlur={() => isEdit && onSaveEdit?.('dueDate', editedDueDate)}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            {/* Blocked By - edit mode only */}
            {isEdit && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Blocked By</InputLabel>
                <Select
                  value={editedBlockedBy}
                  label="Blocked By"
                  onChange={(e) => {
                    setEditedBlockedBy(e.target.value);
                    onSaveEdit?.('blockedBy', e.target.value);
                  }}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {(() => {
                    const groupedTasks = getAvailableBlockingTasks();
                    const items: React.ReactNode[] = [];

                    if (groupedTasks.today.length > 0) {
                      items.push(
                        <ListSubheader key="today-header" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          TODAY
                        </ListSubheader>
                      );
                      groupedTasks.today.forEach((task) => {
                        items.push(<MenuItem key={task.id} value={task.id} sx={{ pl: 3 }}>{task.text}</MenuItem>);
                      });
                    }
                    if (groupedTasks.backlog.length > 0) {
                      items.push(
                        <ListSubheader key="backlog-header" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                          BACKLOG
                        </ListSubheader>
                      );
                      groupedTasks.backlog.forEach((task) => {
                        items.push(<MenuItem key={task.id} value={task.id} sx={{ pl: 3 }}>{task.text}</MenuItem>);
                      });
                    }
                    if (groupedTasks.postponed.length > 0) {
                      items.push(
                        <ListSubheader key="postponed-header" sx={{ fontWeight: 600, color: 'warning.main' }}>
                          POSTPONED
                        </ListSubheader>
                      );
                      groupedTasks.postponed.forEach((task) => {
                        items.push(<MenuItem key={task.id} value={task.id} sx={{ pl: 3 }}>{task.text}</MenuItem>);
                      });
                    }
                    return items;
                  })()}
                </Select>
              </FormControl>
            )}

            {/* Eisenhower Tag Picker */}
            <Box sx={{ mb: 2 }}>
              <EisenhowerTagPicker
                value={editedEisenhowerTag}
                onChange={(tag) => {
                  setEditedEisenhowerTag(tag);
                  if (isEdit) onSaveEdit?.('eisenhowerTag', tag || '');
                }}
              />
            </Box>
          </Box>

          {/* Footer */}
          {mode === 'add' && (
            <Button
              variant="contained"
              onClick={handleAddSubmit}
              disabled={!editedName.trim()}
              startIcon={<Add />}
              fullWidth
              sx={{ mt: 1 }}
            >
              Add Task
            </Button>
          )}

          {isEdit && todo && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Added: {new Date(todo.timestamp).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Status: {todo.completed ? 'Completed' : 'Active'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                Due: {formatDueDate(todo.dueDate || '')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Blocked By: {getBlockingTaskText()}
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<Delete />}
                onClick={() => onDelete?.(todo.id)}
                fullWidth
              >
                Remove Task
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default TaskFormDrawer;
