import React, { useState, useEffect, useCallback } from "react";
import styles from "./TaskSideMenu.module.css";
import { Task } from "../../services/taskService";
import CloseIcon from "@mui/icons-material/Close";
import { useRealtimeSync } from "../../hooks/useRealtimeSync";

interface TaskSideMenuProps {
  tasks: Task[];
  selectedTaskId: string | undefined;
  onTaskSelect: (taskId: string) => void;
  onCreateTask: (
    title: string,
    priority: "low" | "medium" | "high"
  ) => Promise<void>;
  onDeleteTask: (taskId: string, e: React.MouseEvent) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

const TaskSideMenu: React.FC<TaskSideMenuProps> = ({
  tasks,
  selectedTaskId,
  onTaskSelect,
  onCreateTask,
  onDeleteTask,
  isOpen,
  onClose,
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Usar hook de sincronização para atualizar em tempo real
  const { dispatchTaskEvent } = useRealtimeSync({
    onTaskCreated: (task) => {
      console.log("TaskSideMenu: Task created event received", task);
      setLocalTasks((prevTasks) => {
        // Verificar se a tarefa já existe na lista
        if (!prevTasks.some((t) => t.id === task.id)) {
          return [task, ...prevTasks];
        }
        return prevTasks;
      });
    },
    onTaskUpdated: (task) => {
      console.log("TaskSideMenu: Task updated event received", task);
      setLocalTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === task.id ? { ...t, ...task } : t))
      );
    },
    onTaskDeleted: (taskId) => {
      console.log("TaskSideMenu: Task deleted event received", taskId);
      setLocalTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    },
    onTasksRefreshed: (refreshedTasks) => {
      console.log(
        "TaskSideMenu: Tasks refreshed event received",
        refreshedTasks?.length
      );
      if (refreshedTasks && Array.isArray(refreshedTasks)) {
        setLocalTasks(refreshedTasks);
      }
    },
  });

  // Atualizar localTasks sempre que tasks mudar
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const handleCreateTask = async () => {
    if (newTaskTitle.trim() === "") return;

    try {
      await onCreateTask(newTaskTitle, taskPriority);
      setNewTaskTitle("");
      setTaskPriority("medium");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Erro ao criar tarefa. Tente novamente.");
    }
  };

  const handlePrioritySelect = (
    priority: "low" | "medium" | "high",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskPriority(priority);
  };

  const handleTaskSelect = useCallback(
    (taskId: string) => {
      onTaskSelect(taskId);
      // Em dispositivos móveis, fechar o menu após selecionar uma tarefa
      if (window.innerWidth < 768) {
        onClose();
      }
    },
    [onTaskSelect, onClose]
  );

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarVisible : ""}`}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Tarefas</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <CloseIcon />
          </button>
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
                onClick={(e) => handlePrioritySelect("low", e)}
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
                onClick={(e) => handlePrioritySelect("medium", e)}
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
                onClick={(e) => handlePrioritySelect("high", e)}
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
        </div>{" "}
        <div className={styles.taskList}>
          <h2>Minhas Tarefas</h2>
          {localTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                Nenhuma tarefa encontrada. Adicione tarefas aqui ou no{" "}
                <a href="/tasks" className={styles.taskBoardLink}>
                  Quadro de Tarefas
                </a>
              </p>
            </div>
          ) : (
            <ul>
              {localTasks
                .filter(
                  (task) =>
                    task &&
                    task.id &&
                    task.title &&
                    task.status !== "cancelled" // Filtrar tarefas válidas
                )
                .sort((a, b) => {
                  // Ordenar por prioridade e data de criação
                  const priorityOrder = { high: 0, medium: 1, low: 2 };
                  const priorityDiff =
                    priorityOrder[a.priority || "medium"] -
                    priorityOrder[b.priority || "medium"];

                  if (priorityDiff !== 0) return priorityDiff;

                  // Se mesma prioridade, ordenar por data de criação (mais recente primeiro)
                  return (
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                  );
                })
                .map((task, index) => (
                  <li
                    id={`task-${task.id}`}
                    key={task.id}
                    className={`${styles.taskItem} ${
                      selectedTaskId === task.id ? styles.selectedTask : ""
                    } ${
                      styles[
                        `status-${(task.status || "pending").replace("_", "-")}`
                      ]
                    }`}
                    onClick={() => handleTaskSelect(task.id)}
                    style={{ "--index": index } as React.CSSProperties}
                  >
                    {" "}
                    <div className={styles.taskHeader}>
                      <h3>{task.title || "Tarefa sem título"}</h3>
                      <div className={styles.taskActions}>
                        <span className={styles.statusBadge}>
                          {(task.status || "pending") === "pending" && "⏳"}
                          {(task.status || "pending") === "in_progress" && "🔥"}
                          {(task.status || "pending") === "completed" && "✅"}
                        </span>
                        <span
                          className={
                            styles[
                              `priority${
                                (task.priority || "medium")
                                  .charAt(0)
                                  .toUpperCase() +
                                (task.priority || "medium").slice(1)
                              }`
                            ]
                          }
                        >
                          {task.priority || "medium"}
                        </span>
                        <button
                          className={styles.deleteButton}
                          onClick={(e) => onDeleteTask(task.id, e)}
                          title="Excluir tarefa"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className={styles.taskProgress}>
                      <span>
                        {task.completedPomodoros || 0}/
                        {task.estimatedPomodoros || 1} pomodoros
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
};

export default TaskSideMenu;
