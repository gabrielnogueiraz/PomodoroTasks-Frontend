import { useState, useEffect, useCallback } from 'react';
import { useGoals } from './useGoals';
import { useKanban } from './useKanban';
import kanbanService, { CreateBoardData } from '../services/kanbanService';

export interface BoardSelectorOption {
  id: string;
  name: string;
  goalId?: string;
  goalTitle?: string;
  isDefault?: boolean;
  boardId?: string; // Para quadros independentes
  type: 'goal' | 'standalone'; // Tipo do quadro
}

export const useBoardSelector = (initialGoalId?: string | null) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialGoalId || null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Hook para carregar goals/metas
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useGoals();
    // Hook para carregar boards (sem goalId para pegar todos)
  const { boards, loading: boardsLoading, refreshBoard } = useKanban();// Preparar opções do seletor - quadros das metas + quadros independentes
  const boardOptions: BoardSelectorOption[] = [
    // Quadros das metas
    ...goals.map(goal => ({
      id: goal.id,
      name: `${goal.title}`,
      goalId: goal.id,
      goalTitle: goal.title,
      type: 'goal' as const
    })),
    // Quadros independentes
    ...boards.map(board => ({
      id: board.id,
      name: board.name,
      boardId: board.id,
      type: 'standalone' as const
    }))
  ];  // Encontrar board selecionado
  const selectedBoard = boardOptions.find(board => 
    board.type === 'goal' 
      ? board.goalId === selectedBoardId
      : board.boardId === selectedBoardId
  ) || boardOptions[0] || null;

  // Função para alternar drawer
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Função para fechar drawer
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);  // Função para selecionar board
  const selectBoard = useCallback((boardId: string) => {
    setSelectedBoardId(boardId);
    setIsDrawerOpen(false);
  }, []);
  // Função para criar novo board
  const createBoard = useCallback(async (boardData: CreateBoardData) => {
    try {
      setCreateLoading(true);
      
      // Chamar API para criar o board
      const response = await kanbanService.createStandaloneBoard(boardData);
      
      // Atualizar listas para refletir a criação
      await Promise.all([refreshGoals(), refreshBoard()]);
      
      // Selecionar o novo board criado
      setSelectedBoardId(response.board.id);
      
      console.log('Quadro criado com sucesso:', response.board);
      return response.board;
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
      throw error;
    } finally {
      setCreateLoading(false);
    }
  }, [refreshGoals, refreshBoard]);

  // Função para excluir board
  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      setDeleteLoading(boardId);
      
      // Buscar o board para obter o tipo e ID correto
      const boardToDelete = boardOptions.find(board => 
        board.type === 'goal' 
          ? board.goalId === boardId
          : board.boardId === boardId
      );
      
      if (!boardToDelete) {
        throw new Error('Quadro não encontrado');
      }

      // Chamar API para excluir o board
      const deleteId = boardToDelete.type === 'goal' 
        ? boardToDelete.goalId 
        : boardToDelete.boardId;
        
      if (!deleteId) {
        throw new Error('ID do quadro não encontrado');
      }
      
      await kanbanService.deleteBoard(deleteId);
      
      // Atualizar listas para refletir a exclusão
      await Promise.all([refreshGoals(), refreshBoard()]);
      
      // Se o board excluído era o selecionado, selecionar outro
      if (selectedBoardId === boardId) {
        const remainingBoards = boardOptions.filter(board => 
          board.type === 'goal' 
            ? board.goalId !== boardId
            : board.boardId !== boardId
        );
        setSelectedBoardId(remainingBoards[0]?.id || null);
      }
      
      console.log('Quadro excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir quadro:', error);
      throw error;
    } finally {
      setDeleteLoading(null);
    }
  }, [boardOptions, selectedBoardId, refreshGoals, refreshBoard]);
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
    
    // Criação
    createBoard,
    createLoading,
    
    // Exclusão
    deleteBoard,
    deleteLoading,
    
    // Loading
    loading: goalsLoading || boardsLoading
  };
};
