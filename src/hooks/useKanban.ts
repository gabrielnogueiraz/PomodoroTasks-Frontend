import { useState, useEffect, useCallback } from 'react';
import kanbanService, { KanbanBoard, KanbanColumn, CreateColumnData, UpdateColumnData, MoveTaskData } from '../services/kanbanService';

export const useKanban = (goalId?: string) => {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [boards, setBoards] = useState<KanbanBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardByGoal = useCallback(async (goalId: string) => {
    try {
      setLoading(true);
      setError(null);
      const { board } = await kanbanService.getBoardByGoal(goalId);
      setBoard(board);
    } catch (err) {
      setError('Erro ao carregar quadro da meta');
      console.error('Erro ao buscar quadro:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { boards } = await kanbanService.getUserBoards();
      setBoards(boards);
    } catch (err) {
      setError('Erro ao carregar quadros');
      console.error('Erro ao buscar quadros:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createColumn = useCallback(async (boardId: string, data: CreateColumnData) => {
    try {
      const { column } = await kanbanService.createColumn(boardId, data);
      setBoard(prev => {
        if (!prev || prev.id !== boardId) return prev;
        return {
          ...prev,
          columns: [...prev.columns, column].sort((a, b) => a.position - b.position)
        };
      });
      return column;
    } catch (err) {
      setError('Erro ao criar coluna');
      throw err;
    }
  }, []);

  const updateColumn = useCallback(async (columnId: string, data: UpdateColumnData) => {
    try {
      const { column } = await kanbanService.updateColumn(columnId, data);
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map(col => 
            col.id === columnId ? { ...col, ...column } : col
          )
        };
      });
      return column;
    } catch (err) {
      setError('Erro ao atualizar coluna');
      throw err;
    }
  }, []);

  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      await kanbanService.deleteColumn(columnId);
      setBoard(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.filter(col => col.id !== columnId)
        };
      });
    } catch (err) {
      setError('Erro ao deletar coluna');
      throw err;
    }
  }, []);

  const reorderColumns = useCallback(async (boardId: string, columnIds: string[]) => {
    try {
      const { columns } = await kanbanService.reorderColumns(boardId, { columnIds });
      setBoard(prev => {
        if (!prev || prev.id !== boardId) return prev;
        return {
          ...prev,
          columns
        };
      });
    } catch (err) {
      setError('Erro ao reordenar colunas');
      throw err;
    }
  }, []);

  const moveTask = useCallback(async (taskId: string, data: MoveTaskData) => {
    try {
      const { task } = await kanbanService.moveTask(taskId, data);
      setBoard(prev => {
        if (!prev) return prev;
        
        const newColumns = prev.columns.map(column => ({
          ...column,
          tasks: column.tasks.filter(t => t.id !== taskId)
        }));
        
        const targetColumnIndex = newColumns.findIndex(col => col.id === data.columnId);
        if (targetColumnIndex !== -1) {
          newColumns[targetColumnIndex].tasks.push(task);
          newColumns[targetColumnIndex].tasks.sort((a, b) => a.position - b.position);
        }
        
        return {
          ...prev,
          columns: newColumns
        };
      });
      return task;
    } catch (err) {
      setError('Erro ao mover tarefa');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (goalId) {
      fetchBoardByGoal(goalId);
    } else {
      fetchUserBoards();
    }
  }, [goalId, fetchBoardByGoal, fetchUserBoards]);

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
    refreshBoard: goalId ? () => fetchBoardByGoal(goalId) : fetchUserBoards
  };
};

export default useKanban;
