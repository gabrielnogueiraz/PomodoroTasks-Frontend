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
  // Só converte tarefas que têm pelo menos uma data definida
  if (!task.startDate && !task.endDate) {
    return null;
  }

  // Calcular data de início
  const startDate = task.startDate 
    ? new Date(`${task.startDate}${task.startTime ? `T${task.startTime}` : 'T00:00'}`)
    : new Date();
  
  // Calcular data de fim
  const endDate = task.endDate 
    ? new Date(`${task.endDate}${task.endTime ? `T${task.endTime}` : 'T23:59'}`)
    : new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hora depois se não tiver data final

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
  return tasks
    .filter(task => task.status !== 'cancelled') // Não mostrar tarefas canceladas
    .map(taskToCalendarEvent)
    .filter((event): event is CalendarEvent => event !== null);
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
