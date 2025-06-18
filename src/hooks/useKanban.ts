import { useState, useEffect, useCallback, useRef } from 'react';
import kanbanService, { KanbanBoard, KanbanColumn, KanbanTask, CreateColumnData, UpdateColumnData, MoveTaskData } from '../services/kanbanService';

export const useKanban = (goalId?: string | null) => {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para armazenar o último board ID para recarregamentos
  const lastBoardIdRef = useRef<string | null>(null);
  const lastGoalIdRef = useRef<string | null>(null);

  // Função para notificar mudanças no kanban
  const notifyKanbanChange = useCallback((eventType: string, data: any) => {
    window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }, []);

  const fetchBoardByGoal = useCallback(async (goalId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { board } = await kanbanService.getBoardByGoal(goalId);
      setBoard(board);
      lastBoardIdRef.current = board.id;
      lastGoalIdRef.current = goalId;
      
      // Notificar atualização do board
      notifyKanbanChange('boardUpdated', board);
      
      return board;
    } catch (err) {
      setError('Erro ao carregar quadro da meta');
      console.error('Erro ao buscar quadro:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [notifyKanbanChange]);
  
  const fetchBoardById = useCallback(async (boardId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { board } = await kanbanService.getBoardById(boardId);
      setBoard(board);
      lastBoardIdRef.current = boardId;
      
      // Notificar atualização do board
      notifyKanbanChange('boardUpdated', board);
      
      return board;
    } catch (err) {
      setError('Erro ao carregar quadro específico');
      console.error('Erro ao buscar quadro específico:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [notifyKanbanChange]);
  
  const fetchUserBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Buscando quadros do usuário...');
      const { boards } = await kanbanService.getUserBoards();
      console.log('Quadros encontrados:', boards);
      setBoards(boards);
      
      // Se não temos board atual mas temos boards, selecione o primeiro
      if (!board && boards.length > 0) {
        setBoard(boards[0]);
        lastBoardIdRef.current = boards[0].id;
      }
      
      return boards;
    } catch (err) {
      setError('Erro ao carregar quadros');
      console.error('Erro ao buscar quadros:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [board]);

  const createColumn = useCallback(async (boardId: string, data: CreateColumnData) => {
    try {
      const { column } = await kanbanService.createColumn(boardId, data);
      
      setBoard(prev => {
        if (!prev || prev.id !== boardId) return prev;
        
        const updatedBoard = {
          ...prev,
          columns: [...prev.columns, column].sort((a, b) => a.position - b.position)
        };
        
        // Notificar mudanças
        notifyKanbanChange('columnCreated', column);
        notifyKanbanChange('boardUpdated', updatedBoard);
        
        return updatedBoard;
      });
      
      return column;
    } catch (err) {
      setError('Erro ao criar coluna');
      console.error('Erro ao criar coluna:', err);
      throw err;
    }
  }, [notifyKanbanChange]);

  const updateColumn = useCallback(async (columnId: string, data: UpdateColumnData) => {
    try {
      const { column } = await kanbanService.updateColumn(columnId, data);
      
      setBoard(prev => {
        if (!prev) return prev;
        
        const updatedBoard = {
          ...prev,
          columns: prev.columns.map(col => 
            col.id === columnId ? { ...col, ...column } : col
          )
        };
        
        // Notificar mudanças
        notifyKanbanChange('columnUpdated', column);
        notifyKanbanChange('boardUpdated', updatedBoard);
        
        return updatedBoard;
      });
      
      return column;
    } catch (err) {
      setError('Erro ao atualizar coluna');
      console.error('Erro ao atualizar coluna:', err);
      throw err;
    }
  }, [notifyKanbanChange]);

  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      await kanbanService.deleteColumn(columnId);
        setBoard(prev => {
        if (!prev || !Array.isArray(prev.columns)) return prev;
        
        const updatedBoard = {
          ...prev,
          columns: prev.columns.filter(col => col && col.id !== columnId)
        };
        
        // Notificar mudanças
        notifyKanbanChange('columnDeleted', { columnId });
        notifyKanbanChange('boardUpdated', updatedBoard);
        
        return updatedBoard;
      });
    } catch (err) {
      setError('Erro ao deletar coluna');
      console.error('Erro ao deletar coluna:', err);
      throw err;
    }
  }, [notifyKanbanChange]);

  const reorderColumns = useCallback(async (boardId: string, columnIds: string[]) => {
    try {
      const { columns } = await kanbanService.reorderColumns(boardId, { columnIds });
      
      setBoard(prev => {
        if (!prev || prev.id !== boardId) return prev;
        
        const updatedBoard = {
          ...prev,
          columns
        };
        
        // Notificar mudanças
        notifyKanbanChange('boardUpdated', updatedBoard);
        
        return updatedBoard;
      });
    } catch (err) {
      setError('Erro ao reordenar colunas');
      console.error('Erro ao reordenar colunas:', err);
      throw err;
    }
  }, [notifyKanbanChange]);
  const moveTask = useCallback(async (taskId: string, data: MoveTaskData) => {
    try {
      const { task } = await kanbanService.moveTask(taskId, data);
      
      setBoard(prev => {
        if (!prev || !prev.columns) return prev;
        
        // Remover a tarefa de todas as colunas
        const newColumns = prev.columns.map(column => ({
          ...column,
          tasks: Array.isArray(column.tasks) ? column.tasks.filter(t => t.id !== taskId) : []
        }));
          // Adicionar a tarefa na coluna de destino
        const targetColumnIndex = newColumns.findIndex(col => col.id === data.columnId);
        if (targetColumnIndex !== -1) {
          // Certifique-se de que tasks existe e é um array
          if (!newColumns[targetColumnIndex].tasks) {
            newColumns[targetColumnIndex].tasks = [];
          }
          const columnTasks = Array.isArray(newColumns[targetColumnIndex].tasks) 
            ? newColumns[targetColumnIndex].tasks 
            : [];
          
          // Ordenar por posição, garantindo que o método sort seja chamado em um array
          newColumns[targetColumnIndex].tasks = [...columnTasks, task]
            .sort((a, b) => (a.position || 0) - (b.position || 0));
        }
        
        const updatedBoard = {
          ...prev,
          columns: newColumns
        };
        
        // Notificar mudanças
        notifyKanbanChange('taskMoved', { taskId, columnId: data.columnId, position: data.position });
        notifyKanbanChange('boardUpdated', updatedBoard);
        
        return updatedBoard;
      });
      
      return task;
    } catch (err) {
      setError('Erro ao mover tarefa');
      console.error('Erro ao mover tarefa:', err);
      throw err;
    }
  }, [notifyKanbanChange]);

  // Efeitos para carregamento inicial
  useEffect(() => {
    if (goalId) {
      fetchBoardByGoal(goalId);
      lastGoalIdRef.current = goalId;
    } else if (goalId === null) {
      // Explicitamente buscar quadros do usuário quando goalId for null
      fetchUserBoards();
      lastGoalIdRef.current = null;
    }
  }, [goalId, fetchBoardByGoal, fetchUserBoards]);

  // Atualizar quando eventos de outras partes da aplicação ocorrerem
  useEffect(() => {
    const handleBoardUpdated = (event: CustomEvent) => {
      const updatedBoard = event.detail;
      
      // Se este for o nosso board atual, atualize-o
      if (board && updatedBoard.id === board.id) {
        setBoard(updatedBoard);
      }
    };
    
    const handleTaskMoved = (event: CustomEvent) => {
      const { taskId, columnId } = event.detail;
      
      // Se tiver um boardId, recarregue o board para garantir sincronia
      if (lastBoardIdRef.current) {
        fetchBoardById(lastBoardIdRef.current);
      } else if (lastGoalIdRef.current) {
        fetchBoardByGoal(lastGoalIdRef.current);
      }
    };
    
    window.addEventListener('boardUpdated', handleBoardUpdated as EventListener);
    window.addEventListener('taskMoved', handleTaskMoved as EventListener);
    
    return () => {
      window.removeEventListener('boardUpdated', handleBoardUpdated as EventListener);
      window.removeEventListener('taskMoved', handleTaskMoved as EventListener);
    };
  }, [board, fetchBoardById, fetchBoardByGoal]);

  return {
    board,
    boards,
    loading,
    error,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    moveTask,
    refreshBoard: goalId 
      ? () => fetchBoardByGoal(goalId) 
      : lastBoardIdRef.current 
        ? () => fetchBoardById(lastBoardIdRef.current!) 
        : fetchUserBoards
  };
};

export default useKanban;
