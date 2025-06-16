import { useState, useEffect, useCallback } from 'react';
import goalService, { Goal } from '../services/goalService';
import analyticsService, { AnalyticsData } from '../services/analyticsService';
import streakService, { StreakData } from '../services/streakService';

interface UseGoalsReturn {
  goals: Goal[];
  analytics: AnalyticsData | null;
  streak: StreakData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createGoal: (goalData: any) => Promise<Goal>;
  updateGoal: (goalId: string, updateData: any) => Promise<Goal>;
  deleteGoal: (goalId: string) => Promise<void>;
  activeGoals: Goal[];
  completedGoals: Goal[];
}

export const useGoals = (): UseGoalsReturn => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [goalsData, analyticsData, streakData] = await Promise.all([
        goalService.getGoals(),
        analyticsService.getAnalytics(365),
        streakService.getStreak()
      ]);

      setGoals(goalsData);
      setAnalytics(analyticsData);
      setStreak(streakData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Erro ao buscar dados das metas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createGoal = useCallback(async (goalData: any) => {
    try {
      const newGoal = await goalService.createGoal(goalData);
      setGoals(prev => [newGoal, ...prev]);
      return newGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar meta';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const updateGoal = useCallback(async (goalId: string, updateData: any) => {
    try {
      const updatedGoal = await goalService.updateGoal(goalId, updateData);
      setGoals(prev => prev.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ));
      return updatedGoal;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar meta';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteGoal = useCallback(async (goalId: string) => {
    try {
      await goalService.deleteGoal(goalId);
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar meta';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeGoals = goals.filter(goal => goal.status === 'active');
  const completedGoals = goals.filter(goal => goal.status === 'completed');

  return {
    goals,
    analytics,
    streak,
    loading,
    error,
    refresh: fetchData,
    createGoal,
    updateGoal,
    deleteGoal,
    activeGoals,
    completedGoals,
  };
};

export default useGoals;
