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
  console.log('useBoardSelector inicializado com:', initialGoalId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialGoalId || null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  // Hook para carregar goals/metas
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useGoals();
  
  // Hook para carregar boards (passando null explicitamente para pegar quadros independentes)
  const { boards, loading: boardsLoading, refreshBoard } = useKanban(null);  // Preparar opções do seletor - quadros das metas + quadros independentes
  const boardOptions: BoardSelectorOption[] = [
    // Quadros das metas
    ...goals.map(goal => ({
      id: goal.id, // Para metas, o id é o goalId
      name: `${goal.title}`,
      goalId: goal.id,
      goalTitle: goal.title,
      type: 'goal' as const
    })),
    // Quadros independentes
    ...boards.map(board => ({
      id: board.id, // Para quadros independentes, o id é o boardId
      name: board.name,
      boardId: board.id,
      type: 'standalone' as const
    }))
  ];  // Encontrar board selecionado
  const selectedBoard = boardOptions.find(board => board.id === selectedBoardId) || 
                       boardOptions[0] || 
                       null;
  
  // Log para debug
  console.log('useBoardSelector - selectedBoardId:', selectedBoardId);
  console.log('useBoardSelector - selectedBoard:', selectedBoard);
  console.log('useBoardSelector - boardOptions:', boardOptions);

  // Função para alternar drawer
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Função para fechar drawer
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);  // Função para selecionar board
  const selectBoard = useCallback((boardId: string) => {
    console.log('Selecionando board:', boardId);
    setSelectedBoardId(boardId);
    setIsDrawerOpen(false);
  }, []);// Função para criar novo board
  const createBoard = useCallback(async (boardData: CreateBoardData) => {
    try {
      setCreateLoading(true);
      
      console.log('Criando quadro:', boardData);
      
      // Chamar API para criar o board
      const response = await kanbanService.createStandaloneBoard(boardData);
        console.log('Quadro criado com sucesso:', response.board);
      
      // Primeiro atualizar a lista de quadros
      await refreshBoard();
      console.log('Lista de quadros atualizada');
      
      // Depois selecionar o novo board criado
      setSelectedBoardId(response.board.id);
      console.log('Board selecionado:', response.board.id);
      
      return response.board;
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
      throw error;
    } finally {
      setCreateLoading(false);
    }
  }, [refreshBoard]);  // Função para excluir board
  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      setDeleteLoading(boardId);
      
      // Buscar o board para obter o tipo
      const boardToDelete = boardOptions.find(board => board.id === boardId);
      
      if (!boardToDelete) {
        throw new Error('Quadro não encontrado');
      }

      // Chamar API para excluir o board
      await kanbanService.deleteBoard(boardId);
      
      // Atualizar as listas apropriadas baseado no tipo do board
      if (boardToDelete.type === 'goal') {
        await refreshGoals();
      } else {
        await refreshBoard();
      }
      
      // Se o board excluído era o selecionado, selecionar outro
      if (selectedBoardId === boardId) {
        const remainingBoards = boardOptions.filter(board => board.id !== boardId);
        setSelectedBoardId(remainingBoards[0]?.id || null);
      }
      
      console.log('Quadro excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir quadro:', error);
      throw error;
    } finally {
      setDeleteLoading(null);
    }
  }, [boardOptions, selectedBoardId, refreshGoals, refreshBoard]);  // Atualizar board selecionado quando initialGoalId mudar
  useEffect(() => {
    if (initialGoalId !== undefined) {
      setSelectedBoardId(initialGoalId);
    }
  }, [initialGoalId]);

  // Auto-selecionar primeiro board se não há nenhum selecionado
  useEffect(() => {
    if (!selectedBoardId && boardOptions.length > 0) {
      console.log('Auto-selecionando primeiro board:', boardOptions[0].id);
      setSelectedBoardId(boardOptions[0].id);
    }
  }, [selectedBoardId, boardOptions]);

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
