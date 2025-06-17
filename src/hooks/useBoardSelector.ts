import { useState, useEffect, useCallback } from 'react';
import { useGoals } from './useGoals';
import { useKanban } from './useKanban';
import kanbanService from '../services/kanbanService';

export interface BoardSelectorOption {
  id: string;
  name: string;
  goalId?: string;
  goalTitle?: string;
  isDefault?: boolean;
}

export const useBoardSelector = (initialGoalId?: string | null) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialGoalId || null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  
  // Hook para carregar goals/metas
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useGoals();
  
  // Hook para carregar boards (sem goalId para pegar todos)
  const { boards, loading: boardsLoading } = useKanban();
  // Preparar opções do seletor - apenas quadros das metas
  const boardOptions: BoardSelectorOption[] = goals.map(goal => ({
    id: goal.id,
    name: `${goal.title}`,
    goalId: goal.id,
    goalTitle: goal.title
  }));
  // Encontrar board selecionado
  const selectedBoard = boardOptions.find(board => 
    board.goalId === selectedBoardId
  ) || boardOptions[0] || null;

  // Função para alternar drawer
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Função para fechar drawer
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);
  // Função para selecionar board
  const selectBoard = useCallback((boardId: string) => {
    setSelectedBoardId(boardId);
    setIsDrawerOpen(false);
  }, []);
  // Função para excluir board
  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      setDeleteLoading(boardId);
      
      // Buscar o board para obter o goalId
      const boardToDelete = boardOptions.find(board => board.goalId === boardId);
      if (!boardToDelete) {
        throw new Error('Quadro não encontrado');
      }      // Chamar API para excluir o board
      if (!boardToDelete.goalId) {
        throw new Error('ID da meta não encontrado');
      }
      
      await kanbanService.deleteBoard(boardToDelete.goalId);
      
      // Atualizar goals para refletir a exclusão
      await refreshGoals();
      
      // Se o board excluído era o selecionado, selecionar outro
      if (selectedBoardId === boardId) {
        const remainingBoards = boardOptions.filter(board => board.goalId !== boardId);
        setSelectedBoardId(remainingBoards[0]?.goalId || null);
      }
      
      console.log('Quadro excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir quadro:', error);
      throw error;
    } finally {
      setDeleteLoading(null);
    }  }, [boardOptions, selectedBoardId, refreshGoals]);

  // Atualizar board selecionado quando initialGoalId mudar
  useEffect(() => {
    if (initialGoalId !== undefined) {
      setSelectedBoardId(initialGoalId);
    }
  }, [initialGoalId]);

  return {
    // Estado do drawer
    isDrawerOpen,
    toggleDrawer,
    closeDrawer,
    
    // Boards
    boardOptions,
    selectedBoard,
    selectedBoardId: selectedBoardId || boardOptions[0]?.id || null,
    selectBoard,
    
    // Exclusão
    deleteBoard,
    deleteLoading,
    
    // Loading
    loading: goalsLoading || boardsLoading
  };
};
