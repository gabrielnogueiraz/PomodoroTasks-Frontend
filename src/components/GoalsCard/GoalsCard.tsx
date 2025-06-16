import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { format, eachDayOfInterval, startOfYear, endOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Flame, Target, Plus, Calendar } from "lucide-react";
import { Goal } from "../../services/goalService";
import { DailyStats } from "../../services/analyticsService";
import { StreakData } from "../../services/streakService";
import useGoals from "../../hooks/useGoals";
import CreateGoalModal from "../CreateGoalModal/CreateGoalModal";
import styles from "./GoalsCard.module.css";

const GoalsCard: React.FC = () => {
  const { goals, analytics, streak, loading, error, activeGoals, createGoal } = useGoals();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeGoals.length > 0 && !selectedGoal) {
      setSelectedGoal(activeGoals[0]);
    }
  }, [activeGoals, selectedGoal]);

  const getPieChartData = () => {
    if (!selectedGoal) return [];
    
    const completed = selectedGoal.currentValue;
    const remaining = Math.max(0, selectedGoal.targetValue - completed);
    
    return [
      { name: 'Completadas', value: completed, color: '#9c27b0' },
      { name: 'Pendentes', value: remaining, color: '#e1bee7' }
    ];
  };
  const getHeatmapData = () => {
    if (!analytics?.dailyStats) return [];
    
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });
    
    return allDays.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const dayStats = analytics.dailyStats.find((stat: DailyStats) => 
        format(new Date(stat.date), 'yyyy-MM-dd') === dayString
      );
      
      return {
        date: dayString,
        count: dayStats?.tasksCompleted || 0,
        intensity: getIntensity(dayStats?.tasksCompleted || 0)
      };
    });
  };

  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  const getWeekData = () => {
    const heatmapData = getHeatmapData();
    const weeks = [];
    
    for (let i = 0; i < heatmapData.length; i += 7) {
      weeks.push(heatmapData.slice(i, i + 7));
    }
    
    return weeks;
  };

  const handleCreateGoal = async (goalData: any) => {
    try {
      await createGoal(goalData);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar meta:', error);
    }
  };

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  if (loading) {
    return (
      <div className={styles.goalsCard}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.goalsCard}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <Target className={styles.icon} size={20} />
          <h3 className={styles.title}>Metas</h3>
        </div>        <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
        </button>
      </div>

      {selectedGoal && (        <div className={styles.goalSelector}>
          <select
            value={selectedGoal.id}
            onChange={(e) => {
              const goal = activeGoals.find(g => g.id === e.target.value);
              setSelectedGoal(goal || null);
            }}
            className={styles.goalSelect}
          >
            {activeGoals.map(goal => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedGoal ? (
        <>
          <div className={styles.progressSection}>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={getPieChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {getPieChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className={styles.chartCenter}>
                <span className={styles.progressValue}>
                  {selectedGoal.currentValue}
                </span>
                <span className={styles.progressTotal}>
                  /{selectedGoal.targetValue}
                </span>
              </div>
            </div>
            <div className={styles.progressInfo}>
              <p className={styles.goalTitle}>{selectedGoal.title}</p>
              <p className={styles.goalType}>
                Meta {selectedGoal.type === 'daily' ? 'Diária' : 
                      selectedGoal.type === 'weekly' ? 'Semanal' : 
                      selectedGoal.type === 'monthly' ? 'Mensal' : 'Anual'}
              </p>
            </div>
          </div>          <div className={styles.heatmapSection}>
            <div className={styles.heatmapContainer}>
              <div className={styles.heatmapHeader}>
                <div className={styles.monthLabels}>
                  {months.map(month => (
                    <span key={month} className={styles.monthLabel}>
                      {month}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.heatmap}>
                {getWeekData().map((week, weekIndex) => (
                  <div key={weekIndex} className={styles.week}>
                    {week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`${styles.day} ${styles[`intensity${day.intensity}`]}`}
                        title={`${format(new Date(day.date), 'dd/MM/yyyy', { locale: ptBR })}: ${day.count} tarefas`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.heatmapLegend}>
              <span className={styles.legendText}>Menos</span>
              <div className={styles.legendScale}>
                {[0, 1, 2, 3, 4].map(intensity => (
                  <div
                    key={intensity}
                    className={`${styles.legendSquare} ${styles[`intensity${intensity}`]}`}
                  />
                ))}
              </div>
              <span className={styles.legendText}>Mais</span>
            </div>
          </div>

          {streak && (
            <div className={styles.streakSection}>
              <div className={styles.streakIcon}>
                <Flame size={20} />
              </div>
              <div className={styles.streakInfo}>
                <span className={styles.streakCount}>{streak.currentStreak}</span>
                <span className={styles.streakLabel}>dias de sequência</span>
              </div>
              <div className={styles.streakStats}>
                <span className={styles.streakRecord}>
                  Recorde: {streak.longestStreak}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noGoals}>
          <Calendar className={styles.noGoalsIcon} size={32} />          <p className={styles.noGoalsText}>Nenhuma meta ativa</p>
          <button 
            className={styles.createGoalButton}
            onClick={() => setIsModalOpen(true)}
          >
            Criar primeira meta
          </button>
        </div>
      )}

      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateGoal}
      />
    </div>
  );
};

export default GoalsCard;
