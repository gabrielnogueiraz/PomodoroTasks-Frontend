import { useState, useCallback, useRef, useMemo } from 'react';
import { Task } from '../services/taskService';
import kanbanService, { KanbanBoard, KanbanColumn, KanbanTask } from '../services/kanbanService';

export interface TaskItem extends Task {
  columnId: string;
}

export interface ColumnType {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
  position?: number;
}

export interface KanbanState {
  columns: ColumnType[];
  tasks: Record<string, TaskItem>;
  board: KanbanBoard | null;
  loading: boolean;
  error: string | null;
}

export interface UseOptimizedKanbanReturn extends KanbanState {
  moveTask: (taskId: string, sourceColumnId: string, destinationColumnId: string, position: number) => void;
  refreshBoard: () => Promise<void>;
  initialized: boolean;
}

export const useOptimizedKanban = (
  goalId: string | null, 
  boardId: string | null
): UseOptimizedKanbanReturn => {
  const [state, setState] = useState<KanbanState>({
    columns: [],
    tasks: {},
    board: null,
    loading: false,
    error: null
  });

  const [initialized, setInitialized] = useState(false);
  
  // Refs para controle de cache e throttling
  const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const lastFetchRef = useRef<{ goalId: string | null; boardId: string | null; timestamp: number } | null>(null);
  const updateQueueRef = useRef<Array<() => Promise<void>>>([]);
  const processingRef = useRef(false);
  
  const CACHE_DURATION = 30000; // 30 segundos

  // Função para converter dados do backend
  const convertToKanbanState = useCallback((board: KanbanBoard): Pick<KanbanState, 'columns' | 'tasks'> => {
    const columns: ColumnType[] = [];
    const tasks: Record<string, TaskItem> = {};

    if (board.columns && Array.isArray(board.columns)) {
      board.columns
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .forEach((col: KanbanColumn) => {
          // Converter coluna
          const column: ColumnType = {
            id: col.id,
            title: col.name,
            taskIds: (col.tasks || []).map(task => task.id),
            color: col.color,
            position: col.position
          };
          columns.push(column);

          // Converter tarefas
          if (col.tasks && Array.isArray(col.tasks)) {
            col.tasks.forEach((task: KanbanTask) => {
              tasks[task.id] = {
                id: task.id,
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.isCompleted ? 'completed' : 'pending',
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                dueDate: task.dueDate,
                columnId: col.id,
                estimatedPomodoros: 1,
                completedPomodoros: 0,
                isCompleted: task.isCompleted
              };
            });
          }
        });
    }

    return { columns, tasks };
  }, []);

  // Função otimizada para buscar dados
  const fetchBoard = useCallback(async (forceRefresh = false): Promise<void> => {
    const cacheKey = `board_${goalId || boardId}`;
    const now = Date.now();
    
    // Verificar cache
    if (!forceRefresh) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('useOptimizedKanban: Usando dados em cache');
        const { columns, tasks } = convertToKanbanState(cached.data);
        setState(prev => ({
          ...prev,
          columns,
          tasks,
          board: cached.data,
          loading: false,
          error: null
        }));
        setInitialized(true);
        return;
      }

      // Verificar se já buscamos recentemente
      const lastFetch = lastFetchRef.current;
      if (lastFetch && 
          lastFetch.goalId === goalId && 
          lastFetch.boardId === boardId &&
          (now - lastFetch.timestamp) < 5000) {
        console.log('useOptimizedKanban: Fetch recente, pulando');
        return;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      console.log(`useOptimizedKanban: Buscando board (goalId: ${goalId}, boardId: ${boardId})`);
      
      let board: KanbanBoard;
      
      if (goalId) {
        const response = await kanbanService.getBoardByGoal(goalId);
        board = response.board;
      } else if (boardId) {
        const response = await kanbanService.getBoardById(boardId);
        board = response.board;
      } else {
        throw new Error('goalId ou boardId deve ser fornecido');
      }

      // Normalizar board
      const normalizedBoard = {
        ...board,
        columns: (board.columns && Array.isArray(board.columns)) ? board.columns : []
      };

      // Converter dados
      const { columns, tasks } = convertToKanbanState(normalizedBoard);

      // Atualizar estado
      setState(prev => ({
        ...prev,
        columns,
        tasks,
        board: normalizedBoard,
        loading: false,
        error: null
      }));

      // Atualizar cache
      cacheRef.current.set(cacheKey, { data: normalizedBoard, timestamp: now });
      lastFetchRef.current = { goalId, boardId, timestamp: now };
      
      console.log(`useOptimizedKanban: Board carregado com ${columns.length} colunas e ${Object.keys(tasks).length} tarefas`);
      setInitialized(true);

    } catch (error) {
      console.error('useOptimizedKanban: Erro ao buscar board:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao carregar quadro'
      }));
    }
  }, [goalId, boardId, convertToKanbanState]);

  // Função para processar fila de atualizações
  const processUpdateQueue = useCallback(async () => {
    if (processingRef.current || updateQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    try {
      // Processar todas as atualizações em lote
      await Promise.all(updates.map(update => update()));
      console.log(`useOptimizedKanban: Processadas ${updates.length} atualizações`);
    } catch (error) {
      console.error('useOptimizedKanban: Erro ao processar atualizações:', error);
    } finally {
      processingRef.current = false;
    }
  }, []);

  // Função otimizada para mover tarefa (APENAS local, sem backend)
  const moveTask = useCallback((
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    position: number
  ) => {
    console.log('useOptimizedKanban: Movendo tarefa localmente', {
      taskId,
      sourceColumnId,
      destinationColumnId,
      position
    });    setState(prev => {
      // Verificar se a tarefa existe
      if (!prev.tasks[taskId]) {
        console.error(`Task ${taskId} not found when trying to move`);
        return prev;
      }

      const newColumns = prev.columns.map(col => {
        if (col.id === sourceColumnId) {
          // Remover da coluna origem
          return {
            ...col,
            taskIds: col.taskIds.filter(id => id !== taskId)
          };
        } else if (col.id === destinationColumnId) {
          // Adicionar na coluna destino na posição correta
          const newTaskIds = [...col.taskIds];
          const insertIndex = Math.min(position, newTaskIds.length);
          newTaskIds.splice(insertIndex, 0, taskId);
          return {
            ...col,
            taskIds: newTaskIds
          };
        }
        return col;
      });

      const newTasks = {
        ...prev.tasks,
        [taskId]: {
          ...prev.tasks[taskId],
          columnId: destinationColumnId
        }
      };

      return {
        ...prev,
        columns: newColumns,
        tasks: newTasks
      };
    });

    // Adicionar à fila de atualizações para o backend
    updateQueueRef.current.push(async () => {
      await kanbanService.moveTask(taskId, {
        columnId: destinationColumnId,
        position
      });
    });

    // Processar fila com delay
    setTimeout(processUpdateQueue, 500);
  }, [processUpdateQueue]);

  // Função para refresh manual
  const refreshBoard = useCallback(async () => {
    await fetchBoard(true);
  }, [fetchBoard]);

  // Carregar dados inicialmente
  useMemo(() => {
    if ((goalId || boardId) && !initialized) {
      fetchBoard();
    }
  }, [goalId, boardId, initialized, fetchBoard]);

  return {
    ...state,
    moveTask,
    refreshBoard,
    initialized
  };
};
