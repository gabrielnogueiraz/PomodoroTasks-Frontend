import React, { useState, useEffect } from "react";
import styles from "./Tasks.module.css";
import taskService, { Task } from "../../services/taskService";
import TaskFormModal from "../../components/TaskFormModal/TaskFormModal";
import Column from "../../components/Column/Column";

interface ColumnType {
  id: string;
  title: string;
  taskIds: string[];
}

interface TaskItem extends Task {
  columnId: string;
}

const Tasks: React.FC = () => {
  const [columns, setColumns] = useState<ColumnType[]>([
    { id: "col-1", title: "A fazer", taskIds: [] },
    { id: "col-2", title: "Em progresso", taskIds: [] },
    { id: "col-3", title: "Concluído", taskIds: [] },
  ]);

  const [tasks, setTasks] = useState<Record<string, TaskItem>>({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  useEffect(() => {
    const duplicatesMap = new Map();

    columns.forEach((column) => {
      column.taskIds.forEach((taskId) => {
        if (!duplicatesMap.has(taskId)) {
          duplicatesMap.set(taskId, [column.id]);
        } else {
          duplicatesMap.get(taskId).push(column.id);
        }
      });
    });

    const duplicates = Array.from(duplicatesMap.entries()).filter(
      ([_, columns]) => columns.length > 1
    );

    if (duplicates.length > 0) {
      console.warn("Tarefas duplicadas detectadas:", duplicates);
      console.warn(
        "Colunas:",
        columns.map((c) => ({ id: c.id, taskIds: c.taskIds }))
      );
    }
  }, [columns]);

  const removeTaskDuplicates = () => {
    const taskToColumn = new Map();

    const updatedColumns = columns.map((column) => {
      const uniqueTaskIds = column.taskIds.filter((taskId) => {
        if (taskToColumn.has(taskId)) {
          return false;
        }
        taskToColumn.set(taskId, column.id);
        return true;
      });

      return {
        ...column,
        taskIds: uniqueTaskIds,
      };
    });

    setColumns(updatedColumns);
  };

  useEffect(() => {
    if (Object.keys(tasks).length > 0) {
      removeTaskDuplicates();
    }
  }, [tasks]);

  useEffect(() => {
    const seen = new Set<string>();
    let hasDuplicates = false;

    const updatedColumns = columns.map((column) => {
      const uniqueTaskIds = column.taskIds.filter((taskId) => {
        if (seen.has(taskId)) {
          hasDuplicates = true;
          return false;
        }
        seen.add(taskId);
        return true;
      });

      return {
        ...column,
        taskIds: uniqueTaskIds,
      };
    });

    if (hasDuplicates) {
      console.warn("Removendo tarefas duplicadas");
      setColumns(updatedColumns);
    }
  }, [columns]);

  const moveTask = (
    taskId: string,
    fromColumnId: string,
    toColumnId: string
  ) => {
    const updatedColumns = columns.map((column) => {
      const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);

      if (column.id === toColumnId) {
        return {
          ...column,
          taskIds: [...filteredTaskIds, taskId],
        };
      }

      return {
        ...column,
        taskIds: filteredTaskIds,
      };
    });

    setColumns(updatedColumns);

    setTasks((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        columnId: toColumnId,
      },
    }));

    const task = tasks[taskId];

    if (task) {
      let newStatus: "pending" | "in_progress" | "completed";

      // Mapear coluna para status
      if (toColumnId === "col-1") {
        newStatus = "pending";
      } else if (toColumnId === "col-2") {
        newStatus = "in_progress";
      } else {
        newStatus = "completed";
      }

      taskService.updateTaskStatus(taskId, newStatus).catch((error) => {
        console.error("Erro ao atualizar status da tarefa:", error);
        setColumns(columns);
        setTasks((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            columnId: fromColumnId,
          },
        }));
      });
    }
  };

  const handleAddTask = (columnId: string) => {
    setActiveColumnId(columnId);
    setShowTaskForm(true);
  };

  const handleCreateTask = async (
    columnId: string,
    taskData: {
      title: string;
      priority: "low" | "medium" | "high";
      description?: string;
    }
  ) => {
    try {
      let status: "pending" | "in_progress" | "completed";

      if (columnId === "col-1") {
        status = "pending";
      } else if (columnId === "col-2") {
        status = "in_progress";
      } else {
        status = "completed";
      }

      const newTask = await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        estimatedPomodoros: 1,
      });

      // Atualizar o estado local
      const updatedColumns = columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            taskIds: [...column.taskIds, newTask.id],
          };
        }
        return column;
      });

      setColumns(updatedColumns);

      setTasks((prev) => ({
        ...prev,
        [newTask.id]: {
          ...newTask,
          columnId,
        },
      }));
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim() === "") return;

    const newColumn: ColumnType = {
      id: `col-${Date.now()}`,
      title: newColumnTitle,
      taskIds: [],
    };

    setColumns([...columns, newColumn]);
    setIsAddingColumn(false);
    setNewColumnTitle("");
  };

  const handleRenameColumn = (columnId: string, newTitle: string) => {
    if (newTitle.trim() === "") return;

    setColumns(
      columns.map((column) =>
        column.id === columnId ? { ...column, title: newTitle } : column
      )
    );
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);

    if (column && column.taskIds.length > 0) {
      if (
        !window.confirm(
          "Esta coluna contém tarefas. Deseja realmente excluí-la?"
        )
      ) {
        return;
      }
    }

    setColumns(columns.filter((column) => column.id !== columnId));
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await taskService.updateTaskStatus(taskId, "cancelled");

      const updatedColumns = columns.map((column) => ({
        ...column,
        taskIds: column.taskIds.filter((id) => id !== taskId),
      }));

      const updatedTasks = { ...tasks };
      delete updatedTasks[taskId];

      setColumns(updatedColumns);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      alert("Não foi possível excluir a tarefa. Por favor, tente novamente.");
    }
  };

  return (
    <>
      <div className={styles.tasksPage}>
        <header className={styles.header}>
          <h1>Quadro de Tarefas</h1>
        </header>

        <div className={styles.board}>
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={column.taskIds
                .map((taskId) => tasks[taskId])
                .filter((task): task is TaskItem => task !== undefined)}
              moveTask={moveTask}
              onAddTask={handleAddTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onDeleteTask={handleDeleteTask}
            />
          ))}

          {isAddingColumn ? (
            <div className={styles.newColumn}>
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                placeholder="Título da coluna..."
                className={styles.newColumnInput}
                autoFocus
              />
              <div className={styles.newColumnActions}>
                <button
                  onClick={handleAddColumn}
                  className={styles.confirmButton}
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setIsAddingColumn(false)}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingColumn(true)}
              className={styles.addColumnButton}
            >
              + Adicionar Coluna
            </button>
          )}
        </div>
      </div>

      {showTaskForm && activeColumnId && (
        <TaskFormModal
          columnId={activeColumnId}
          onClose={() => setShowTaskForm(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </>
  );
};

export default Tasks;
