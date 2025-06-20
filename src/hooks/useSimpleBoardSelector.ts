import { useState, useCallback, useMemo, useRef } from 'react';
import { useGoals } from './useGoals';
import kanbanService, { CreateBoardData, KanbanBoard } from '../services/kanbanService';

export interface BoardOption {
  id: string;
  name: string;
  goalId?: string;
  goalTitle?: string;
  boardId?: string;
  type: 'goal' | 'standalone';
}

export interface UseSimpleBoardSelectorReturn {
  // Estado do drawer
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
  closeDrawer: () => void;
  
  // Boards
  boardOptions: BoardOption[];
  selectedBoard: BoardOption | null;
  selectedBoardId: string | null;
  selectBoard: (boardId: string) => void;
  
  // Criação e exclusão
  createBoard: (data: CreateBoardData) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  createLoading: boolean;
  deleteLoading: string | null;
  
  // Estados
  loading: boolean;
  error: string | null;
}

export const useSimpleBoardSelector = (
  initialBoardId?: string | null
): UseSimpleBoardSelectorReturn => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(initialBoardId || null);
  const [standaloneBoards, setStandaloneBoards] = useState<KanbanBoard[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache e throttling
  const lastFetchRef = useRef<number>(0);
  const cacheRef = useRef<{ boards: KanbanBoard[]; timestamp: number } | null>(null);
  const CACHE_DURATION = 30000;

  // Hook para goals
  const { goals, loading: goalsLoading } = useGoals();

  // Buscar boards independentes
  const fetchStandaloneBoards = useCallback(async () => {
    const now = Date.now();
    
    // Verificar cache
    if (cacheRef.current && (now - cacheRef.current.timestamp) < CACHE_DURATION) {
      setStandaloneBoards(cacheRef.current.boards);
      return;
    }

    // Throttling
    if (now - lastFetchRef.current < 5000) {
      return;
    }

    try {
      setLoading(true);
      lastFetchRef.current = now;
      
      const response = await kanbanService.getUserBoards();
      const boards = response.boards || [];
      
      setStandaloneBoards(boards);
      cacheRef.current = { boards, timestamp: now };
      setError(null);
      
    } catch (err) {
      console.error('Erro ao buscar boards:', err);
      setError('Erro ao carregar quadros');
      setStandaloneBoards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar boards na inicialização
  useMemo(() => {
    fetchStandaloneBoards();
  }, [fetchStandaloneBoards]);

  // Opções de boards memoizadas
  const boardOptions = useMemo((): BoardOption[] => {
    const options: BoardOption[] = [];

    // Adicionar quadros de metas
    goals.forEach(goal => {
      options.push({
        id: goal.id,
        name: goal.title,
        goalId: goal.id,
        goalTitle: goal.title,
        type: 'goal'
      });
    });

    // Adicionar quadros independentes
    standaloneBoards.forEach(board => {
      options.push({
        id: board.id,
        name: board.name,
        boardId: board.id,
        type: 'standalone'
      });
    });

    return options;
  }, [goals, standaloneBoards]);

  // Board selecionado
  const selectedBoard = useMemo(() => {
    return boardOptions.find(board => board.id === selectedBoardId) || boardOptions[0] || null;
  }, [boardOptions, selectedBoardId]);

  // Auto-selecionar primeiro board se não há seleção
  useMemo(() => {
    if (!selectedBoardId && boardOptions.length > 0) {
      setSelectedBoardId(boardOptions[0].id);
    }
  }, [selectedBoardId, boardOptions]);

  // Ações do drawer
  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Selecionar board
  const selectBoard = useCallback((boardId: string) => {
    setSelectedBoardId(boardId);
    setIsDrawerOpen(false);
  }, []);

  // Criar board
  const createBoard = useCallback(async (data: CreateBoardData) => {
    try {
      setCreateLoading(true);
      
      const response = await kanbanService.createStandaloneBoard(data);
      
      // Atualizar lista local
      setStandaloneBoards(prev => [response.board, ...prev]);
      
      // Selecionar o novo board
      setSelectedBoardId(response.board.id);
      
      // Limpar cache
      cacheRef.current = null;
      
    } catch (err) {
      console.error('Erro ao criar board:', err);
      throw err;
    } finally {
      setCreateLoading(false);
    }
  }, []);

  // Excluir board
  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      setDeleteLoading(boardId);
      
      await kanbanService.deleteBoard(boardId);
      
      // Atualizar lista local
      setStandaloneBoards(prev => prev.filter(board => board.id !== boardId));
      
      // Se o board excluído era o selecionado, selecionar outro
      if (selectedBoardId === boardId) {
        const remainingOptions = boardOptions.filter(board => board.id !== boardId);
        setSelectedBoardId(remainingOptions[0]?.id || null);
      }
      
      // Limpar cache
      cacheRef.current = null;
      
    } catch (err) {
      console.error('Erro ao excluir board:', err);
      throw err;
    } finally {
      setDeleteLoading(null);
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
    
    // Criação e exclusão
    createBoard,
    deleteBoard,
    createLoading,
    deleteLoading,
    
    // Estados
    loading: loading || goalsLoading,
    error
  };
};
