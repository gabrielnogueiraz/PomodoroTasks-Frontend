import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import taskService, { Task } from "../../services/taskService";
import pomodoroService, {
  Pomodoro,
  CreatePomodoroDTO,
} from "../../services/pomodoroService";

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activePomodoro, setActivePomodoro] = useState<Pomodoro | null>(null);
  const [time, setTime] = useState<number>(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    undefined
  );
  const [timerMode, setTimerMode] = useState<
    "pomodoro" | "shortBreak" | "longBreak"
  >("pomodoro");
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [customTime, setCustomTime] = useState<number>(25);
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const pendingTasks = await taskService.getTasks("pending");
        setTasks(pendingTasks);
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      }
    };

    fetchTasks();
  }, []);

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
    // Determinar o tempo total com base no modo atual
    let totalTime;
    if (timerMode === "pomodoro") {
      totalTime = customTime * 60;
    } else if (timerMode === "shortBreak") {
      totalTime = 5 * 60;
    } else {
      totalTime = 15 * 60;
    }

    // Calcular a porcentagem de progresso
    const progress = time / totalTime;

    // Circunferência do círculo (2 * PI * raio)
    const circumference = 2 * Math.PI * 45;

    // Retornar o offset com base no progresso
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

            const updatedTasks = await taskService.getTasks("pending");
            setTasks(updatedTasks);
          }
        }

        setActivePomodoro(null);

        if (timerMode === "pomodoro") {
          setTimerMode("shortBreak");
          setTime(5 * 60);
        } else if (timerMode === "shortBreak") {
          setTimerMode("pomodoro");
          setTime(25 * 60);
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

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleCreateTask = async () => {
    if (newTaskTitle.trim() === "") return;

    try {
      const newTask = await taskService.createTask({
        title: newTaskTitle,
        priority: taskPriority, // Usar a prioridade selecionada
        estimatedPomodoros: 1,
      });

      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      // Reset para médio após criar a tarefa
      setTaskPriority("medium");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await taskService.updateTaskStatus(taskId, "cancelled");

      setTasks(tasks.filter((task) => task.id !== taskId));

      if (taskId === selectedTaskId) {
        setSelectedTaskId(undefined);
      }
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      alert("Não foi possível excluir a tarefa. Por favor, tente novamente.");
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
    <div className={styles.dashboard}>
      <div className={styles.sidebar}>
        <div className={styles.logo}>
          <h1 className={styles.fadeIn}>Pomodoro Tasks</h1>
        </div>

        <div className={styles.taskCreator}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nova tarefa..."
              className={styles.taskInput}
              onKeyPress={(e) => e.key === "Enter" && handleCreateTask()}
            />
            <div className={styles.prioritySelector}>
              <button
                type="button"
                className={`${styles.priorityButton} ${
                  taskPriority === "low" ? styles.activePriority : ""
                }`}
                onClick={() => setTaskPriority("low")}
                title="Prioridade Baixa"
              >
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: "#388e3c" }}
                ></div>
              </button>
              <button
                type="button"
                className={`${styles.priorityButton} ${
                  taskPriority === "medium" ? styles.activePriority : ""
                }`}
                onClick={() => setTaskPriority("medium")}
                title="Prioridade Média"
              >
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: "#f57c00" }}
                ></div>
              </button>
              <button
                type="button"
                className={`${styles.priorityButton} ${
                  taskPriority === "high" ? styles.activePriority : ""
                }`}
                onClick={() => setTaskPriority("high")}
                title="Prioridade Alta"
              >
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: "#c62828" }}
                ></div>
              </button>
            </div>
          </div>
          <button onClick={handleCreateTask} className={styles.addTaskButton}>
            Adicionar
          </button>
        </div>

        <div className={styles.taskList}>
          <h2>Tarefas Pendentes</h2>
          {tasks.length === 0 ? (
            <p className={styles.emptyState}>Nenhuma tarefa pendente</p>
          ) : (
            <ul className={styles.fadeIn}>
              {tasks.map((task, index) => (
                <li
                  key={task.id}
                  className={`${styles.taskItem} ${
                    selectedTaskId === task.id ? styles.selectedTask : ""
                  } ${styles.slideIn}`}
                  onClick={() => handleTaskSelect(task.id)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={styles.taskHeader}>
                    <h3>{task.title}</h3>
                    <div className={styles.taskActions}>
                      <span
                        className={
                          styles[
                            `priority${
                              task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            }`
                          ]
                        }
                      >
                        {task.priority}
                      </span>
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        title="Excluir tarefa"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className={styles.taskProgress}>
                    <span>
                      {task.completedPomodoros}/{task.estimatedPomodoros}{" "}
                      pomodoros
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
              {/* Círculo de fundo (completo) */}
              <circle
                className={styles.timerCircleBackground}
                cx="50"
                cy="50"
                r="45"
              />
              {/* Círculo de progresso (diminui com o tempo) */}
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
