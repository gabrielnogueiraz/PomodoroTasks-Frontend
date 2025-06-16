import { api } from "./api";

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  pomodorosCompleted: number;
  focusTimeMinutes: number;
  productivityScore: number;
}

export interface WeeklyAverage {
  tasksCompleted: number;
  pomodorosCompleted: number;
  focusTime: number;
  productivityScore: number;
}

export interface MostProductiveHour {
  hour: number;
  avgTasksCompleted: number;
  avgPomodorosCompleted: number;
}

export interface BestPerformanceDay {
  date: string;
  tasksCompleted: number;
  pomodorosCompleted: number;
  focusTimeMinutes: number;
  productivityScore: number;
}

export interface AnalyticsData {
  dailyStats: DailyStats[];
  weeklyAverage: WeeklyAverage;
  mostProductiveHours: MostProductiveHour[];
  bestPerformanceDays: BestPerformanceDay[];
}

export const analyticsService = {
  getAnalytics: async (days: number = 30): Promise<AnalyticsData> => {
    return api.get<AnalyticsData>("/analytics", { days: days.toString() });
  },

  updateDailyPerformance: async (date?: string): Promise<void> => {
    return api.post<void>("/analytics/daily", { 
      date: date || new Date().toISOString() 
    });
  },
};

export default analyticsService;
