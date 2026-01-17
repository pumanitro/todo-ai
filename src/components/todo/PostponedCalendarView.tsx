import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { Todo } from '../../types/todo';

interface PostponedCalendarViewProps {
  todos: Todo[];
  onTodoClick: (todo: Todo) => void;
}

const PostponedCalendarView: React.FC<PostponedCalendarViewProps> = ({
  todos,
  onTodoClick,
}) => {
  // Convert todos to FullCalendar events (exclude blocked tasks - they're shown separately)
  const events = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    return todos
      .filter(todo => todo.dueDate && !todo.blockedBy)
      .map(todo => {
        const isPast = todo.dueDate! < todayStr;
        return {
          id: todo.id,
          title: todo.text,
          date: todo.dueDate,
          backgroundColor: isPast ? '#ed6c02' : '#1976d2',
          borderColor: isPast ? '#e65100' : '#1565c0',
          textColor: '#ffffff',
          extendedProps: { todo },
        };
      });
  }, [todos]);

  // Blocked subtasks (tasks that are blocked by another task)
  const blockedTasks = useMemo(() => {
    return todos.filter(todo => todo.blockedBy);
  }, [todos]);

  const handleEventClick = (info: EventClickArg) => {
    const todo = info.event.extendedProps.todo as Todo;
    onTodoClick(todo);
  };

  return (
    <Box sx={{ mt: 1, pl: 2 }}>
      <Box
        sx={{
          '& .fc': {
            fontFamily: 'inherit',
          },
          '& .fc-toolbar': {
            marginBottom: '0.5em !important',
            flexWrap: 'wrap',
            gap: '0.5em',
          },
          '& .fc-toolbar-title': {
            fontSize: '0.85rem !important',
            fontWeight: 600,
          },
          '& .fc-button': {
            padding: '0.25em 0.5em !important',
            fontSize: '0.85rem !important',
            textTransform: 'capitalize',
          },
          '& .fc-button-primary': {
            backgroundColor: '#1976d2 !important',
            borderColor: '#1976d2 !important',
          },
          '& .fc-button-primary:not(:disabled):active, & .fc-button-primary:not(:disabled).fc-button-active': {
            backgroundColor: '#1565c0 !important',
            borderColor: '#1565c0 !important',
          },
          '& .fc-daygrid-day': {
            minHeight: '60px',
          },
          '& .fc-daygrid-day-number': {
            fontSize: '0.8rem',
            padding: '4px 6px',
          },
          '& .fc-daygrid-day.fc-day-today': {
            backgroundColor: 'rgba(25, 118, 210, 0.08) !important',
          },
          '& .fc-daygrid-day.fc-day-today .fc-daygrid-day-number': {
            backgroundColor: '#1976d2',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .fc-day-sat, & .fc-day-sun': {
            '& .fc-daygrid-day-number': {
              color: '#d32f2f',
            },
          },
          '& .fc-col-header-cell': {
            padding: '8px 0',
          },
          '& .fc-col-header-cell-cushion': {
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
          },
          '& .fc-day-sat .fc-col-header-cell-cushion, & .fc-day-sun .fc-col-header-cell-cushion': {
            color: '#d32f2f',
          },
          '& .fc-daygrid-event': {
            fontSize: '0.7rem !important',
            padding: '1px 3px !important',
            borderRadius: '2px !important',
            cursor: 'pointer',
            marginBottom: '1px !important',
          },
          '& .fc-daygrid-event-dot': {
            display: 'none',
          },
          '& .fc-event-title': {
            fontWeight: 400,
            overflow: 'hidden',
            textOverflow: 'clip',
          },
          '& .fc-daygrid-more-link': {
            fontSize: '0.65rem',
            fontWeight: 500,
            color: '#666',
          },
          '& .fc-day-other': {
            opacity: 0.4,
          },
          '& .fc-scrollgrid': {
            borderColor: 'rgba(0,0,0,0.12) !important',
          },
          '& .fc-scrollgrid td, & .fc-scrollgrid th': {
            borderColor: 'rgba(0,0,0,0.12) !important',
          },
          '& .fc-theme-standard .fc-scrollgrid': {
            border: 'none',
          },
          '& .fc-header-toolbar .fc-toolbar-chunk': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={handleEventClick}
          headerToolbar={{
            left: 'title',
            center: '',
            right: 'prev,next',
          }}
          dayMaxEvents={3}
          moreLinkClick="popover"
          firstDay={1}
          fixedWeekCount={false}
          height="auto"
          eventDisplay="block"
        />
      </Box>

      {/* Blocked Subtasks Section */}
      {blockedTasks.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography 
            sx={{ 
              fontWeight: 600, 
              color: 'text.secondary',
              mb: 0.75,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              fontSize: '0.65rem'
            }}
          >
            Blocked ({blockedTasks.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {blockedTasks.map(task => (
              <Box
                key={task.id}
                onClick={() => onTodoClick(task)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  backgroundColor: '#9e9e9e',
                  color: 'white',
                  px: 0.75,
                  py: 0.25,
                  fontSize: '0.7rem',
                  '&:hover': {
                    backgroundColor: '#757575',
                  }
                }}
              >
                {task.text}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PostponedCalendarView;
