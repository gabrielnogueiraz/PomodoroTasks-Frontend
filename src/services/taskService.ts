import { api } from "./api";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  completedAt?: string;
  columnId?: string;
  position?: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  goalId?: string; // ID da meta associada
  boardId?: string; // ID do quadro associado (para quadros independentes)
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  estimatedPomodoros: number;
  columnId?: string;
  goalId?: string;
  boardId?: string; // Para quadros independentes
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: TaskStatus;
  completedPomodoros?: number;
}

export interface MoveTaskDTO {
  columnId: string;
  position: number;
}

// Função auxiliar para notificar outros componentes sobre mudanças nas tarefas
const notifyTaskChange = (eventType: string, detail: any) => {
  console.log(`taskService: Dispatching event ${eventType}`, detail);
  window.dispatchEvent(new CustomEvent(eventType, { detail }));
};

const taskService = {
  getTasks: async (status?: TaskStatus): Promise<Task[]> => {
    console.log("taskService: Getting all tasks", { status });
    const params = status ? { status } : undefined;
    const tasks = await api.get<Task[]>("/tasks", params);
    console.log(`taskService: Retrieved ${tasks.length} tasks`);
    return tasks;
  },

  getTaskById: async (id: string): Promise<Task> => {
    console.log(`taskService: Getting task by id: ${id}`);
    const task = await api.get<Task>(`/tasks/${id}`);
    return task;
  },

  createTask: async (taskData: CreateTaskDTO): Promise<Task> => {
    console.log("taskService: Creating new task", taskData);
    try {
      const newTask = await api.post<Task>("/tasks", taskData);
      
      // Notificar outros componentes sobre a nova tarefa
      notifyTaskChange('taskCreated', newTask);
      
      return newTask;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  updateTask: async (id: string, taskData: UpdateTaskDTO): Promise<Task> => {
    console.log(`taskService: Updating task ${id}`, taskData);
    try {
      const updatedTask = await api.put<Task>(`/tasks/${id}`, taskData);
      
      // Notificar outros componentes sobre a atualização
      notifyTaskChange('taskUpdated', updatedTask);
      
      return updatedTask;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  deleteTask: async (id: string): Promise<void> => {
    console.log(`taskService: Deleting task ${id}`);
    try {
      await api.delete<void>(`/tasks/${id}`);
      
      // Notificar outros componentes sobre a exclusão
      notifyTaskChange('taskDeleted', { taskId: id });
      
      return;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  deleteTaskAndPomodoros: async (taskId: string): Promise<void> => {
    console.log(`taskService: Marking task ${taskId} as cancelled with pomodoros`);
    try {
      await api.patch<void>(`/tasks/${taskId}/status`, { status: 'cancelled' });
      
      // Notificar outros componentes sobre a exclusão
      notifyTaskChange('taskDeleted', { taskId });
      
      return;
    } catch (error) {
      console.error("Error cancelling task:", error);
      throw error;
    }
  },

  updateTaskStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    console.log(`taskService: Updating task ${id} status to ${status}`);
    try {
      const updatedTask = await api.patch<Task>(`/tasks/${id}/status`, { status });
      
      // Notificar outros componentes sobre a atualização de status
      notifyTaskChange('taskUpdated', updatedTask);
      
      return updatedTask;
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  },

  // Novas funções para conclusão de tarefas
  completeTask: async (id: string): Promise<Task> => {
    console.log(`taskService: Completing task ${id}`);
    try {
      const updatedTask = await api.patch<Task>(`/tasks/${id}/complete`, {});
      
      // Notificar outros componentes sobre a conclusão
      notifyTaskChange('taskUpdated', updatedTask);
      
      return updatedTask;
    } catch (error) {
      console.error("Error completing task:", error);
      throw error;
    }
  },

  uncompleteTask: async (id: string): Promise<Task> => {
    console.log(`taskService: Uncompleting task ${id}`);
    try {
      const updatedTask = await api.patch<Task>(`/tasks/${id}/incomplete`, {});
      
      // Notificar outros componentes sobre a desmarcação de conclusão
      notifyTaskChange('taskUpdated', updatedTask);
      
      return updatedTask;
    } catch (error) {
      console.error("Error uncompleting task:", error);
      throw error;
    }
  },

  // Integração com sistema Kanban
  getTasksByColumn: async (columnId: string): Promise<Task[]> => {
    console.log(`taskService: Getting tasks by column ${columnId}`);
    try {
      const tasks = await api.get<Task[]>(`/tasks/column/${columnId}`);
      return tasks;
    } catch (error) {
      console.error("Error getting tasks by column:", error);
      throw error;
    }
  },

  moveTaskToColumn: async (taskId: string, columnId: string, position: number): Promise<Task> => {
    console.log(`taskService: Moving task ${taskId} to column ${columnId} at position ${position}`);
    try {
      // Chamar a API de mover tarefa
      const updatedTask = await api.put<Task>(`/kanban/tasks/${taskId}/move`, { columnId, position });
      
      // Notificar outros componentes sobre a movimentação
      notifyTaskChange('taskMoved', { taskId, columnId, position });
      notifyTaskChange('taskUpdated', { ...updatedTask, columnId });
      
      return updatedTask;
    } catch (error) {
      console.error("Error moving task:", error);
      throw error;
    }
  },
  
  // Nova função para obter tarefas associadas a uma meta específica
  getTasksByGoal: async (goalId: string): Promise<Task[]> => {
    console.log(`taskService: Getting tasks by goal ${goalId}`);
    try {
      const tasks = await api.get<Task[]>(`/tasks/goal/${goalId}`);
      return tasks;
    } catch (error) {
      console.error("Error getting tasks by goal:", error);
      throw error;
    }
  },
  
  // Nova função para obter tarefas associadas a um quadro específico
  getTasksByBoard: async (boardId: string): Promise<Task[]> => {
    console.log(`taskService: Getting tasks by board ${boardId}`);
    try {
      const tasks = await api.get<Task[]>(`/tasks/board/${boardId}`);
      return tasks;
    } catch (error) {
      console.error("Error getting tasks by board:", error);
      throw error;
    }
  },
  
  // Função para atualizar posição da tarefa dentro da coluna
  updateTaskPosition: async (taskId: string, position: number): Promise<Task> => {
    console.log(`taskService: Updating task ${taskId} position to ${position}`);
    try {
      const updatedTask = await api.patch<Task>(`/tasks/${taskId}/position`, { position });
      notifyTaskChange('taskUpdated', updatedTask);
      return updatedTask;
    } catch (error) {
      console.error("Error updating task position:", error);
      throw error;
    }
  }
};

export default taskService;
