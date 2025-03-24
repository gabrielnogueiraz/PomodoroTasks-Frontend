import { api } from "./api";

export type PomodoroStatus = "in_progress" | "completed" | "interrupted";

export interface Pomodoro {
  id: string;
  duration: number;
  startTime?: string;
  endTime?: string;
  status: PomodoroStatus;
  notes?: string;
  taskId?: string;
  createdAt: string;
}

export interface CreatePomodoroDTO {
  duration?: number; // em segundos
  taskId?: string;
}

const pomodoroService = {
  getPomodoros: async (): Promise<Pomodoro[]> => {
    return api.get<Pomodoro[]>("/pomodoros");
  },

  getTaskPomodoros: async (taskId: string): Promise<Pomodoro[]> => {
    return api.get<Pomodoro[]>("/pomodoros", { taskId });
  },

  getPomodoroById: async (id: string): Promise<Pomodoro> => {
    return api.get<Pomodoro>(`/pomodoros/${id}`);
  },

  createPomodoro: async (
    pomodoroData: CreatePomodoroDTO
  ): Promise<Pomodoro> => {
    return api.post<Pomodoro>("/pomodoros", pomodoroData);
  },

  startPomodoro: async (id: string): Promise<Pomodoro> => {
    return api.post<Pomodoro>(`/pomodoros/${id}/start`);
  },

  completePomodoro: async (id: string): Promise<Pomodoro> => {
    return api.post<Pomodoro>(`/pomodoros/${id}/complete`);
  },

  interruptPomodoro: async (id: string): Promise<Pomodoro> => {
    return api.post<Pomodoro>(`/pomodoros/${id}/interrupt`);
  },

  addNotes: async (id: string, notes: string): Promise<Pomodoro> => {
    return api.post<Pomodoro>(`/pomodoros/${id}/notes`, { notes });
  },
};

export default pomodoroService;
