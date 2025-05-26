import React, { useState, useEffect, useCallback } from "react";
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

  // Função melhorada para carregar tarefas preservando colunas personalizadas
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Buscar todas as tarefas
        const allTasks = await taskService.getTasks();

        // Preparar o mapa de tarefas
        const taskMap: Record<string, TaskItem> = {};

        // Criar um mapa das colunas existentes pelo ID para preservá-las
        const columnMap: Record<string, ColumnType> = {};
        columns.forEach((col) => {
          columnMap[col.id] = { ...col, taskIds: [] }; // Limpar os taskIds
        });

        // Garantir que as colunas padrão existam
        if (!columnMap["col-1"])
          columnMap["col-1"] = { id: "col-1", title: "A fazer", taskIds: [] };
        if (!columnMap["col-2"])
          columnMap["col-2"] = {
            id: "col-2",
            title: "Em progresso",
            taskIds: [],
          };
        if (!columnMap["col-3"])
          columnMap["col-3"] = { id: "col-3", title: "Concluído", taskIds: [] };

        // Distribuir as tarefas nas colunas corretas
        allTasks.forEach((task) => {
          if (task.status === "cancelled") return;

          let columnId = "col-1";
          if (task.status === "in_progress") {
            columnId = "col-2";
          } else if (task.status === "completed") {
            columnId = "col-3";
          }

          // Adicionar o ID da tarefa à coluna adequada
          if (columnMap[columnId]) {
            columnMap[columnId].taskIds.push(task.id);
          }

          // Adicionar ao mapa de tarefas
          taskMap[task.id] = { ...task, columnId };
        });

        // Converter o mapa de volta para um array de colunas
        const updatedColumns = Object.values(columnMap);

        // Atualizar os estados
        setTasks(taskMap);
        setColumns(updatedColumns);

        console.log("Tarefas carregadas com sucesso:", taskMap);
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      }
    };

    fetchTasks();
  }, []);

  // Verificar duplicatas nas colunas
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

  // Função para remover duplicatas
  const removeTaskDuplicates = useCallback(() => {
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
  }, [columns]);

  // SUBSTITUA TODOS OS useEffect relacionados a duplicatas por este:
  useEffect(() => {
    // Skip quando as colunas estiverem vazias (inicialização)
    if (columns.length === 0 || Object.keys(tasks).length === 0) {
      return;
    }

    // Criar um snapshot atual para comparação posterior
    const currentSnapshot = JSON.stringify(columns.map((c) => c.taskIds));

    // Verificar e remover duplicatas em um único passo
    const seen = new Set<string>();
    let shouldUpdate = false;

    const updatedColumns = columns.map((column) => {
      const uniqueTaskIds = column.taskIds.filter((taskId) => {
        if (seen.has(taskId)) {
          shouldUpdate = true; // Marcar que uma atualização é necessária
          return false; // Remover duplicata
        }
        seen.add(taskId);
        return true;
      });

      // Verificar se esta coluna foi modificada
      if (uniqueTaskIds.length !== column.taskIds.length) {
        shouldUpdate = true;
        return { ...column, taskIds: uniqueTaskIds };
      }

      return column;
    });

    // Só atualizar estado se necessário e se diferente do estado atual
    if (shouldUpdate) {
      const newSnapshot = JSON.stringify(updatedColumns.map((c) => c.taskIds));

      if (currentSnapshot !== newSnapshot) {
        console.warn("Removendo tarefas duplicadas");
        setColumns(updatedColumns);
      }
    }
  }, [columns, tasks]); // Dependências controladas

  // Logging para debugging
  useEffect(() => {
    console.log("Estado das tarefas atualizado:", tasks);
    // Salvar o status atual das tarefas no localStorage para debugging
    localStorage.setItem(
      "lastTasksState",
      JSON.stringify(
        Object.values(tasks).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          columnId: t.columnId,
        }))
      )
    );
  }, [tasks]);

  // Função para mover tarefas entre colunas
  const moveTask = useCallback(
    async (taskId: string, fromColumnId: string, toColumnId: string) => {
      try {
        const task = tasks[taskId];
        if (!task) {
          console.error(`Task ${taskId} não encontrada`);
          return;
        }

        console.log(
          `Movendo tarefa ${taskId} de ${fromColumnId} para ${toColumnId}`
        );

        // Determinar o novo status com base na coluna de destino
        let newStatus: "pending" | "in_progress" | "completed";
        if (toColumnId === "col-1") {
          newStatus = "pending";
        } else if (toColumnId === "col-2") {
          newStatus = "in_progress";
        } else {
          newStatus = "completed";
        }

        console.log(`Atualizando status para ${newStatus}`);

        // Importante: Atualizar o backend ANTES de atualizar o estado local
        await taskService.updateTaskStatus(taskId, newStatus);
        console.log("Backend atualizado com sucesso");

        // Atualizar o estado local das colunas
        const updatedColumns = columns.map((column) => {
          // Remover o ID da tarefa de todas as colunas
          const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);

          // Adicionar o ID da tarefa apenas à coluna de destino
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

        // Atualizar o estado local da tarefa
        const updatedTasks = {
          ...tasks,
          [taskId]: {
            ...task,
            status: newStatus,
            columnId: toColumnId,
          },
        };

        // Atualizar os estados
        setColumns(updatedColumns);
        setTasks(updatedTasks);

        console.log("Estado local atualizado com sucesso");
      } catch (error) {
        console.error("Erro ao atualizar status da tarefa:", error);
        alert("Não foi possível mover a tarefa. Por favor, tente novamente.");
      }
    },
    [tasks, columns]
  );

  // Manipulador para adicionar tarefa
  const handleAddTask = (columnId: string) => {
    setActiveColumnId(columnId);
    setShowTaskForm(true);
  };
  // Manipulador para criar tarefa
  const handleCreateTask = async (
    columnId: string,
    taskData: {
      title: string;
      priority: "low" | "medium" | "high";
      description?: string;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    try {
      // Determinar o status com base na coluna
      let status: "pending" | "in_progress" | "completed";
      if (columnId === "col-1") {
        status = "pending";
      } else if (columnId === "col-2") {
        status = "in_progress";
      } else {
        status = "completed";
      }

      // Criar a tarefa
      const newTask = await taskService.createTask({
        title: taskData.title,
        description: taskData.description || "",
        priority: taskData.priority,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        estimatedPomodoros: 1,
      });

      // Atualizar o status se não for 'pending'
      if (status !== "pending") {
        await taskService.updateTaskStatus(newTask.id, status);
        newTask.status = status; // Atualizar o objeto de tarefa local
      }

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

      // Fechar modal
      setShowTaskForm(false);
      setActiveColumnId(null);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Não foi possível criar a tarefa. Por favor, tente novamente.");
    }
  };

  // Manipulador para renomear coluna
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    const updatedColumns = columns.map((column) => {
      if (column.id === columnId) {
        return { ...column, title: newTitle };
      }
      return column;
    });
    setColumns(updatedColumns);
  };

  // Manipulador para adicionar nova coluna
  const handleAddColumn = () => {
    setIsAddingColumn(true);
  };

  // Manipulador para confirmar adição de coluna
  const handleConfirmAddColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: ColumnType = {
        id: `col-${Date.now()}`, // ID único
        title: newColumnTitle.trim(),
        taskIds: [],
      };
      setColumns([...columns, newColumn]);
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  // Manipulador para cancelar adição de coluna
  const handleCancelAddColumn = () => {
    setIsAddingColumn(false);
    setNewColumnTitle("");
  };

  // Manipulador para excluir coluna
  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);

    // Não permitir excluir colunas padrão
    if (["col-1", "col-2", "col-3"].includes(columnId)) {
      alert("Não é possível excluir colunas padrão do sistema.");
      return;
    }

    // Perguntar se o usuário tem certeza, especialmente se houver tarefas na coluna
    if (column && column.taskIds.length > 0) {
      const confirmDelete = window.confirm(
        `Esta coluna contém ${column.taskIds.length} tarefa(s). Deseja realmente excluí-la?`
      );
      if (!confirmDelete) return;
    }

    // Mover as tarefas da coluna para a coluna "A fazer"
    const updatedColumns = columns
      .map((col) => {
        if (col.id === "col-1" && column) {
          return {
            ...col,
            taskIds: [...col.taskIds, ...column.taskIds],
          };
        }
        return col;
      })
      .filter((col) => col.id !== columnId);

    // Atualizar o status das tarefas movidas para "pending"
    const updatedTasks = { ...tasks };
    if (column) {
      column.taskIds.forEach((taskId) => {
        const task = tasks[taskId];
        if (task) {
          updatedTasks[taskId] = {
            ...task,
            status: "pending",
            columnId: "col-1",
          };

          // Atualizar o backend (de forma assíncrona)
          taskService.updateTaskStatus(taskId, "pending").catch((error) => {
            console.error("Erro ao atualizar status da tarefa:", error);
          });
        }
      });
    }

    setColumns(updatedColumns);
    setTasks(updatedTasks);
  };

  // Manipulador para excluir tarefa
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir propagação

    try {
      // Atualizar o status da tarefa para "cancelled" no backend
      await taskService.updateTaskStatus(taskId, "cancelled");

      // Atualizar o estado local
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

  // Manipulador para completar/descompletar tarefa
  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir propagação

    try {
      const task = tasks[taskId];
      if (!task) return;

      let updatedTask;
      if (task.status === "completed") {
        // Desmarcar como concluída
        updatedTask = await taskService.uncompleteTask(taskId);
      } else {
        // Marcar como concluída
        updatedTask = await taskService.completeTask(taskId);
      }

      // Determinar nova coluna baseada no status
      let newColumnId = task.columnId;
      if (updatedTask.status === "completed") {
        newColumnId = "col-3"; // Coluna "Concluído"
      } else if (updatedTask.status === "pending") {
        newColumnId = "col-1"; // Coluna "A fazer"
      }

      // Atualizar estado local
      const updatedColumns = columns.map((column) => {
        // Remover tarefa da coluna atual
        const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);

        // Adicionar à nova coluna se necessário
        if (column.id === newColumnId && !filteredTaskIds.includes(taskId)) {
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

      const updatedTasks = {
        ...tasks,
        [taskId]: {
          ...updatedTask,
          columnId: newColumnId,
        },
      };

      setColumns(updatedColumns);
      setTasks(updatedTasks);
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
      alert("Não foi possível alterar o status da tarefa. Por favor, tente novamente.");
    }
  };

  return (
    <div className={styles.tasksPage}>
      <header className={styles.header}>
        <h1>Quadro de Tarefas</h1>
      </header>

      <div className={styles.board}>        {columns.map((column) => (
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
            onCompleteTask={handleCompleteTask}
          />
        ))}        {!isAddingColumn ? (
          <button className={styles.addColumnButton} onClick={handleAddColumn}>
            + Adicionar coluna
          </button>        ) : (
          <div className={styles.newColumn}>
            <input
              type="text"
              placeholder="Título da coluna"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              className={styles.newColumnInput}
            />
            <div className={styles.newColumnActions}>
              <button
                onClick={handleConfirmAddColumn}
                className={styles.confirmButton}
              >
                Confirmar
              </button>
              <button
                onClick={handleCancelAddColumn}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {showTaskForm && activeColumnId && (
        <TaskFormModal
          columnId={activeColumnId}
          onClose={() => setShowTaskForm(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </div>
  );
};

export default Tasks;
