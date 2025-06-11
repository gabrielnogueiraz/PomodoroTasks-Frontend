import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/pt-br';
import styles from './Calendar.module.css';
import { Task } from '../../services/taskService';
import { 
  CalendarEvent, 
  tasksToCalendarEvents, 
  getPriorityColor, 
  getStatusOpacity 
} from '../../utils/calendarUtils';

// Configurar moment para português brasileiro
moment.locale('pt-br');
const localizer = momentLocalizer(moment);

interface TaskCalendarProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onTaskEdit?: (task: Task) => void;
  onSlotSelect?: (slot: { start: Date; end: Date }) => void;
}

const TaskCalendar: React.FC<TaskCalendarProps> = ({
  tasks,
  onTaskSelect,
  onTaskEdit,
  onSlotSelect,
}) => {
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());  // Converter tarefas em eventos do calendário
  const events: CalendarEvent[] = useMemo(() => {
    return tasksToCalendarEvents(tasks);
  }, [tasks]);

  // Mensagens personalizadas em português
  const messages = {
    allDay: 'Dia todo',
    previous: '‹',
    next: '›',
    today: 'Hoje',
    month: 'Mês',
    week: 'Semana',
    day: 'Dia',
    agenda: 'Agenda',
    date: 'Data',
    time: 'Hora',
    event: 'Tarefa',
    noEventsInRange: 'Não há tarefas neste período.',
    showMore: (total: number) => `+${total} mais`,
  };
  // Estilização personalizada para os eventos
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const colors = getPriorityColor(event.priority);
    const opacity = getStatusOpacity(event.status);

    return {
      style: {
        backgroundColor: colors.background,
        borderColor: colors.border,
        border: `1px solid ${colors.border}`,
        opacity,
        color: '#ffffff',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '500',
        textDecoration: event.status === 'completed' ? 'line-through' : 'none',
      },
    };
  }, []);

  // Manipulador para seleção de eventos
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (onTaskSelect) {
      onTaskSelect(event.resource);
    }
  }, [onTaskSelect]);
  // Manipulador para seleção de slots vazios
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    if (onSlotSelect) {
      onSlotSelect(slotInfo);
    }
  }, [onSlotSelect]);

  // Componente customizado para o toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className={styles.calendarToolbar}>
      <div className={styles.toolbarNavigation}>
        <button
          className={styles.navButton}
          onClick={() => onNavigate('PREV')}
          title="Anterior"
        >
          ‹
        </button>
        <h2 className={styles.toolbarTitle}>{label}</h2>
        <button
          className={styles.navButton}
          onClick={() => onNavigate('NEXT')}
          title="Próximo"
        >
          ›
        </button>
      </div>
      
      <div className={styles.toolbarViews}>
        <button
          className={`${styles.viewButton} ${view === Views.MONTH ? styles.active : ''}`}
          onClick={() => onView(Views.MONTH)}
        >
          Mês
        </button>
        <button
          className={`${styles.viewButton} ${view === Views.WEEK ? styles.active : ''}`}
          onClick={() => onView(Views.WEEK)}
        >
          Semana
        </button>
        <button
          className={`${styles.viewButton} ${view === Views.DAY ? styles.active : ''}`}
          onClick={() => onView(Views.DAY)}
        >
          Dia
        </button>
        <button
          className={`${styles.viewButton} ${view === Views.AGENDA ? styles.active : ''}`}
          onClick={() => onView(Views.AGENDA)}
        >
          Agenda
        </button>
      </div>
      
      <button
        className={styles.todayButton}
        onClick={() => onNavigate('TODAY')}
      >
        Hoje
      </button>
    </div>
  );

  return (
    <div className={styles.calendarContainer}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        date={date}
        onView={setView}
        onNavigate={setDate}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        popup
        eventPropGetter={eventStyleGetter}
        messages={messages}
        components={{
          toolbar: CustomToolbar,
        }}
        style={{ height: 'calc(100vh - 12rem)' }}
        dayPropGetter={(date) => ({
          style: {
            backgroundColor: 'transparent',
          },
        })}
        slotPropGetter={() => ({
          style: {
            backgroundColor: 'transparent',
          },
        })}
      />
      
      {/* Legenda de prioridades */}
      <div className={styles.calendarLegend}>
        <div className={styles.legendTitle}>Prioridades:</div>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.lowPriority}`}></div>
            <span>Baixa</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.mediumPriority}`}></div>
            <span>Média</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.highPriority}`}></div>
            <span>Alta</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar;
