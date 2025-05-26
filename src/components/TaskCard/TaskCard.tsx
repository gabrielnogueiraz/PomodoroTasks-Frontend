import React from "react";
import styles from "../../pages/Tasks/Tasks.module.css";
import { Task } from "../../services/taskService";
import { useDrag } from "react-dnd";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface TaskItem extends Task {
  columnId: string;
}

interface TaskCardProps {
  task: TaskItem;
  moveTask: (taskId: string, fromColumn: string, toColumn: string) => Promise<void>;
  onDeleteTask: (taskId: string, e: React.MouseEvent) => void;
  onCompleteTask?: (taskId: string, e: React.MouseEvent) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, moveTask, onDeleteTask, onCompleteTask }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, connectDrag] = useDrag({
    type: "TASK",
    item: { id: task.id, columnId: task.columnId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  const priorityClass = `priority${
    task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'
  }`;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    return timeStr;
  };

  const isCompleted = task.status === "completed";

  connectDrag(ref);
  return (
    <div
      ref={ref}
      className={`${styles.taskCard} ${isDragging ? styles.dragging : ""} ${
        isCompleted ? styles.completedTask : ""
      }`}
    >
      <div className={styles.taskHeader}>
        <h3>{task.title}</h3>
        <div className={styles.taskActions}>
          <span className={styles[priorityClass]}>{task.priority}</span>
          {onCompleteTask && (
            <button
              className={styles.completeButton}
              onClick={(e) => onCompleteTask(task.id, e)}
              title={isCompleted ? "Desmarcar como concluída" : "Marcar como concluída"}
            >
              {isCompleted ? (
                <CheckCircleIcon style={{ color: "#4caf50" }} />
              ) : (
                <RadioButtonUncheckedIcon />
              )}
            </button>
          )}
          <button
            className={styles.deleteButton}
            onClick={(e) => onDeleteTask(task.id, e)}
            title="Excluir tarefa"
          >
            ×
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className={styles.taskDescription}>{task.description}</p>
      )}

      {/* Informações de data e horário */}
      {(task.startDate || task.endDate || task.startTime || task.endTime) && (
        <div className={styles.taskSchedule}>
          {task.startDate && (
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Início:</span>
              <span className={styles.scheduleValue}>
                {formatDate(task.startDate)}
                {task.startTime && ` às ${formatTime(task.startTime)}`}
              </span>
            </div>
          )}
          {task.endDate && (
            <div className={styles.scheduleItem}>
              <span className={styles.scheduleLabel}>Término:</span>
              <span className={styles.scheduleValue}>
                {formatDate(task.endDate)}
                {task.endTime && ` às ${formatTime(task.endTime)}`}
              </span>
            </div>
          )}
        </div>
      )}

      {task.completedAt && (
        <div className={styles.completedInfo}>
          <span>Concluída em: {formatDate(task.completedAt)}</span>
        </div>
      )}

      <div className={styles.taskFooter}>
        <span>
          {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
        </span>
      </div>
    </div>
  );
};

export default TaskCard;