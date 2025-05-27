import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import taskService from "../../services/taskService";
import pomodoroService, {
  Pomodoro,
  CreatePomodoroDTO,
} from "../../services/pomodoroService";
import { useTaskContext } from "../../hooks/TaskProvider";
import PlantTimer from "../../components/PlantTimer/PlantTimer";
import { Timer, Sprout, Play, Pause, RotateCcw } from "lucide-react";

const Dashboard: React.FC = () => {
  const { tasks, selectedTaskId, refreshTasks } = useTaskContext();

  const [activePomodoro, setActivePomodoro] = useState<Pomodoro | null>(null);
  const [time, setTime] = useState<number>(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<
    "pomodoro" | "shortBreak" | "longBreak"
  >("pomodoro");
  const [customTime, setCustomTime] = useState<number>(25);
  const [viewMode, setViewMode] = useState<"timer" | "plant">("timer");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      handleTimerComplete();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateProgress = (): number => {
    let totalTime;
    if (timerMode === "pomodoro") {
      totalTime = customTime * 60;
    } else if (timerMode === "shortBreak") {
      totalTime = 5 * 60;
    } else {
      totalTime = 15 * 60;
    }

    const progress = (totalTime - time) / totalTime;
    return Math.max(0, Math.min(1, progress));
  };

  const getStrokeDashoffset = (): number => {
    const circumference = 2 * Math.PI * 100; 
    const progress = calculateProgress();
    return circumference * (1 - progress);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerMode === "pomodoro") {
      setTime(customTime * 60);
    } else if (timerMode === "shortBreak") {
      setTime(5 * 60);
    } else {
      setTime(15 * 60);
    }
    if (activePomodoro) {
      setActivePomodoro(null);
    }
  };

  const handleStartTimer = async () => {
    if (activePomodoro) {
      setIsRunning(true);
      return;
    }

    try {
      const pomodoroData: CreatePomodoroDTO = {
        duration: time,
        taskId: selectedTaskId,
      };

      const newPomodoro = await pomodoroService.createPomodoro(pomodoroData);
      const startedPomodoro = await pomodoroService.startPomodoro(
        newPomodoro.id
      );

      setActivePomodoro(startedPomodoro);
      setIsRunning(true);
    } catch (error) {
      console.error("Erro ao iniciar pomodoro:", error);
    }
  };

  const handlePauseTimer = async () => {
    if (activePomodoro) {
      try {
        await pomodoroService.interruptPomodoro(activePomodoro.id);
        setIsRunning(false);
        setActivePomodoro(null);
      } catch (error) {
        console.error("Erro ao interromper pomodoro:", error);
      }
    } else {
      setIsRunning(false);
    }
  };

  const handleTimerComplete = async () => {
    if (activePomodoro) {
      try {
        await pomodoroService.completePomodoro(activePomodoro.id);

        if (selectedTaskId) {
          const task = tasks.find((t) => t.id === selectedTaskId);
          if (task) {
            await taskService.updateTask(selectedTaskId, {
              completedPomodoros: task.completedPomodoros + 1,
            });

            // Atualizar a lista de tarefas após completar um pomodoro
            await refreshTasks();
          }
        }

        setActivePomodoro(null);

        if (timerMode === "pomodoro") {
          setTimerMode("shortBreak");
          setTime(5 * 60);
        } else if (timerMode === "shortBreak") {
          setTimerMode("pomodoro");
          setTime(customTime * 60);
        }
      } catch (error) {
        console.error("Erro ao completar pomodoro:", error);
      }
    }

    setIsRunning(false);
  };

  const handleSelectTimerMode = (
    mode: "pomodoro" | "shortBreak" | "longBreak"
  ) => {
    if (isRunning) return;

    setTimerMode(mode);

    if (mode === "pomodoro") {
      setTime(customTime * 60);
    } else if (mode === "shortBreak") {
      setTime(5 * 60);
    } else if (mode === "longBreak") {
      setTime(15 * 60);
    }
  };

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setCustomTime(value);

      if (timerMode === "pomodoro" && !isRunning) {
        setTime(value * 60);
      }
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.backgroundGradient}>
        <div className={styles.backgroundBlob1}></div>
        <div className={styles.backgroundBlob2}></div>
      </div>

      <main className={styles.mainContent}>
        <div className={`${styles.timerSection} ${styles.fadeIn}`}>
          {/* Header com controles de modo */}
          <div className={styles.header}>
            <div className={styles.timerModes}>
              <button
                className={`${styles.modeButton} ${
                  timerMode === "pomodoro" ? styles.activeMode : ""
                }`}
                onClick={() => handleSelectTimerMode("pomodoro")}
              >
                <div className={styles.modeIndicator}></div>
                Focus
              </button>
              <button
                className={`${styles.modeButton} ${
                  timerMode === "shortBreak" ? styles.activeMode : ""
                }`}
                onClick={() => handleSelectTimerMode("shortBreak")}
              >
                <div className={styles.modeIndicator}></div>
                Short Break
              </button>
              <button
                className={`${styles.modeButton} ${
                  timerMode === "longBreak" ? styles.activeMode : ""
                }`}
                onClick={() => handleSelectTimerMode("longBreak")}
              >
                <div className={styles.modeIndicator}></div>
                Long Break
              </button>
            </div>

            {/* Toggle entre Timer e Planta */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleButton} ${
                  viewMode === "timer" ? styles.active : ""
                }`}
                onClick={() => setViewMode("timer")}
              >
                <Timer size={16} />
              </button>
              <button
                className={`${styles.toggleButton} ${
                  viewMode === "plant" ? styles.active : ""
                }`}
                onClick={() => setViewMode("plant")}
              >
                <Sprout size={16} />
              </button>
            </div>
          </div>

          {/* Timer Circle */}
          <div className={styles.timerContainer}>
            <div className={styles.timerCircle}>
              <svg className={styles.progressRing} viewBox="0 0 200 200">
                <circle
                  className={styles.progressBackground}
                  cx="100"
                  cy="100"
                  r="100"
                />
                <circle
                  className={`${styles.progressBar} ${
                    isRunning ? styles.animated : ""
                  }`}
                  cx="100"
                  cy="100"
                  r="100"
                  style={{
                    strokeDashoffset: getStrokeDashoffset(),
                  }}
                />
              </svg>

              <div className={styles.timerContent}>
                {viewMode === "timer" ? (
                  <div className={styles.timerDisplay}>
                    <div className={styles.timeText}>{formatTime(time)}</div>
                    {selectedTaskId && (
                      <div className={styles.taskName}>
                        {tasks.find((t) => t.id === selectedTaskId)?.title}
                      </div>
                    )}
                  </div>
                ) : (
                  <PlantTimer
                    progress={calculateProgress()}
                    isActive={isRunning}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Custom time control */}
          {timerMode === "pomodoro" && !isRunning && (
            <div className={styles.customTimeControl}>
              <label htmlFor="customTime" className={styles.timeLabel}>
                Duration (minutes)
              </label>
              <div className={styles.timeInputWrapper}>
                <input
                  id="customTime"
                  type="number"
                  min="1"
                  max="60"
                  value={customTime}
                  onChange={handleCustomTimeChange}
                  className={styles.customTimeInput}
                />
              </div>
            </div>
          )}

          {/* Controls */}
          <div className={styles.controls}>
            <button
              className={styles.resetButton}
              onClick={resetTimer}
              disabled={
                !isRunning &&
                time ===
                  (timerMode === "pomodoro"
                    ? customTime * 60
                    : timerMode === "shortBreak"
                    ? 5 * 60
                    : 15 * 60)
              }
            >
              <RotateCcw size={20} />
            </button>

            {!isRunning ? (
              <button className={styles.playButton} onClick={handleStartTimer}>
                <Play size={24} />
                Start
              </button>
            ) : (
              <button className={styles.pauseButton} onClick={handlePauseTimer}>
                <Pause size={24} />
                Pause
              </button>
            )}

            <div className={styles.spacer}></div>
          </div>

          {/* Session info */}
          <div className={styles.sessionInfo}>
            {selectedTaskId ? (
              <div className={styles.selectedTask}>
                <span>Working on:</span>
                <strong>
                  {tasks.find((t) => t.id === selectedTaskId)?.title}
                </strong>
              </div>
            ) : (
              <div className={styles.noTask}>
                <span>No task selected</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
