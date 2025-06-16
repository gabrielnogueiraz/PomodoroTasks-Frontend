import { api } from "./api";

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: "daily" | "weekly" | "monthly" | "yearly";
  category: "tasks_completed" | "pomodoros_completed" | "focus_time" | "productivity_score";
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "expired";
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  type: "daily" | "weekly" | "monthly" | "yearly";
  category: "tasks_completed" | "pomodoros_completed" | "focus_time" | "productivity_score";
  targetValue: number;
  startDate: string;
  endDate: string;
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  targetValue?: number;
  endDate?: string;
}

export const goalService = {
  getGoals: async (): Promise<Goal[]> => {
    return api.get<Goal[]>("/goals");
  },

  createGoal: async (goalData: CreateGoalDTO): Promise<Goal> => {
    return api.post<Goal>("/goals", goalData);
  },

  updateGoal: async (goalId: string, updateData: UpdateGoalDTO): Promise<Goal> => {
    return api.put<Goal>(`/goals/${goalId}`, updateData);
  },

  deleteGoal: async (goalId: string): Promise<void> => {
    return api.delete<void>(`/goals/${goalId}`);
  },

  getGoalById: async (goalId: string): Promise<Goal> => {
    return api.get<Goal>(`/goals/${goalId}`);
  },
};

export default goalService;
