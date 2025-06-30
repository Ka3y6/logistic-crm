import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Paper, CircularProgress, Typography } from '@mui/material';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getCalendarTasks, deleteCalendarTask } from '../../api/calendar';
import DateEventsDialog from './DateEventsDialog';
import CalendarTaskForm from './CalendarTaskForm';
import RenderDescription from './RenderDescription';
import './CalendarView.css';
import { useAuth } from '../../contexts/AuthContext';

// --- Обновленные Стили для Календаря --- 
const calendarStyles = {
  calendar: {
    height: 'calc(100% - 32px)',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'inherit',
  },
  eventWrapper: {
  },
  header: {
    backgroundColor: '#f5f5f5',
    padding: '10px 0',
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottom: '1px solid #e0e0e0',
    borderLeft: '1px solid #e0e0e0',
    '&:first-of-type': {
      borderLeft: 'none',
    },
  },
  dayCell: {
    borderRight: '1px solid #eee',
    '&:last-child': {
      borderRight: 'none',
    },
    '&.rbc-off-range-bg': {
        backgroundColor: '#f9f9f9',
    },
    '&.rbc-today': {
        backgroundColor: '#e3f2fd',
    }
  }
};
// --- Конец Стили для Календаря ---

moment.locale('ru');
const localizer = momentLocalizer(moment);

// Helper для цвета приоритета
const getPriorityCalendarColor = (priority) => {
  switch (priority) {
    case 'high': return '#ef5350'; // Красный (светлее)
    case 'medium': return '#9575cd'; // Светло-фиолетовый (замена оранжевому)
    case 'low': return '#66bb6a'; // Зеленый (светлее)
    default: return '#607d8b'; // Нейтральный серый (без изменений)
  }
};

