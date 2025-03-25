import React from "react";
import { useState } from "react";
import { useDrop } from "react-dnd";
import styles from "../../pages/Tasks/Tasks.module.css";
import { Task } from "../../services/taskService";
import TaskCard from "../TaskCard/TaskCard";

interface ColumnProps {
  column: {
    id: string;
    title: string;
    taskIds: string[];
  };
  tasks: (Task & { columnId: string })[];
  moveTask: (taskId: string, fromColumnId: string, toColumnId: string) => void;
  onAddTask: (columnId: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDeleteTask: (taskId: string, e: React.MouseEvent) => void;
}

interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

interface TaskItem extends Task {
  columnId: string;
}

const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  moveTask,
  onAddTask,
  onRenameColumn,
  onDeleteColumn,
  onDeleteTask,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const ref = React.useRef<HTMLDivElement>(null);

  const [, connectDrop] = useDrop(() => ({
    accept: "TASK",
    drop: (item: { id: string; columnId: string }) => {
      if (item.columnId !== column.id) {
        moveTask(item.id, item.columnId, column.id);
      }
    },
  }));

  connectDrop(ref);

  const handleRename = () => {
    onRenameColumn(column.id, title);
    setIsEditing(false);
  };

  return (
    <div className={styles.column} ref={ref}>
      <div className={styles.columnHeader}>
        {isEditing ? (
          <div className={styles.editHeader}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.editInput}
              autoFocus
            />
            <button onClick={handleRename} className={styles.saveButton}>
              ✓
            </button>
          </div>
        ) : (
          <>
            <h2 onClick={() => setIsEditing(true)}>{column.title}</h2>
            <div className={styles.columnActions}>
              <button
                onClick={() => onAddTask(column.id)}
                className={styles.columnButton}
                title="Adicionar tarefa"
              >
                +
              </button>
              <button
                onClick={() => onDeleteColumn(column.id)}
                className={styles.columnButton}
                title="Excluir coluna"
              >
                ×
              </button>
            </div>
          </>
        )}
      </div>

      <div className={styles.taskList}>
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            moveTask={moveTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
        {tasks.length === 0 && (
          <p className={styles.emptyState}>Nenhuma tarefa</p>
        )}
      </div>
    </div>
  );
};

export default Column;
