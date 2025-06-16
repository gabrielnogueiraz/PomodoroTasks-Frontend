import React, { useState, useEffect } from "react";
import styles from "./Dashboard.module.css";
import taskService from "../../services/taskService";
import pomodoroService, {
  Pomodoro,
  CreatePomodoroDTO,
} from "../../services/pomodoroService";
import { priorityToFlowerType, flowerService } from "../../services/flowerService";
import { useTaskContext } from "../../hooks/TaskProvider";
import PlantTimer from "../../components/PlantTimer/PlantTimer";
import GardenModal from "../../components/GardenModal/GardenModal";
import FlowerCreationAnimation from "../../components/FlowerCreationAnimation/FlowerCreationAnimation";
import { Timer, Sprout, Play, Pause, RotateCcw, Flower } from "lucide-react";

const Dashboard: React.FC = () => {
  const { tasks, selectedTaskId, refreshTasks } = useTaskContext();

  const [activePomodoro, setActivePomodoro] = useState<Pomodoro | null>(null);
  const [time, setTime] = useState<number>(25 * 60); // 25 minutos em segundos
  const [isRunning, setIsRunning] = useState<boolean>(false);  const [timerMode, setTimerMode] = useState<
    "pomodoro" | "shortBreak" | "longBreak"
  >("pomodoro");  const [customTime, setCustomTime] = useState<number>(25);
  const [viewMode, setViewMode] = useState<"timer" | "plant">("timer");
  const [isGardenModalOpen, setIsGardenModalOpen] = useState<boolean>(false);
  const [flowerAnimation, setFlowerAnimation] = useState<{
    show: boolean;
    type: "green" | "orange" | "red" | "purple";
    isRare: boolean;
  }>({ show: false, type: "green", isRare: false });

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
    const circumference = 2 * Math.PI * 100; // 628.32
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
  };  const handleTimerComplete = async () => {
    if (activePomodoro && timerMode === "pomodoro") {
      try {
        console.log("🎯 Iniciando conclusão do pomodoro:", activePomodoro.id);
        
        // Completar pomodoro no backend
        await pomodoroService.completePomodoro(activePomodoro.id);
        console.log("✅ Pomodoro completado no backend");

        // Atualizar contadores da tarefa se houver uma selecionada
        if (selectedTaskId) {
          const task = tasks.find((t) => t.id === selectedTaskId);
          if (task) {
            console.log("🔄 Atualizando tarefa:", task.title);            // Definir o tipo de flor com base na prioridade da tarefa
            const flowerType = priorityToFlowerType(task.priority);
            
            // Verificar se a tarefa é válida (não cancelada)
            if (task.status !== "cancelled") {
              // Atualizar contadores da tarefa
              try {
                const updatedTask = await taskService.updateTask(selectedTaskId, {
                  completedPomodoros: task.completedPomodoros + 1,
                });
                console.log("✅ Tarefa atualizada com sucesso:", updatedTask.title);
                
                // Criar flor no backend apenas se a atualização foi bem sucedida
                const flowerData = {
                  type: flowerType,
                  taskId: selectedTaskId, // Usamos taskId em vez de taskName
                  completionTime: activePomodoro.duration || customTime * 60,
                };
                
                console.log("🌸 Criando flor no backend:", flowerData);
                
                try {
                  const createdFlower = await flowerService.createFlower(flowerData);
                  console.log("✅ Flor criada com sucesso no backend:", createdFlower);
                } catch (flowerError) {
                  console.error("❌ Erro ao criar flor no backend:", flowerError);
                  // Continuar mesmo se falhar a criação da flor
                }
              } catch (updateError) {
                console.error("❌ Erro ao atualizar tarefa:", updateError);
              }
            } else {
              console.warn("⚠️ Não é possível criar uma flor para uma tarefa cancelada");
            }

            // Mostrar animação de flor baseada na prioridade
            setFlowerAnimation({
              show: true,
              type: flowerType.toLowerCase() as "green" | "orange" | "red" | "purple",
              isRare: false, // Por enquanto, sem lógica de flores raras
            });

            // Atualizar a lista de tarefas após completar um pomodoro
            await refreshTasks();
          }
        }

        setActivePomodoro(null);

        // Transição para break
        setTimerMode("shortBreak");
        setTime(5 * 60);
        
      } catch (error) {
        console.error("Erro ao completar pomodoro:", error);
      }
    } else if (timerMode === "shortBreak") {
      setTimerMode("pomodoro");
      setTime(customTime * 60);
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
            </div>            {/* Toggle entre Timer e Planta */}
            <div className={styles.controlsSection}>
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
              
              {/* Botão do Jardim */}
              <button
                className={styles.gardenButton}
                onClick={() => setIsGardenModalOpen(true)}
                title="Ver meu jardim virtual"
              >
                <Flower size={20} />
              </button>
            </div>
          </div>          {/* Timer Circle */}
          <div className={styles.timerContainer}>
            <div className={styles.timerCircle}>
              <svg className={styles.progressRing} viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9c27b0" />
                    <stop offset="50%" stopColor="#ab47bc" />
                    <stop offset="100%" stopColor="#ba68c8" />
                  </linearGradient>
                </defs>
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
                  </div>                ) : (
                  <PlantTimer
                    progress={calculateProgress()}
                    isActive={isRunning}
                    priority={
                      selectedTaskId
                        ? tasks.find((t) => t.id === selectedTaskId)?.priority?.toLowerCase() as "low" | "medium" | "high"
                        : "low"
                    }
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
          </div>          {/* Session info */}
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
        </div>      </main>

      {/* Animação de Criação de Flor */}
      <FlowerCreationAnimation
        isVisible={flowerAnimation.show}
        flowerType={flowerAnimation.type}
        isRare={flowerAnimation.isRare}
        onComplete={() => setFlowerAnimation({ show: false, type: "green", isRare: false })}
      />

      {/* Garden Modal */}
      <GardenModal
        isOpen={isGardenModalOpen}
        onClose={() => setIsGardenModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
