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
  createdAt: string;
  updatedAt: string;
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
}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {
  status?: TaskStatus;
  completedPomodoros?: number;
}

const taskService = {
  getTasks: async (status?: TaskStatus): Promise<Task[]> => {
    const params = status ? { status } : undefined;
    return api.get<Task[]>("/tasks", params);
  },

  getTaskById: async (id: string): Promise<Task> => {
    return api.get<Task>(`/tasks/${id}`);
  },

  createTask: async (taskData: CreateTaskDTO): Promise<Task> => {
    return api.post<Task>("/tasks", taskData);
  },

  updateTask: async (id: string, taskData: UpdateTaskDTO): Promise<Task> => {
    return api.put<Task>(`/tasks/${id}`, taskData);
  },

  deleteTask: async (id: string): Promise<void> => {
    return api.delete<void>(`/tasks/${id}`);
  },

  deleteTaskAndPomodoros: async (taskId: string): Promise<void> => {
    return api.patch<void>(`/tasks/${taskId}/status`, { status: 'cancelled' });
  },

  updateTaskStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    return api.patch<Task>(`/tasks/${id}/status`, { status });
  },
  // Novas funções para conclusão de tarefas
  completeTask: async (id: string): Promise<Task> => {
    return api.patch<Task>(`/tasks/${id}/complete`, {});
  },

  uncompleteTask: async (id: string): Promise<Task> => {
    return api.patch<Task>(`/tasks/${id}/incomplete`, {});
  },
};

export default taskService;
