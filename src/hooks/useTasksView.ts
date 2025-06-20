import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Task, TaskStatus } from "../services/taskService";
import { useTaskContext } from "./TaskProvider";
import { useKanban } from "./useKanban";
import { useRealtimeSync } from "./useRealtimeSync";
import kanbanService, { KanbanColumn, KanbanTask } from "../services/kanbanService";

export interface ColumnType {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
  position?: number;
}

export interface TaskItem extends Task {
  columnId: string;
}

export interface SlotData {
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

  // Refs para controlar atualizações e evitar loops
  const lastGoalIdRef = useRef<string | null>(goalId);
  const lastBoardIdRef = useRef<string | null>(boardId || null);
  const lastTasksCountRef = useRef<number>(0);
  const isUpdatingRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimestamp = useRef<number>(0);

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

  // Buscar board específico por ID quando necessário - otimizado com cache
  const lastBoardFetchRef = useRef<{ boardId: string | null; timestamp: number } | null>(null);
  const BOARD_CACHE_DURATION = 30000; // 30 segundos de cache
  
  useEffect(() => {
    // Debounce para evitar múltiplas chamadas ao trocar boards rapidamente
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (boardId && !goalId) {
        // Verificar se já buscamos este board recentemente
        const now = Date.now();
        const lastFetch = lastBoardFetchRef.current;
        
        if (lastFetch && 
            lastFetch.boardId === boardId && 
            (now - lastFetch.timestamp) < BOARD_CACHE_DURATION) {
          console.log(`Board ${boardId} ainda em cache, pulando busca`);
          return;
        }
        
        const fetchSpecificBoard = async () => {
          try {
            setSpecificBoardLoading(true);
            setSpecificBoardError(null);
            console.log(`Buscando board específico: ${boardId}`);
            
            const { board: fetchedBoard } = await kanbanService.getBoardById(boardId);
            // Normalizar o board para garantir que columns seja sempre um array
            const normalizedBoard = fetchedBoard ? {
              ...fetchedBoard,
              columns: (fetchedBoard.columns && Array.isArray(fetchedBoard.columns)) ? fetchedBoard.columns : []
            } : null;
            
            setSpecificBoard(normalizedBoard);
            console.log(`Board específico carregado: ${normalizedBoard?.name}`);
            
            // Atualizar cache
            lastBoardFetchRef.current = { boardId, timestamp: now };
            
          } catch (error) {
            setSpecificBoardError('Erro ao carregar quadro específico');
            console.error('Erro ao buscar quadro específico:', error);
          } finally {
            setSpecificBoardLoading(false);
          }
        };
        
        fetchSpecificBoard();
      } else {
        // Limpar board específico quando não for necessário - somente se necessário
        if (specificBoard !== null) {
          setSpecificBoard(null);
          lastBoardFetchRef.current = null;
        }
        if (specificBoardLoading) {
          setSpecificBoardLoading(false);
        }
        if (specificBoardError) {
          setSpecificBoardError(null);
        }
      }
    }, 200); // Debounce de 200ms para evitar múltiplas requisições ao trocar boards
  }, [boardId, goalId]); // Dependências mínimas

  // Determinar qual board usar e normalizar
  const currentBoard = useMemo(() => {
    const selectedBoard = specificBoard || board;
    if (!selectedBoard) return null;
    
    // Garantir que columns seja sempre um array
    return {
      ...selectedBoard,
      columns: (selectedBoard.columns && Array.isArray(selectedBoard.columns)) ? selectedBoard.columns : []
    };
  }, [specificBoard, board]);

  const currentLoading = specificBoardLoading || kanbanLoading;
  const currentError = specificBoardError || kanbanError;

  // TaskProvider para sincronização de tarefas
  const { 
    tasks: allTasks,
    createTask: createTaskFromProvider,
    deleteTask: deleteTaskFromProvider,
    moveTaskToColumn: moveTaskToColumnProvider
  } = useTaskContext();
  // Wrapper para createTask que inclui goalId ou boardId - CORRIGIDO
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
    console.log("createTaskFromProviderWithGoal chamado:", {
      title, priority, columnId, goalId, boardId
    });
    
    const result = await createTaskFromProvider(
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
    
    console.log("Tarefa criada com goalId/boardId:", result);
    return result;
  }, [createTaskFromProvider, goalId, boardId]);
  
  // Estados locais para fallback (quando não há backend Kanban)
  const [localColumns, setLocalColumns] = useState<ColumnType[]>([
    { id: "col-1", title: "A fazer", taskIds: [], color: "#e3f2fd", position: 0 },
    { id: "col-2", title: "Em progresso", taskIds: [], color: "#fff3e0", position: 1 },
    { id: "col-3", title: "Concluído", taskIds: [], color: "#e8f5e9", position: 2 },
  ]);
  
  const [localTasks, setLocalTasks] = useState<Record<string, TaskItem>>({});

  // Verificar se deve usar Kanban do backend ou sistema local
  const useBackendKanban = (goalId && board && !kanbanError) || (boardId && specificBoard && !specificBoardError);

  // Função para converter KanbanColumn para ColumnType
  const convertKanbanColumn = (kanbanColumn: KanbanColumn): ColumnType => ({
    id: kanbanColumn.id,
    title: kanbanColumn.name,
    taskIds: (kanbanColumn.tasks && Array.isArray(kanbanColumn.tasks)) ? kanbanColumn.tasks.map(t => t.id) : [],
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
    const column = (columns && Array.isArray(columns)) ? columns.find((col: ColumnType) => col.id === columnId) : null;
    const position = column && column.taskIds ? column.taskIds.length : 0;
    
    return { columnId, position };
  };

  // Função auxiliar para mover tarefa usando status
  const moveTaskByStatus = async (taskId: string, status: TaskStatus) => {
    const { columnId, position } = getColumnInfoFromStatus(status);
    await moveTaskToColumnProvider(taskId, columnId, position);
  };

  // Colunas e tarefas derivadas para KANBAN (filtradas por goalId se estiver usando backend)
  const columns = useBackendKanban 
    ? (currentBoard?.columns && Array.isArray(currentBoard.columns)
        ? currentBoard.columns.map(convertKanbanColumn).sort((a: ColumnType, b: ColumnType) => (a.position || 0) - (b.position || 0))
        : [])
    : localColumns;
    
  const tasks = useBackendKanban
    ? (currentBoard?.columns && Array.isArray(currentBoard.columns)
        ? currentBoard.columns.reduce((acc: Record<string, TaskItem>, col: KanbanColumn) => {
            if (col.tasks && Array.isArray(col.tasks)) {
              col.tasks.forEach((task: KanbanTask) => {
                acc[task.id] = convertKanbanTask(task);
              });
            }
            return acc;
          }, {} as Record<string, TaskItem>)
        : {})
    : localTasks;

  // Tarefas para CALENDÁRIO (SEMPRE todas as tarefas do usuário, independente do goalId)
  const allTasksForCalendar = useMemo(() => 
    allTasks.map(task => ({
      ...task,
      columnId: task.columnId || 'col-1' // fallback para columnId
    }))
  , [allTasks]);

  // Função otimizada para buscar e processar tarefas locais - THROTTLED
  const fetchLocalTasks = useCallback(async () => {
    // Throttle severo para evitar múltiplas execuções
    const now = Date.now();
    if (isUpdatingRef.current || (now - lastSyncTimestamp.current) < 2000) {
      console.log("fetchLocalTasks: Throttle ativo ou já atualizando");
      return;
    }

    isUpdatingRef.current = true;
    lastSyncTimestamp.current = now;

    try {
      console.log(`fetchLocalTasks: Iniciando (useBackendKanban: ${useBackendKanban})`);

      // Se usando backend Kanban, não processar tarefas locais
      if (useBackendKanban && currentBoard) {
        console.log("fetchLocalTasks: Backend Kanban ativo - pulando processamento local");
        return;
      }

      // Verificar se mudou algo significativo - OTIMIZADO
      const contextChanged = lastGoalIdRef.current !== goalId || lastBoardIdRef.current !== (boardId || null);
      const tasksCountChanged = lastTasksCountRef.current !== allTasks.length;
      
      if (!contextChanged && !tasksCountChanged) {
        console.log("fetchLocalTasks: Nenhuma mudança detectada, pulando");
        return;
      }

      // Atualizar referências de controle
      lastGoalIdRef.current = goalId;
      lastBoardIdRef.current = boardId || null;
      lastTasksCountRef.current = allTasks.length;

      console.log(`Processando ${allTasks.length} tarefas para goalId: ${goalId}, boardId: ${boardId}`);      // Filtrar tarefas baseado no contexto - CORRIGIDO para garantir separação por quadro
      const filteredTasks = (() => {
        if (goalId) {
          // Se há goalId, mostrar apenas tarefas deste objetivo específico
          return allTasks.filter(task => task.goalId === goalId);
        } else if (boardId) {
          // Se há boardId, mostrar apenas tarefas deste quadro específico
          return allTasks.filter(task => task.boardId === boardId);
        } else {
          // Se não há contexto específico, mostrar tarefas sem goalId e sem boardId (tarefas gerais)
          return allTasks.filter(task => !task.goalId && !task.boardId);
        }
      })();

      const taskMap: Record<string, TaskItem> = {};
      const columnTaskIds: Record<string, string[]> = {
        "col-1": [],
        "col-2": [],
        "col-3": []
      };

      // Processar tarefas uma única vez
      filteredTasks.forEach((task) => {
        if (task.status === "cancelled") return;

        let columnId = task.columnId || "col-1";
        
        // Mapear status para coluna se não houver columnId
        if (!task.columnId) {
          if (task.status === "in_progress") columnId = "col-2";
          else if (task.status === "completed") columnId = "col-3";
        }

        // Garantir que a coluna existe
        if (!columnTaskIds[columnId]) {
          columnTaskIds[columnId] = [];
        }

        columnTaskIds[columnId].push(task.id);
        taskMap[task.id] = { ...task, columnId };
      });

      // Criar colunas com IDs de tarefas atualizados
      const updatedColumns: ColumnType[] = [
        { id: "col-1", title: "A fazer", taskIds: columnTaskIds["col-1"], color: "#e3f2fd", position: 0 },
        { id: "col-2", title: "Em progresso", taskIds: columnTaskIds["col-2"], color: "#fff3e0", position: 1 },
        { id: "col-3", title: "Concluído", taskIds: columnTaskIds["col-3"], color: "#e8f5e9", position: 2 }
      ];

      console.log(`Atualizando: ${Object.keys(taskMap).length} tarefas, ${updatedColumns.length} colunas`);

      // ATUALIZAÇÃO ATÔMICA - evita re-renders múltiplos
      setLocalTasks(prevTasks => {
        // Comparação ultra-otimizada
        const currentTaskIds = Object.keys(taskMap).sort().join(',');
        const prevTaskIds = Object.keys(prevTasks).sort().join(',');
        
        if (currentTaskIds !== prevTaskIds) {
          console.log("Tasks IDs changed - updating");
          return taskMap;
        }
        
        // Verificar se conteúdo mudou
        const contentChanged = Object.keys(taskMap).some(id => 
          JSON.stringify(taskMap[id]) !== JSON.stringify(prevTasks[id])
        );
        
        return contentChanged ? taskMap : prevTasks;
      });
      
      setLocalColumns(prevColumns => {
        // Comparação específica para colunas
        const currentState = updatedColumns.map(col => `${col.id}:${col.taskIds.length}:${col.taskIds.join(',')}`).join('|');
        const prevState = prevColumns.map(col => `${col.id}:${col.taskIds.length}:${col.taskIds.join(',')}`).join('|');
        
        if (currentState !== prevState) {
          console.log("Columns changed - updating");
          return updatedColumns;
        }
        
        return prevColumns;
      });

      console.log("fetchLocalTasks: Concluído com sucesso");
    } catch (error) {
      console.error("Erro em fetchLocalTasks:", error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [allTasks, useBackendKanban, goalId, boardId, currentBoard]);
  // Função otimizada de movimentação de tarefas - APENAS ATUALIZAÇÃO LOCAL
  const handleOptimisticTaskMove = useCallback((
    taskId: string, 
    sourceColumnId: string, 
    destinationColumnId: string, 
    position: number
  ) => {
    console.log('Optimistic task move:', { taskId, sourceColumnId, destinationColumnId, position });
    
    if (useBackendKanban) {
      // Para backend Kanban, fazer atualização otimística local também
      console.log('Backend Kanban - updating local state optimistically');
      
      // Atualizar o board local imediatamente para feedback visual
      if (currentBoard) {
        const updatedBoard = { ...currentBoard };
        updatedBoard.columns = updatedBoard.columns.map((col: KanbanColumn) => {
          if (col.id === sourceColumnId) {
            return {
              ...col,
              tasks: (col.tasks && Array.isArray(col.tasks)) ? col.tasks.filter((task: KanbanTask) => task.id !== taskId) : []
            };
          }
          if (col.id === destinationColumnId) {
            const taskToMove = currentBoard.columns
              .find((c: KanbanColumn) => c.id === sourceColumnId)
              ?.tasks?.find((t: KanbanTask) => t.id === taskId);
            
            if (taskToMove) {
              const existingTasks = (col.tasks && Array.isArray(col.tasks)) ? col.tasks : [];
              const newTasks = [...existingTasks];
              const updatedTask = { ...taskToMove, columnId: destinationColumnId };
              newTasks.splice(position, 0, updatedTask);
              return {
                ...col,
                tasks: newTasks
              };
            }
          }
          return col;
        });
        
        // Atualizar o board específico se for o caso
        if (boardId) {
          setSpecificBoard(updatedBoard);
        }
      }
      
      // NÃO CHAMA O BACKEND AQUI - isso é responsabilidade do KanbanBoard
    } else {
      // Sistema local: APENAS atualização local otimística
      console.log('Local system - updating local state optimistically');
      
      // Atualizar colunas locais
      const updatedColumns = localColumns.map(column => {
        const newTaskIds = [...column.taskIds];
        
        // Remove da coluna origem
        if (column.id === sourceColumnId) {
          const taskIndex = newTaskIds.indexOf(taskId);
          if (taskIndex > -1) {
            newTaskIds.splice(taskIndex, 1);
          }
        }
        
        // Adiciona na coluna destino
        if (column.id === destinationColumnId) {
          newTaskIds.splice(position, 0, taskId);
        }
        
        return { ...column, taskIds: newTaskIds };
      });
      
      // Atualizar tarefa com nova coluna
      const updatedTasks = {
        ...localTasks,
        [taskId]: {
          ...localTasks[taskId],
          columnId: destinationColumnId
        }
      };
      
      setLocalColumns(updatedColumns);
      setLocalTasks(updatedTasks);
      
      // Chamar provider para sincronizar com backend (SEM fetchLocalTasks)
      moveTaskToColumnProvider(taskId, destinationColumnId, position);
    }
  }, [useBackendKanban, currentBoard, boardId, localColumns, localTasks, moveTaskToColumnProvider]);

  // Effect SIMPLIFICADO para carregar tarefas inicialmente - SEM DEPENDÊNCIA CIRCULAR
  useEffect(() => {
    // Debounce para evitar múltiplas execuções rapidamente
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      // Apenas executar quando o contexto realmente mudar
      const contextChanged = lastGoalIdRef.current !== goalId || lastBoardIdRef.current !== (boardId || null);
      
      if (contextChanged) {
        console.log("useTasksView: Contexto mudou", { goalId, boardId });
        fetchLocalTasks();
      }
    }, 300); // Debounce de 300ms
  }, [goalId, boardId]); // Dependências mínimas

  // Cleanup de todos os timeouts quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Hook para sincronização SIMPLIFICADA - evita loops infinitos
  useRealtimeSync({
    onTasksRefreshed: () => {
      console.log("useTasksView: onTasksRefreshed");
      if (!useBackendKanban) {
        fetchLocalTasks();
      }
    },
    onTaskCreated: (task) => {
      console.log("useTasksView: onTaskCreated", task?.id);
      // Verificar relevância antes de atualizar
      const isRelevant = (!goalId && !boardId) || 
                        (goalId && task?.goalId === goalId) ||
                        (boardId && task?.boardId === boardId);
      
      if (isRelevant && !useBackendKanban) {
        fetchLocalTasks();
      }
    },
    onTaskMoved: (detail) => {
      console.log("useTasksView: onTaskMoved", detail?.taskId);
      
      // CRUCIAL: Para backend Kanban, NÃO disparar fetchLocalTasks
      if (useBackendKanban && currentBoard) {
        // Apenas aguardar - o useKanban detectará automaticamente
        console.log("useTasksView: Backend Kanban - aguardando detecção automática");
        
        // Se necessário recarregar board específico (apenas uma vez)
        if (boardId && !syncTimeoutRef.current) {
          syncTimeoutRef.current = setTimeout(() => {
            kanbanService.getBoardById(boardId)
              .then(({ board: updatedBoard }) => {
                if (updatedBoard) {
                  // Normalizar o board recarregado
                  const normalizedBoard = {
                    ...updatedBoard,
                    columns: (updatedBoard.columns && Array.isArray(updatedBoard.columns)) ? updatedBoard.columns : []
                  };
                  setSpecificBoard(normalizedBoard);
                  console.log("useTasksView: Board específico recarregado");
                }
              })
              .catch(console.error)
              .finally(() => {
                syncTimeoutRef.current = null;
              });
          }, 2000); // Delay longo para evitar múltiplas chamadas
        }
      } else {
        // Para sistema local, atualizar normalmente
        if (!useBackendKanban) {
          fetchLocalTasks();
        }
      }
    },
    onBoardUpdated: (updatedBoard) => {
      // Apenas atualizar se for exatamente o board que estamos visualizando
      if (useBackendKanban && boardId && updatedBoard?.id === boardId) {
        setSpecificBoard(updatedBoard);
        console.log("useTasksView: Board específico atualizado via evento");
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
    handleOptimisticTaskMove,
      
    // Funções do TaskProvider
    createTaskFromProvider: createTaskFromProviderWithGoal,
    deleteTaskFromProvider,
    moveTaskToColumnProvider,
  };
};
