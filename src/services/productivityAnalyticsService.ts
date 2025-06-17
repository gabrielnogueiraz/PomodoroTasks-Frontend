import { api } from "./api";

export interface ProductivityInsights {
  mostProductiveHours: Array<{
    hour: number;
    productivity: number;
  }>;
  mostProductiveDays: Array<{
    day: number;
    productivity: number;
  }>;
  averageFocusTime: number;
  tasksCompletionRate: number;
  goalProgressRate: number;
  recommendations: string[];
}

export interface TaskCompletionRecord {
  taskId: string;
  completedAt?: string;
  timeSpent?: number;
  productivityScore?: number;
}

export interface PomodoroSessionRecord {
  duration: number;
  startTime: string;
  endTime: string;
  taskId?: string;
  wasCompleted: boolean;
}

export interface GoalProgressRecord {
  goalId: string;
  progressValue: number;
  recordedAt?: string;
}

export const productivityAnalyticsService = {
  getInsights: async (days: number = 30): Promise<{ insights: ProductivityInsights }> => {
    return api.get<{ insights: ProductivityInsights }>(`/productivity-analytics/insights?days=${days}`);
  },

  recordTaskCompletion: async (data: TaskCompletionRecord): Promise<void> => {
    return api.post<void>('/productivity-analytics/record/task-completion', data);
  },

  recordPomodoroSession: async (data: PomodoroSessionRecord): Promise<void> => {
    return api.post<void>('/productivity-analytics/record/pomodoro-session', data);
  },

  recordGoalProgress: async (data: GoalProgressRecord): Promise<void> => {
    return api.post<void>('/productivity-analytics/record/goal-progress', data);
  },
};

export default productivityAnalyticsService;