// Helper для числового значения приоритета
const getPriorityValue = (priorityString) => {
  switch (priorityString) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

const CalendarView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateEventsDialogOpen, setDateEventsDialogOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [dateForNewTask, setDateForNewTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Получаем задачи только для текущего пользователя
      const tasksData = await getCalendarTasks(user.id);
      
      const formattedTasks = tasksData.results ? tasksData.results.map(task => ({
        id: task.id,
        title: task.title,
        start: new Date(task.deadline),
        end: new Date(task.deadline),
        apiDeadline: task.deadline,
        allDay: true,
        type: 'task',
        priority: task.priority,
        description: task.description,
        order: task.order
      })) : [];

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectEventOrSlot = (slotOrEvent) => {
    const date = slotOrEvent.start || slotOrEvent;
    setSelectedDate(date);
    setDateEventsDialogOpen(true);
  };

  const handleDateEventsDialogClose = () => {
    setDateEventsDialogOpen(false);
    setSelectedDate(null);
  };

  const handleAddTaskClick = (date) => {
    setDateEventsDialogOpen(false);
    setEditingTask(null);
    setDateForNewTask(date);
    setTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setTaskFormOpen(false);
    setDateForNewTask(null);
    setEditingTask(null);
  };

  const handleTaskCreated = () => {
    fetchData();
    setEditingTask(null);
  };

  const handleDeleteTask = async (task) => {
    try {
      await deleteCalendarTask(task.id);
      fetchData();
      setDateEventsDialogOpen(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTaskClick = (task) => {
    setDateEventsDialogOpen(false);
    setEditingTask(task);
    setDateForNewTask(null);
    setTaskFormOpen(true);
  };

  const minTime = new Date();
  minTime.setHours(8, 0, 0);
  const maxTime = new Date();
  maxTime.setHours(18, 0, 0);

  // Мемоизированная обработка задач для отображения в ячейках
  const processedTasksByDate = useMemo(() => {
    const map = new Map();
    tasks.forEach(task => {
      const dateKey = moment(task.start).format('YYYY-MM-DD');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey).push(task);
    });

    const result = {};
    for (const [dateKey, tasksOnDate] of map.entries()) {
      if (tasksOnDate.length > 0) {
        // Сортируем по приоритету (убывание), затем можно по ID или времени для стабильности
        const sortedTasks = [...tasksOnDate].sort((a, b) => {
          const priorityDiff = getPriorityValue(b.priority) - getPriorityValue(a.priority);
          if (priorityDiff !== 0) return priorityDiff;
          return a.id - b.id; // Пример вторичной сортировки
        });
        
        const mainTask = sortedTasks[0];
        result[dateKey] = {
          mainTaskTitle: mainTask.title,
          cellColor: getPriorityCalendarColor(mainTask.priority),
          otherEventsCount: sortedTasks.length - 1,
        };
      }
    }
    return result;
  }, [tasks]);

  // Кастомный компонент для обертки ячейки даты в месяце
  const CustomDateCellWrapper = ({ children, value }) => {
    const dateKey = moment(value).format('YYYY-MM-DD');
    const dayData = processedTasksByDate[dateKey];

    let InnerContent = null;

    if (dayData) {
      InnerContent = (
        <Box // Это будет наша "карточка" с фоном и тенью
          sx={{
            backgroundColor: dayData.cellColor,
            borderRadius: '4px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
            width: 'calc(100% - 4px)',
            height: 'calc(100% - 4px)',
            margin: '2px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingBottom: '2px',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', color: 'white', textAlignLast: 'center' }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'inline',
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                fontSize: '0.75rem',
                lineHeight: '1.2',
                maxWidth: 'calc(100% - 20px)'
              }}
              title={dayData.mainTaskTitle}
            >
              {dayData.mainTaskTitle}
            </Typography>
            {dayData.otherEventsCount > 0 && (
              <Typography 
                component="sup"
                variant="caption" 
                sx={{ 
                  fontSize: '0.6rem',
                  lineHeight: '1',
                  marginLeft: '1px',
                  position: 'relative',
                  top: '-0.4em'
                }}
              >
                +{dayData.otherEventsCount}
              </Typography>
            )}
          </Box>
        </Box>
      );
    }

    // children это обычно <div class="rbc-day-bg">...</div>
    // Мы клонируем его, чтобы добавить наш InnerContent и класс для стилизации текста даты
    if (React.isValidElement(children)) {
      const newClassName = dayData ? `${children.props.className || ''} rbc-day-bg-custom-filled` : children.props.className;
      // Убираем backgroundColor, borderRadius, boxShadow из стилей самого .rbc-day-bg
      // position: relative на .rbc-day-bg нужен, чтобы InnerContent мог быть вставлен правильно
      const originalDayBgChildren = children.props.children; // Обычно это .rbc-date-cell
      
      return React.cloneElement(children, {
        style: { ...children.props.style, position: 'relative' }, // Убрали кастомные стили фона отсюда
        className: newClassName,
        children: (
          <>
            {/* Сначала рендерим оригинальное содержимое (номер даты), потом нашу карточку, если есть */}
            {originalDayBgChildren}
            {InnerContent && (
              <Box sx={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'flex-end' }}>
                {InnerContent}
              </Box>
            )}
          </>
        )
      });
    }
    return children;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '600px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%' }}>
      <Paper sx={{ pt: 1, pb: 1, pl: 2, pr: 2, overflow: 'hidden', width: '100%', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <Calendar
          localizer={localizer}
          events={[]}
          startAccessor="start"
          endAccessor="end"
          style={calendarStyles.calendar}
          onSelectEvent={handleSelectEventOrSlot}
          onSelectSlot={handleSelectEventOrSlot}
          selectable
          defaultView="month"
          views={['month', 'week', 'day', 'agenda']}
          toolbar={true}
          min={minTime}
          max={maxTime}
          formats={{
            dateFormat: 'DD',
            monthHeaderFormat: (date, culture, local) => 
              local.format(date, 'MMMM YYYY', culture).replace(/^./, match => match.toUpperCase()),
            dayHeaderFormat: (date, culture, local) => 
              local.format(date, 'dddd, DD.MM', culture),
            weekdayFormat: (date, culture, local) =>
              local.format(date, 'ddd', culture).replace(/^./, match => match.toUpperCase()),
            agendaHeaderFormat: ({ start, end }) => 
               `${moment(start).format('DD.MM.YYYY')} - ${moment(end).format('DD.MM.YYYY')}`,
            dayRangeHeaderFormat: ({ start, end }, culture, local) =>
              `${local.format(start, 'DD MMMM', culture)} - ${local.format(end, moment(start).isSame(end, 'month') ? 'DD MMMM' : 'DD MMMM', culture)}` 
          }}
          messages={{
            next: 'Следующий',
            previous: 'Предыдущий',
            today: 'Сегодня',
            month: 'Месяц',
            week: 'Неделя',
            day: 'День',
            agenda: 'Повестка дня',
            date: 'Дата',
            time: 'Время',
            event: 'Задача',
            noEventsInRange: 'Нет задач в выбранном диапазоне',
          }}
          components={{
            month: {
              dateCellWrapper: CustomDateCellWrapper,
            },
          }}
          dayPropGetter={(date) => {
            const dayOfWeek = moment(date).day();
            let className = 'custom-day-cell';
            const newStyles = { ...calendarStyles.dayCell };

            if (dayOfWeek === 0 || dayOfWeek === 6) {
              className += ' rbc-weekend-day';
            }
            
            return {
              className: className,
              style: newStyles
            };
          }}
          slotPropGetter={(date) => ({
            className: 'custom-slot'
          })}
          eventWrapperComponent={(props) => (
              <Box 
                className="custom-event-wrapper" 
                style={props.style}
                sx={calendarStyles.eventWrapper}
              >
                  {props.children}
              </Box>
          )}
        />
      </Paper>

      {selectedDate && (
        <DateEventsDialog
          open={dateEventsDialogOpen}
          onClose={handleDateEventsDialogClose}
          date={selectedDate}
          tasks={tasks}
          onDeleteTask={handleDeleteTask}
          onAddTask={handleAddTaskClick}
          onEditTask={handleEditTaskClick}
        />
      )}

      <CalendarTaskForm
        open={taskFormOpen}
        onClose={handleTaskFormClose}
        onTaskCreated={handleTaskCreated}
        initialDate={dateForNewTask}
        taskToEdit={editingTask}
        userId={editingTask?.assignee?.id || user.id}
      />
    </Box>
  );
};

export default CalendarView; 