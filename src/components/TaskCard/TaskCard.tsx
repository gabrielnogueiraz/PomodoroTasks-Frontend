import React from "react";
import styles from "../../pages/Tasks/Tasks.module.css";
import { Task } from "../../services/taskService";
import { useDrag } from "react-dnd";

interface TaskItem extends Task {
  columnId: string;
}

interface TaskCardProps {
  task: TaskItem;
  moveTask: (taskId: string, fromColumn: string, toColumn: string) => Promise<void>;
  onDeleteTask: (taskId: string, e: React.MouseEvent) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, moveTask, onDeleteTask }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDragging }, connectDrag] = useDrag({
    type: "TASK",
    item: { id: task.id, columnId: task.columnId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const priorityClass = `priority${
    task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
  }`;

  connectDrag(ref);

  return (
    <div
      ref={ref}
      className={`${styles.taskCard} ${isDragging ? styles.dragging : ""}`}
    >
      <div className={styles.taskHeader}>
        <h3>{task.title}</h3>
        <div className={styles.taskActions}>
          <span className={styles[priorityClass]}>{task.priority}</span>
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
      <div className={styles.taskFooter}>
        <span>
          {task.completedPomodoros}/{task.estimatedPomodoros} pomodoros
        </span>
      </div>
    </div>
  );
};

export default TaskCard;