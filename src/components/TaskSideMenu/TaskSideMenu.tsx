import React, { useState } from "react";
import styles from "./TaskSideMenu.module.css";
import { Task } from "../../services/taskService";
import CloseIcon from "@mui/icons-material/Close";

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

  const handleCreateTask = async () => {
    if (newTaskTitle.trim() === "") return;

    await onCreateTask(newTaskTitle, taskPriority);
    setNewTaskTitle("");
    setTaskPriority("medium");
  };

  const handlePrioritySelect = (
    priority: "low" | "medium" | "high",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setTaskPriority(priority);
  };

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarVisible : ""}`}
      >
        <button className={styles.closeButton} onClick={onClose}>
          <CloseIcon />
        </button>

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
        </div>

        <div className={styles.taskList}>
          <h2>Tarefas Pendentes</h2>
          {tasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                Nenhuma tarefa pendente. Adicione tarefas aqui ou no{" "}
                <a href="/tasks" className={styles.taskBoardLink}>
                  Quadro de Tarefas
                </a>
              </p>
            </div>
          ) : (
            <ul>
              {tasks.map((task, index) => (
                <li
                  id={`task-${task.id}`}
                  key={task.id}
                  className={`${styles.taskItem} ${
                    selectedTaskId === task.id ? styles.selectedTask : ""
                  }`}
                  onClick={() => onTaskSelect(task.id)}
                  style={{ "--index": index } as React.CSSProperties}
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
                        onClick={(e) => onDeleteTask(task.id, e)}
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
      </aside>
    </>
  );
};

export default TaskSideMenu;
