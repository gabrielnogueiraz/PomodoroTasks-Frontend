import { useState, useEffect, useCallback, useMemo } from "react";
import { Task, TaskStatus } from "../services/taskService";
import { useTaskContext } from "./TaskProvider";
import { useKanban } from "./useKanban";
import { useRealtimeSync } from "./useRealtimeSync";
import kanbanService, { KanbanColumn, KanbanTask } from "../services/kanbanService";

interface ColumnType {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
  position?: number;
}

interface TaskItem extends Task {
  columnId: string;
}

interface SlotData {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

export const useTasksView = (goalId: string | null, boardId?: string | null) => {
  // Estados locais
  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [calendarKey, setCalendarKey] = useState<number>(0);
  
  // Estados do modal
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [selectedSlotData, setSelectedSlotData] = useState<SlotData | null>(null);

  // Hook do Kanban (baseado em goalId ou boardId)
  const kanbanHookParam = goalId || (boardId ? null : undefined);
  const { 
    board, 
    loading: kanbanLoading, 
    error: kanbanError,
    createColumn,
    updateColumn,
    deleteColumn,
    moveTask: moveKanbanTask
  } = useKanban(kanbanHookParam);
  
  // Estado para board específico (quando usando boardId)
  const [specificBoard, setSpecificBoard] = useState<any>(null);
  const [specificBoardLoading, setSpecificBoardLoading] = useState(false);
  const [specificBoardError, setSpecificBoardError] = useState<string | null>(null);
  
  // Buscar board específico por ID quando necessário
  useEffect(() => {
    if (boardId && !goalId) {
      const fetchSpecificBoard = async () => {
        try {
          setSpecificBoardLoading(true);
          setSpecificBoardError(null);
          const { board: fetchedBoard } = await kanbanService.getBoardById(boardId);
          setSpecificBoard(fetchedBoard);
        } catch (error) {
          setSpecificBoardError('Erro ao carregar quadro específico');
          console.error('Erro ao buscar quadro específico:', error);
        } finally {
          setSpecificBoardLoading(false);
        }
      };
      
      fetchSpecificBoard();
    } else {
      setSpecificBoard(null);
      setSpecificBoardLoading(false);
      setSpecificBoardError(null);
    }
  }, [boardId, goalId]);
  
  // Determinar qual board usar
  const currentBoard = specificBoard || board;
  const currentLoading = specificBoardLoading || kanbanLoading;
  const currentError = specificBoardError || kanbanError;
  // TaskProvider para sincronização de tarefas
  const { 
    tasks: allTasks,
    createTask: createTaskFromProvider,
    deleteTask: deleteTaskFromProvider,
    moveTaskToColumn: moveTaskToColumnProvider
  } = useTaskContext();  // Wrapper para createTask que inclui goalId ou boardId
  const createTaskFromProviderWithGoal = useCallback(async (
    title: string,
    priority: "low" | "medium" | "high",
    description?: string,
    startDate?: string,
    endDate?: string,
    startTime?: string,
    endTime?: string,
    columnId?: string
  ) => {
    await createTaskFromProvider(
      title,
      priority,
      description,
      startDate,
      endDate,
      startTime,
      endTime,
      columnId,
      goalId || undefined,
      boardId || undefined
    );
  }, [createTaskFromProvider, goalId, boardId]);
  
  // Estados locais para fallback (quando não há backend Kanban)
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([
    { id: "col-1", title: "A fazer", taskIds: [], color: "#e3f2fd", position: 0 },
    { id: "col-2", title: "Em progresso", taskIds: [], color: "#fff3e0", position: 1 },
    { id: "col-3", title: "Concluído", taskIds: [], color: "#e8f5e9", position: 2 },
  ]);
  
  const [localTasks, setLocalTasks] = useState<Record<string, TaskItem>>({});  // Verificar se deve usar Kanban do backend ou sistema local
  const useBackendKanban = (goalId && board && !kanbanError) || (boardId && specificBoard && !specificBoardError);

  // Função para converter KanbanColumn para ColumnType
  const convertKanbanColumn = (kanbanColumn: KanbanColumn): ColumnType => ({
    id: kanbanColumn.id,
    title: kanbanColumn.name,
    taskIds: kanbanColumn.tasks.map(t => t.id),
    color: kanbanColumn.color,
    position: kanbanColumn.position
  });
  
  // Função para converter KanbanTask para TaskItem
  const convertKanbanTask = (kanbanTask: KanbanTask): TaskItem => ({
    id: kanbanTask.id,
    title: kanbanTask.title,
    description: kanbanTask.description || "",
    priority: kanbanTask.priority,
    status: kanbanTask.isCompleted ? "completed" : "pending",
    createdAt: kanbanTask.createdAt,
    updatedAt: kanbanTask.updatedAt,
    dueDate: kanbanTask.dueDate,
    columnId: kanbanTask.columnId,
    estimatedPomodoros: 1,
    completedPomodoros: 0,
    isCompleted: kanbanTask.isCompleted
  });

  // Função auxiliar para mapear status para coluna e posição
  const getColumnInfoFromStatus = (status: TaskStatus): { columnId: string; position: number } => {
    const statusToColumn: Record<TaskStatus, string> = {
      pending: "col-1",
      in_progress: "col-2", 
      completed: "col-3",
      cancelled: "col-1" // fallback para cancelled
    };
    
    const columnId = statusToColumn[status] || "col-1";
    const column = columns.find((col: ColumnType) => col.id === columnId);
    const position = column ? column.taskIds.length : 0;
    
    return { columnId, position };
  };

  // Função auxiliar para mover tarefa usando status
  const moveTaskByStatus = async (taskId: string, status: TaskStatus) => {
    const { columnId, position } = getColumnInfoFromStatus(status);
    await moveTaskToColumnProvider(taskId, columnId, position);
  };  // Colunas e tarefas derivadas para KANBAN (filtradas por goalId se estiver usando backend)
  const columns = useBackendKanban 
    ? (currentBoard?.columns?.map(convertKanbanColumn)?.sort((a: ColumnType, b: ColumnType) => (a.position || 0) - (b.position || 0)) || [])
    : localColumns;
    
  const tasks = useBackendKanban
    ? (currentBoard?.columns?.reduce((acc: Record<string, TaskItem>, col: KanbanColumn) => {
        col.tasks?.forEach((task: KanbanTask) => {
          acc[task.id] = convertKanbanTask(task);
        });
        return acc;
      }, {} as Record<string, TaskItem>) || {})
    : localTasks;
  // Tarefas para CALENDÁRIO (SEMPRE todas as tarefas do usuário, independente do goalId)
  const allTasksForCalendar = useMemo(() => 
    allTasks.map(task => ({
      ...task,
      columnId: task.columnId || 'col-1' // fallback para columnId
    }))
  , [allTasks]);  // Função para carregar tarefas locais (fallback quando não há Kanban do backend)
  const fetchLocalTasks = useCallback(async () => {
    console.log("fetchLocalTasks called", { useBackendKanban, goalId, boardId });
    
    try {
      // Se estamos usando backend Kanban e temos um quadro carregado, sincronize suas tarefas
      if (useBackendKanban && currentBoard) {
        console.log("Usando backend Kanban com quadro já carregado");
        return; // O quadro já será atualizado através dos eventos de sincronização
      }
      
      // Filtrar tarefas baseado no contexto atual  
      let filteredTasks = allTasks;
      
      if (goalId) {
        // Para quadros de meta, filtrar por goalId
        console.log(`Filtrando tarefas por goalId: ${goalId}`);
        filteredTasks = allTasks.filter(task => task.goalId === goalId);
      } else if (boardId) {
        // Para quadros independentes, filtrar por boardId
        console.log(`Filtrando tarefas por boardId: ${boardId}`);
        filteredTasks = allTasks.filter(task => task.boardId === boardId);
      } else {
        // Se não há goalId nem boardId, usar todas as tarefas sem meta/quadro específico
        console.log("Usando tarefas sem meta/quadro específico");
        filteredTasks = allTasks.filter(task => !task.goalId && !task.boardId);
      }
      
      console.log(`Encontradas ${filteredTasks.length} tarefas filtradas`);
      
      // Criar mapa de tarefas locais baseado nas tarefas filtradas
      const taskMap: Record<string, TaskItem> = {};
      const columnMap: Record<string, ColumnType> = {
        "col-1": { id: "col-1", title: "A fazer", taskIds: [], color: "#e3f2fd", position: 0 },
        "col-2": { id: "col-2", title: "Em progresso", taskIds: [], color: "#fff3e0", position: 1 },
        "col-3": { id: "col-3", title: "Concluído", taskIds: [], color: "#e8f5e9", position: 2 }
      };

      // Distribuir as tarefas filtradas nas colunas corretas
      filteredTasks.forEach((task) => {
        if (task.status === "cancelled") {
          return;
        }

        // Determinar a coluna correta com base no columnId existente ou status
        let columnId = task.columnId || "col-1";
        
        // Se não tiver columnId definido, use o status para determinar
        if (!task.columnId) {
          if (task.status === "in_progress") {
            columnId = "col-2";
          } else if (task.status === "completed") {
            columnId = "col-3";
          }
        }

        // Se columnId não for uma das colunas padrão, verifica se é necessário criar
        if (!columnMap[columnId]) {
          // Criar coluna sob demanda se não existir
          columnMap[columnId] = { 
            id: columnId, 
            title: `Coluna ${Object.keys(columnMap).length + 1}`, 
            taskIds: [], 
            color: "#f0f4c3", 
            position: Object.keys(columnMap).length 
          };
        }

        // Adicionar o ID da tarefa à coluna adequada
        columnMap[columnId].taskIds.push(task.id);

        // Adicionar ao mapa de tarefas
        taskMap[task.id] = { ...task, columnId };
      });

      // Converter o mapa de volta para um array de colunas
      const updatedColumns = Object.values(columnMap)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      console.log("Atualizando colunas locais:", updatedColumns);
      console.log("Atualizando tarefas locais:", Object.keys(taskMap).length);

      // Atualizar os estados locais
      setLocalTasks(taskMap);
      setLocalColumns(updatedColumns);
    } catch (error) {
      console.error("Erro ao carregar tarefas locais:", error);
    }
  }, [allTasks, useBackendKanban, goalId, boardId, currentBoard]);// Effect para carregar tarefas inicialmente
  useEffect(() => {
    fetchLocalTasks();
  }, [fetchLocalTasks]);

  // Hook para sincronização em tempo real
  useRealtimeSync({
    onTasksRefreshed: () => {
      console.log("useTasksView: onTasksRefreshed - fetching local tasks and refreshing view");
      fetchLocalTasks();
      if (viewMode === 'calendar') {
        setCalendarKey(prev => prev + 1);
      }
    },
    onTaskCreated: (task) => {
      console.log("useTasksView: onTaskCreated - fetching local tasks", task);
      fetchLocalTasks();
      if (viewMode === 'calendar') {
        setCalendarKey(prev => prev + 1);
      }
    },
    onTaskUpdated: (task) => {
      console.log("useTasksView: onTaskUpdated - fetching local tasks", task);
      fetchLocalTasks();
      if (viewMode === 'calendar') {
        setCalendarKey(prev => prev + 1);
      }
    },
    onTaskDeleted: (taskId) => {
      console.log("useTasksView: onTaskDeleted - fetching local tasks", taskId);
      fetchLocalTasks();
      if (viewMode === 'calendar') {
        setCalendarKey(prev => prev + 1);
      }
    },    onTaskMoved: (detail) => {
      console.log("useTasksView: onTaskMoved - refreshing board data", detail);
      
      try {
        if (!detail || !detail.taskId || !detail.columnId) {
          console.warn("useTasksView: onTaskMoved recebeu dados incompletos", detail);
          return;
        }
        
        if (useBackendKanban && currentBoard) {
          // Realizar uma atualização segura do board para refletir a mudança
          try {
            if (goalId) {
              console.log(`useTasksView: Recarregando board para goalId ${goalId} após movimentação de tarefa`);
              kanbanService.getBoardByGoal(goalId)
                .then(({ board: updatedBoard }) => {
                  if (updatedBoard) {
                    console.log("useTasksView: Board atualizado com sucesso após movimentação");
                    setSpecificBoard(null); // Limpar qualquer board específico
                  } else {
                    console.warn("useTasksView: Não foi possível obter board atualizado");
                  }
                })
                .catch(error => {
                  console.error("useTasksView: Erro ao recarregar board por goal:", error);
                  // Tentar fallback para local tasks
                  fetchLocalTasks();
                });
            } else if (boardId) {
              console.log(`useTasksView: Recarregando board para boardId ${boardId} após movimentação de tarefa`);
              kanbanService.getBoardById(boardId)
                .then(({ board: updatedBoard }) => {
                  if (updatedBoard) {
                    console.log("useTasksView: Board específico atualizado com sucesso após movimentação");
                    setSpecificBoard(updatedBoard);
                  } else {
                    console.warn("useTasksView: Não foi possível obter board específico atualizado");
                  }
                })
                .catch(error => {
                  console.error("useTasksView: Erro ao recarregar board específico:", error);
                  // Tentar fallback para local tasks
                  fetchLocalTasks();
                });
            }
          } catch (error) {
            console.error("useTasksView: Erro ao tentar recarregar board após movimentação:", error);
            fetchLocalTasks();
          }
        } else {
          // Atualização local para quando não há backend Kanban
          console.log("useTasksView: Atualizando tarefas locais após movimentação");
          fetchLocalTasks();
        }
        
        if (viewMode === 'calendar') {
          console.log("useTasksView: Atualizando calendário após movimentação de tarefa");
          setCalendarKey(prev => prev + 1);
        }
      } catch (error) {
        console.error("useTasksView: Erro geral ao processar onTaskMoved:", error);
        // Tentar recuperar o estado
        fetchLocalTasks();
      }
    },
    onColumnCreated: (column) => {
      console.log("useTasksView: onColumnCreated - refreshing board data", column);
      if (useBackendKanban && currentBoard) {
        // Atualizar o board para refletir a nova coluna
        if (goalId) {
          kanbanService.getBoardByGoal(goalId).then(({ board: updatedBoard }) => {
            setSpecificBoard(null); // Limpar qualquer board específico
          });
        } else if (boardId) {
          kanbanService.getBoardById(boardId).then(({ board: updatedBoard }) => {
            setSpecificBoard(updatedBoard);
          });
        }
      } else {
        fetchLocalTasks();
      }
    },
    onColumnUpdated: (column) => {
      console.log("useTasksView: onColumnUpdated - refreshing board data", column);
      if (useBackendKanban && currentBoard) {
        // Atualizar o board para refletir as mudanças na coluna
        if (goalId) {
          kanbanService.getBoardByGoal(goalId).then(({ board: updatedBoard }) => {
            setSpecificBoard(null); // Limpar qualquer board específico
          });
        } else if (boardId) {
          kanbanService.getBoardById(boardId).then(({ board: updatedBoard }) => {
            setSpecificBoard(updatedBoard);
          });
        }
      } else {
        fetchLocalTasks();
      }
    },
    onColumnDeleted: (columnId) => {
      console.log("useTasksView: onColumnDeleted - refreshing board data", columnId);
      if (useBackendKanban && currentBoard) {
        // Atualizar o board para refletir a remoção da coluna
        if (goalId) {
          kanbanService.getBoardByGoal(goalId).then(({ board: updatedBoard }) => {
            setSpecificBoard(null); // Limpar qualquer board específico
          });
        } else if (boardId) {
          kanbanService.getBoardById(boardId).then(({ board: updatedBoard }) => {
            setSpecificBoard(updatedBoard);
          });
        }
      } else {
        fetchLocalTasks();
      }
    },
    onBoardUpdated: (updatedBoard) => {
      console.log("useTasksView: onBoardUpdated - updating board data", updatedBoard);
      if (useBackendKanban) {
        if (goalId && updatedBoard.goal?.id === goalId) {
          // Atualizando quadro por meta
          setSpecificBoard(null);
        } else if (boardId && updatedBoard.id === boardId) {
          // Atualizando quadro específico
          setSpecificBoard(updatedBoard);
        }
      } else {
        fetchLocalTasks();
      }
    }
  });

  // Effect para atualizar calendar key quando necessário
  useEffect(() => {
    if (viewMode === 'calendar') {
      setCalendarKey(prev => prev + 1);
    }
  }, [viewMode]);

  return {
    // Estados
    viewMode,
    setViewMode,
    selectedTask,
    setSelectedTask,
    calendarKey,
    showTaskForm,
    setShowTaskForm,
    activeColumnId,
    setActiveColumnId,
    isAddingColumn,
    setIsAddingColumn,
    newColumnTitle,
    setNewColumnTitle,
    selectedSlotData,
    setSelectedSlotData,
      // Dados computados
    columns,
    tasks, // Tarefas para kanban (filtradas por goalId se usando backend)
    allTasksForCalendar, // Tarefas para calendário (sempre todas)
    useBackendKanban,
      // Estados do Kanban
    board: currentBoard,
    kanbanLoading: currentLoading,
    kanbanError: currentError,
    
    // Funções do Kanban
    createColumn,
    updateColumn,
    deleteColumn,
    moveKanbanTask,
    
    // Funções locais
    localColumns,
    setLocalColumns,
    localTasks,
    setLocalTasks,
    
    // Funções auxiliares
    moveTaskByStatus,
    fetchLocalTasks,
      // Funções do TaskProvider
    createTaskFromProvider: createTaskFromProviderWithGoal,
    deleteTaskFromProvider,
    moveTaskToColumnProvider,
  };
};

export type { ColumnType, TaskItem, SlotData };
