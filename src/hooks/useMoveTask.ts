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

        console.log(`Movendo tarefa ${taskId} de ${fromColumnId} para ${toColumnId}`);        if (useBackendKanban && moveKanbanTask) {
          try {
            // Validar board e colunas antes de prosseguir
            if (!board || !board.columns) {
              console.error("Board ou colunas indefinidas ao mover tarefa");
              throw new Error("Dados do quadro indisponíveis");
            }
            
            // Usar sistema Kanban do backend
            const targetColumn = Array.isArray(board.columns) 
              ? board.columns.find((col: any) => col.id === toColumnId)
              : null;
              
            if (!targetColumn) {
              console.error(`Coluna de destino ${toColumnId} não encontrada no board`);
              throw new Error("Coluna de destino não encontrada");
            }
            
            // Garantir que tasks é um array
            const targetTasks = Array.isArray(targetColumn.tasks) ? targetColumn.tasks : [];
            const position = targetTasks.length;
            
            console.log(`Movendo tarefa ${taskId} para coluna ${toColumnId} na posição ${position}`);
            
            await moveKanbanTask(taskId, {
              columnId: toColumnId,
              position: position
            });
            
            console.log("Move task chamado com sucesso via API");
          } catch (error) {
            console.error("Erro ao mover tarefa via Kanban:", error);
            // Falhar para o modo local como fallback
            throw error; // Repassar erro para ser tratado no catch externo
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

        console.log("Tarefa movida com sucesso");      } catch (error) {
        console.error("Erro ao mover tarefa:", error);
        
        // Fallback: tentar mover localmente se falhou com backend
        if (useBackendKanban) {
          console.log("Tentando fallback local após falha no backend");
          
          try {
            // Determinar o novo status com base na coluna de destino
            let newStatus: TaskStatus;
            if (toColumnId === "col-1") {
              newStatus = "pending";
            } else if (toColumnId === "col-2") {
              newStatus = "in_progress";
            } else {
              newStatus = "completed";
            }

            // Atualizar estado local manualmente
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
                ...(localTasks[taskId] || tasks[taskId]),
                status: newStatus,
                columnId: toColumnId,
              },
            };

            setLocalColumns(updatedColumns);
            setLocalTasks(updatedTasks);
            
            console.log("Movimentação local de fallback concluída com sucesso");
            
            // Como estamos em modo de recuperação, não exibir alerta
          } catch (fallbackError) {
            console.error("Erro também no fallback local:", fallbackError);
            alert("Não foi possível mover a tarefa. Por favor, tente novamente.");
          }
        } else {
          alert("Não foi possível mover a tarefa. Por favor, tente novamente.");
        }
      }
    },
    [tasks, useBackendKanban, moveKanbanTask, moveTaskByStatus, localColumns, localTasks, board, setLocalColumns, setLocalTasks]
  );

  return { moveTask };
};
