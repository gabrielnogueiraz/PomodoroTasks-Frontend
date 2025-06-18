import { useState, useEffect, useCallback, useMemo } from "react";
import { Task, TaskStatus } from "../services/taskService";
import { useTaskContext } from "./TaskProvider";
import { useKanban } from "./useKanban";
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
  } = useTaskContext();
  
  // Wrapper para createTask que inclui goalId
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
      goalId || undefined
    );
  }, [createTaskFromProvider, goalId]);
  
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
    ? (currentBoard?.columns?.map(convertKanbanColumn).sort((a: ColumnType, b: ColumnType) => (a.position || 0) - (b.position || 0)) || [])
    : localColumns;
    
  const tasks = useBackendKanban
    ? (currentBoard?.columns?.reduce((acc: Record<string, TaskItem>, col: KanbanColumn) => {
        col.tasks.forEach((task: KanbanTask) => {
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
  , [allTasks]);

  // Função para carregar tarefas locais (fallback quando não há Kanban do backend)
  const fetchLocalTasks = useCallback(async () => {
    if (useBackendKanban) return; // Não fazer nada se estamos usando backend Kanban
    
    try {
      console.log("Carregando tarefas locais...");
      
      // Criar mapa de tarefas locais baseado no TaskProvider
      const taskMap: Record<string, TaskItem> = {};
      const columnMap: Record<string, ColumnType> = {
        "col-1": { id: "col-1", title: "A fazer", taskIds: [], color: "#e3f2fd", position: 0 },
        "col-2": { id: "col-2", title: "Em progresso", taskIds: [], color: "#fff3e0", position: 1 },
        "col-3": { id: "col-3", title: "Concluído", taskIds: [], color: "#e8f5e9", position: 2 }
      };

      // Distribuir as tarefas nas colunas corretas
      allTasks.forEach((task) => {
        if (task.status === "cancelled") {
          return;
        }

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

      // Atualizar os estados locais
      setLocalTasks(taskMap);
      setLocalColumns(updatedColumns);

      console.log("Tarefas locais carregadas:", Object.keys(taskMap).length, "tarefas");
    } catch (error) {
      console.error("Erro ao carregar tarefas locais:", error);
    }
  }, [allTasks, useBackendKanban]);

  // Effect para carregar tarefas inicialmente
  useEffect(() => {
    fetchLocalTasks();
  }, [fetchLocalTasks]);  // Effect para atualizar calendar key quando necessário
  useEffect(() => {
    if (viewMode === 'calendar') {
      setCalendarKey(prev => prev + 1);
    }
  }, [viewMode]); // Removido allTasksForCalendar da dependência para evitar loop

  // Effect separado para atualizar calendário quando as tarefas mudarem
  useEffect(() => {
    if (viewMode === 'calendar') {
      const timeoutId = setTimeout(() => {
        setCalendarKey(prev => prev + 1);
      }, 100); // Debounce de 100ms
      
      return () => clearTimeout(timeoutId);
    }
  }, [allTasks.length, viewMode]); // Usar length ao invés do array completo

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
