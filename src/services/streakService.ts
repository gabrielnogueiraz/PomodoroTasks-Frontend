import { api } from "./api";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  isActiveToday: boolean;
  lastActiveDate: string | null;
}

export const streakService = {
  getStreak: async (): Promise<StreakData> => {
    return api.get<StreakData>("/streak/stats");
  },

  updateStreak: async (): Promise<StreakData> => {
    return api.post<StreakData>("/streak/update");
  },
};

export default streakService;
