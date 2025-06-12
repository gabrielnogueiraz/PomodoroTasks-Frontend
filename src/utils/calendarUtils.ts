import { Task } from '../services/taskService';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

/**
 * Converte uma tarefa em um evento do calendário
 */
export const taskToCalendarEvent = (task: Task): CalendarEvent | null => {
  // Calcular data de início
  let startDate: Date;
  if (task.startDate) {
    startDate = new Date(`${task.startDate}${task.startTime ? `T${task.startTime}` : 'T09:00'}`);
  } else {
    // Se não há startDate, usar a data atual
    const now = new Date();
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
  }
  
  // Calcular data de fim
  let endDate: Date;
  if (task.endDate) {
    endDate = new Date(`${task.endDate}${task.endTime ? `T${task.endTime}` : 'T10:00'}`);
  } else {
    // Se não há endDate, usar 1 hora depois do início
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  return {
    id: task.id,
    title: task.title,
    start: startDate,
    end: endDate,
    resource: task,
    priority: task.priority,
    status: task.status,
  };
};

/**
 * Converte múltiplas tarefas em eventos do calendário
 */
export const tasksToCalendarEvents = (tasks: Task[]): CalendarEvent[] => {
  console.log('calendarUtils: Convertendo', tasks.length, 'tarefas em eventos');
  
  const events = tasks
    .filter(task => {
      // Mostrar todas as tarefas exceto as canceladas
      // Incluir tarefas concluídas para manter histórico visual
      return task.status !== 'cancelled';
    })
    .map(task => {
      // Se a tarefa não tem datas definidas, usar data atual para que apareça no calendário
      if (!task.startDate && !task.endDate) {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0); // 9h da manhã
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0); // 10h da manhã
        
        return {
          id: task.id,
          title: task.title,
          start: startOfDay,
          end: endOfDay,
          resource: task,
          priority: task.priority,
          status: task.status,
        };
      }
      
      return taskToCalendarEvent(task);
    })
    .filter((event): event is CalendarEvent => event !== null);

  console.log('calendarUtils: Total de eventos gerados:', events.length);
  return events;
};

/**
 * Formata uma data para o formato esperado pelo input date
 */
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formata uma data para o formato esperado pelo input time
 */
export const formatTimeForInput = (date: Date): string => {
  return date.toTimeString().split(' ')[0].substring(0, 5);
};

/**
 * Converte um slot selecionado em dados para criar uma nova tarefa
 */
export const slotToTaskData = (slot: { start: Date; end: Date }) => {
  return {
    startDate: formatDateForInput(slot.start),
    startTime: formatTimeForInput(slot.start),
    endDate: formatDateForInput(slot.end),
    endTime: formatTimeForInput(slot.end),
  };
};

/**
 * Obtém a cor de uma prioridade
 */
export const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
  switch (priority) {
    case 'high':
      return { background: '#ef4444', border: '#dc2626' };
    case 'medium':
      return { background: '#f97316', border: '#ea580c' };
    case 'low':
      return { background: '#22c55e', border: '#16a34a' };
    default:
      return { background: '#6b7280', border: '#6b7280' };
  }
};

/**
 * Obtém a opacidade baseada no status da tarefa
 */
export const getStatusOpacity = (status: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
  return status === 'completed' ? 0.6 : 0.9;
};
