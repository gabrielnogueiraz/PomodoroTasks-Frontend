import { useCallback } from "react";
import { TaskStatus } from "../services/taskService";
import { ColumnType, TaskItem } from "./useTasksView";

interface MoveTaskConfig {
  tasks: Record<string, TaskItem>;
  useBackendKanban: boolean;
  moveKanbanTask?: (taskId: string, data: { columnId: string; position: number }) => Promise<any>;
  moveTaskByStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  localColumns: ColumnType[];
  localTasks: Record<string, TaskItem>;
  setLocalColumns: (columns: ColumnType[]) => void;
  setLocalTasks: (tasks: Record<string, TaskItem>) => void;
  board?: any;
}

export const useMoveTask = (config: MoveTaskConfig) => {
  const {
    tasks,
    useBackendKanban,
    moveKanbanTask,
    moveTaskByStatus,
    localColumns,
    localTasks,
    setLocalColumns,
    setLocalTasks,
    board
  } = config;

  // Função para mover tarefas entre colunas
  const moveTask = useCallback(
    async (taskId: string, fromColumnId: string, toColumnId: string) => {
      try {
        const task = tasks[taskId];
        if (!task) {
          console.error(`Task ${taskId} não encontrada`);
          return;
        }

        console.log(`Movendo tarefa ${taskId} de ${fromColumnId} para ${toColumnId}`);

        if (useBackendKanban && moveKanbanTask) {
          // Usar sistema Kanban do backend
          const targetColumn = board.columns.find((col: any) => col.id === toColumnId);
          if (targetColumn) {
            await moveKanbanTask(taskId, {
              columnId: toColumnId,
              position: targetColumn.tasks.length
            });
          }
        } else {
          // Determinar o novo status com base na coluna de destino
          let newStatus: TaskStatus;
          if (toColumnId === "col-1") {
            newStatus = "pending";
          } else if (toColumnId === "col-2") {
            newStatus = "in_progress";
          } else {
            newStatus = "completed";
          }

          // Usar TaskProvider para mover tarefa
          await moveTaskByStatus(taskId, newStatus);
          
          // Atualizar estado local
          const updatedColumns = localColumns.map((column) => {
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

          // Atualizar a tarefa local
          const updatedTasks = {
            ...localTasks,
            [taskId]: {
              ...task,
              status: newStatus,
              columnId: toColumnId,
            },
          };

          setLocalColumns(updatedColumns);
          setLocalTasks(updatedTasks);
        }

        console.log("Tarefa movida com sucesso");
      } catch (error) {
        console.error("Erro ao mover tarefa:", error);
        alert("Não foi possível mover a tarefa. Por favor, tente novamente.");
      }
    },
    [tasks, useBackendKanban, moveKanbanTask, moveTaskByStatus, localColumns, localTasks, board, setLocalColumns, setLocalTasks]
  );

  return { moveTask };
};
