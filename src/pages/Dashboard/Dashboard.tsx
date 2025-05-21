import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import taskService from "../../services/taskService";
import pomodoroService, {
  Pomodoro,
  CreatePomodoroDTO,
} from "../../services/pomodoroService";
import { useTaskContext } from "../../hooks/TaskProvider";

const Dashboard: React.FC = () => {
  const { tasks, selectedTaskId, refreshTasks } = useTaskContext();

  const [activePomodoro, setActivePomodoro] = useState<Pomodoro | null>(null);
  const [time, setTime] = useState<number>(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<
    "pomodoro" | "shortBreak" | "longBreak"
  >("pomodoro");
  const [customTime, setCustomTime] = useState<number>(25);

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

    const progress = time / totalTime;
    const circumference = 2 * Math.PI * 45;
    return circumference * (1 - progress);
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
      <main className={styles.mainContent}>
        <div className={`${styles.timerSection} ${styles.fadeIn}`}>
          <div className={styles.timerModes}>
            <button
              className={`${styles.modeButton} ${
                timerMode === "pomodoro" ? styles.activeMode : ""
              }`}
              onClick={() => handleSelectTimerMode("pomodoro")}
            >
              Pomodoro
            </button>
            <button
              className={`${styles.modeButton} ${
                timerMode === "shortBreak" ? styles.activeMode : ""
              }`}
              onClick={() => handleSelectTimerMode("shortBreak")}
            >
              Pausa Curta
            </button>
            <button
              className={`${styles.modeButton} ${
                timerMode === "longBreak" ? styles.activeMode : ""
              }`}
              onClick={() => handleSelectTimerMode("longBreak")}
            >
              Pausa Longa
            </button>
          </div>

          <div className={styles.timerCircleContainer}>
            <div className={styles.timerDisplay}>
              <span className={styles.timeText}>{formatTime(time)}</span>
              {selectedTaskId && (
                <span className={styles.taskName}>
                  {tasks.find((t) => t.id === selectedTaskId)?.title}
                </span>
              )}
            </div>
            <svg className={styles.timerCircle} viewBox="0 0 100 100">
              <circle
                className={styles.timerCircleBackground}
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className={styles.timerCircleProgress}
                cx="50"
                cy="50"
                r="45"
                style={{
                  strokeDashoffset: calculateProgress(),
                }}
              />
            </svg>
          </div>

          {timerMode === "pomodoro" && !isRunning && (
            <div className={styles.customTimeControl}>
              <label htmlFor="customTime">Tempo (min): </label>
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
          )}

          <div className={styles.timerControls}>
            {!isRunning ? (
              <button className={styles.startButton} onClick={handleStartTimer}>
                Iniciar
              </button>
            ) : (
              <button className={styles.pauseButton} onClick={handlePauseTimer}>
                Pausar
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
