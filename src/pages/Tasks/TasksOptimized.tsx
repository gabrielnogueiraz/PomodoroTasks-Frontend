import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./Tasks.module.css";
import { useOptimizedKanban } from "../../hooks/useOptimizedKanban";
import { useSimpleBoardSelector } from "../../hooks/useSimpleBoardSelector";
import KanbanBoard from "../../components/KanbanBoard";
import BoardDrawer from "../../components/BoardDrawer";

const Tasks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const goalIdFromUrl = searchParams.get('goalId');
  const boardIdFromUrl = searchParams.get('boardId');

  // Hook para gerenciar seleção de boards (simplificado)
  const boardSelector = useSimpleBoardSelector(goalIdFromUrl || boardIdFromUrl);

  // Determinar o goalId e boardId corretos
  const { currentGoalId, currentBoardId } = React.useMemo(() => {
    const selectedBoard = boardSelector.selectedBoard;
    if (!selectedBoard) return { currentGoalId: null, currentBoardId: null };
    
    if (selectedBoard.type === 'goal') {
      return { 
        currentGoalId: selectedBoard.goalId || null,
        currentBoardId: null 
      };
    }
    
    return { 
      currentGoalId: null,
      currentBoardId: selectedBoard.boardId || null 
    };
  }, [boardSelector.selectedBoard]);

  // Hook otimizado para dados do Kanban
  const kanban = useOptimizedKanban(currentGoalId, currentBoardId);

  // Atualizar URL quando board for selecionado
  React.useEffect(() => {
    const selectedBoard = boardSelector.selectedBoard;
    
    if (!selectedBoard) return;
    
    const currentGoalId = searchParams.get('goalId');
    const currentBoardId = searchParams.get('boardId');
    
    if (selectedBoard.type === 'goal' && selectedBoard.goalId) {
      if (selectedBoard.goalId !== currentGoalId) {
        navigate(`/tasks?goalId=${selectedBoard.goalId}`, { replace: true });
      }
    } else if (selectedBoard.type === 'standalone' && selectedBoard.boardId) {
      if (selectedBoard.boardId !== currentBoardId) {
        navigate(`/tasks?boardId=${selectedBoard.boardId}`, { replace: true });
      }
    } else if (!selectedBoard.goalId && !selectedBoard.boardId && (currentGoalId || currentBoardId)) {
      navigate('/tasks', { replace: true });
    }
  }, [boardSelector.selectedBoard, searchParams, navigate]);

  // Memoizar estatísticas
  const stats = React.useMemo(() => {
    const taskValues = Object.values(kanban.tasks);
    return {
      pending: taskValues.filter(task => task.status === "pending").length,
      inProgress: taskValues.filter(task => task.status === "in_progress").length,
      completed: taskValues.filter(task => task.status === "completed").length
    };
  }, [kanban.tasks]);

  // Handlers memoizados
  const handleTaskClick = React.useCallback((task: any) => {
    console.log('Task clicked:', task);
    // TODO: Implementar modal de detalhes
  }, []);

  const handleTaskDelete = React.useCallback((taskId: string) => {
    console.log('Delete task:', taskId);
    // TODO: Implementar exclusão
  }, []);

  const handleTaskComplete = React.useCallback((taskId: string) => {
    console.log('Complete task:', taskId);
    // TODO: Implementar conclusão
  }, []);

  const handleColumnAdd = React.useCallback((columnId: string) => {
    console.log('Add task to column:', columnId);
    // TODO: Implementar adição de tarefa
  }, []);

  // Adaptar createBoard para interface do BoardDrawer
  const adaptedCreateBoard = React.useCallback(
    async (data: { name: string; description?: string }): Promise<void> => {
      await boardSelector.createBoard(data);
    },
    [boardSelector]
  );

  // Loading states
  if (boardSelector.loading && !boardSelector.selectedBoard) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.loading}>
          <p>Carregando quadros...</p>
        </div>
      </div>
    );
  }

  if (boardSelector.boardOptions.length === 0) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.emptyState}>
          <h2>Nenhum quadro disponível</h2>
          <p>Você precisa criar uma meta primeiro para ter acesso aos quadros Kanban.</p>
          <button 
            className={styles.createGoalButton}
            onClick={() => navigate('/dashboard')}
          >
            Criar Meta
          </button>
        </div>
      </div>
    );
  }

  if (!kanban.initialized && kanban.loading) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.loading}>
          <p>Carregando quadro Kanban...</p>
        </div>
      </div>
    );
  }

  if (kanban.error) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.error}>
          <p>Erro ao carregar quadro Kanban: {kanban.error}</p>
          <button onClick={() => kanban.refreshBoard()}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tasksPage}>
      {/* Elementos de fundo com blur */}
      <div className={styles.backgroundGradient}></div>
      <div className={styles.backgroundBlob1}></div>
      <div className={styles.backgroundBlob2}></div>
      
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.menuButton}
            onClick={boardSelector.toggleDrawer}
            aria-label="Abrir menu de quadros"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M3 12H21M3 6H21M3 18H21" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
          
          <h1>
            {boardSelector.selectedBoard?.name || 'Carregando...'}
            {boardSelector.selectedBoard?.goalTitle && (
              <span className={styles.goalSubtitle}> - {boardSelector.selectedBoard.goalTitle}</span>
            )}
          </h1>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.pending}</span>
              <span className={styles.statLabel}>A fazer</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.inProgress}</span>
              <span className={styles.statLabel}>Em progresso</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>{stats.completed}</span>
              <span className={styles.statLabel}>Concluídas</span>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.board}>
        <KanbanBoard
          columns={kanban.columns}
          tasks={kanban.tasks}
          boardId={currentBoardId || undefined}
          goalId={currentGoalId || undefined}
          onTaskMove={kanban.moveTask}
          onTaskClick={handleTaskClick}
          onTaskDelete={handleTaskDelete}
          onTaskComplete={handleTaskComplete}
          onColumnAdd={handleColumnAdd}
        />
      </div>      {/* Menu lateral para seleção de quadros */}
      <BoardDrawer
        isOpen={boardSelector.isDrawerOpen}
        onClose={boardSelector.closeDrawer}
        boardOptions={boardSelector.boardOptions}
        selectedBoardId={boardSelector.selectedBoardId}
        onSelectBoard={boardSelector.selectBoard}
        onDeleteBoard={boardSelector.deleteBoard}
        onCreateBoard={adaptedCreateBoard}
        deleteLoading={boardSelector.deleteLoading}
        createLoading={boardSelector.createLoading}
        loading={boardSelector.loading}
      />
    </div>
  );
};

export default Tasks;
