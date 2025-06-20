import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGoals } from './useGoals';
import { useKanban } from './useKanban';
import kanbanService, { CreateBoardData } from '../services/kanbanService';
import { boardOptimizer } from '../utils/boardOptimizer';

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
  
  // Refs para cache e throttling
  const lastUpdateRef = useRef<number>(0);
  const cacheRef = useRef<Map<string, any>>(new Map());
  const CACHE_DURATION = 30000; // 30 segundos
  
  // Hook para carregar goals/metas
  const { goals, loading: goalsLoading, refresh: refreshGoals } = useGoals();
  
  // Hook para carregar boards (passando null explicitamente para pegar quadros independentes)
  const { boards, loading: boardsLoading, refreshBoard } = useKanban(null);

  // Preparar opções do seletor - quadros das metas + quadros independentes - OTIMIZADO
  const boardOptions: BoardSelectorOption[] = useMemo(() => {
    const cacheKey = boardOptimizer.createCacheKey('boardOptions', goals.length, boards.length);
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      console.log('useBoardSelector: Usando cache para boardOptions');
      return cached.data;
    }
    
    const options = [
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
    ];
    
    // Atualizar cache
    cacheRef.current.set(cacheKey, { data: options, timestamp: now });
    console.log(`useBoardSelector: Cache atualizado com ${options.length} opções`);
    
    return options;
  }, [goals, boards]); // Dependências específicas
  // Encontrar board selecionado - MEMOIZADO
  const selectedBoard = useMemo(() => {
    return boardOptions.find(board => board.id === selectedBoardId) || 
           boardOptions[0] || 
           null;
  }, [boardOptions, selectedBoardId]);

  // Função para alternar drawer - OTIMIZADA
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Função para fechar drawer
  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Função para selecionar board
  const selectBoard = useCallback((boardId: string) => {
    console.log('Selecionando board:', boardId);
    setSelectedBoardId(boardId);
    setIsDrawerOpen(false);
  }, []);

  // Função para criar novo board - OTIMIZADA
  const createBoard = useCallback(async (boardData: CreateBoardData) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) {
      console.log('createBoard: Throttle ativo');
      return;
    }
    
    try {
      setCreateLoading(true);
      lastUpdateRef.current = now;
      
      console.log('Criando quadro:', boardData);
      
      // Chamar API para criar o board
      const response = await kanbanService.createStandaloneBoard(boardData);

      console.log('Quadro criado com sucesso:', response.board.name);
      
      // Primeiro atualizar a lista de quadros
      await refreshBoard();
      
      // Depois selecionar o novo board criado
      setSelectedBoardId(response.board.id);
      
      // Limpar cache
      cacheRef.current.clear();
      
      return response.board;
    } catch (error) {
      console.error('Erro ao criar quadro:', error);
      throw error;
    } finally {
      setCreateLoading(false);
    }
  }, [refreshBoard]);

  // Função para excluir board - OTIMIZADA
  const deleteBoard = useCallback(async (boardId: string) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 1000) {
      console.log('deleteBoard: Throttle ativo');
      return;
    }
    
    try {
      setDeleteLoading(boardId);
      lastUpdateRef.current = now;
      
      // Buscar o board para obter o tipo usando os boardOptions atuais
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
      setSelectedBoardId(prevSelectedBoardId => {
        if (prevSelectedBoardId === boardId) {
          const remainingBoards = boardOptions.filter(board => board.id !== boardId);
          return remainingBoards[0]?.id || null;
        }
        return prevSelectedBoardId;
      });
      
      // Limpar cache
      cacheRef.current.clear();
      
      console.log('Quadro excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir quadro:', error);
      throw error;
    } finally {
      setDeleteLoading(null);
    }
  }, [boardOptions, refreshGoals, refreshBoard]);

  // Atualizar board selecionado quando initialGoalId mudar
  useEffect(() => {
    if (initialGoalId !== undefined) {
      setSelectedBoardId(initialGoalId);
    }
  }, [initialGoalId]);
  // Auto-selecionar primeiro board se não há nenhum selecionado
  useEffect(() => {
    if (!selectedBoardId && boardOptions.length > 0) {
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
