import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./Tasks.module.css";
import { useTasksView } from "../../hooks/useTasksView";
import { useBoardSelector } from "../../hooks/useBoardSelector";
import { createTaskHandlers } from "../../utils/tasksHandlers";
import TaskFormModal from "../../components/TaskFormModal/TaskFormModal";
import KanbanBoard from "../../components/KanbanBoard";
import TaskCalendar from "../../components/Calendar/Calendar";
import ViewToggle from "../../components/ViewToggle/ViewToggle";
import TaskDetailModal from "../../components/TaskDetailModal/TaskDetailModal";
import BoardDrawer from "../../components/BoardDrawer";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const Tasks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const goalIdFromUrl = searchParams.get('goalId');
  const boardIdFromUrl = searchParams.get('boardId');    // Hook para gerenciar seleção de boards
  const boardSelector = useBoardSelector(goalIdFromUrl || boardIdFromUrl);  // Determinar o goalId e boardId corretos baseado no tipo do board selecionado
  const { currentGoalId, currentBoardId } = React.useMemo(() => {
    const selectedBoard = boardSelector.selectedBoard;
    if (!selectedBoard) return { currentGoalId: null, currentBoardId: null };
    
    // Se for um quadro de meta, usar o goalId
    if (selectedBoard.type === 'goal') {
      return { 
        currentGoalId: selectedBoard.goalId || null,
        currentBoardId: null 
      };
    }
    
    // Se for um quadro independente, usar o boardId
    return { 
      currentGoalId: null,
      currentBoardId: selectedBoard.boardId || null 
    };
  }, [boardSelector.selectedBoard]);  // Hook principal para gerenciar estado e dados
  const tasksView = useTasksView(currentGoalId, currentBoardId);  // Handlers para todas as ações - MEMOIZADOS para evitar re-renders
  const handlers = React.useMemo(() => createTaskHandlers({
    setViewMode: tasksView.setViewMode,
    setSelectedTask: tasksView.setSelectedTask,
    setActiveColumnId: tasksView.setActiveColumnId,
    setShowTaskForm: tasksView.setShowTaskForm,
    setSelectedSlotData: tasksView.setSelectedSlotData,
    setIsAddingColumn: tasksView.setIsAddingColumn,
    setNewColumnTitle: tasksView.setNewColumnTitle,
    setLocalColumns: tasksView.setLocalColumns,
    setLocalTasks: tasksView.setLocalTasks,
    tasks: tasksView.tasks,
    columns: tasksView.columns,
    localColumns: tasksView.localColumns,
    localTasks: tasksView.localTasks,
    useBackendKanban: Boolean(tasksView.useBackendKanban),
    board: tasksView.board,
    moveTaskByStatus: tasksView.moveTaskByStatus,
    fetchLocalTasks: tasksView.fetchLocalTasks,
    createTaskFromProvider: tasksView.createTaskFromProvider,
    deleteTaskFromProvider: tasksView.deleteTaskFromProvider,
    createColumn: tasksView.createColumn,
    updateColumn: tasksView.updateColumn,
    deleteColumn: tasksView.deleteColumn,
  }), [
    tasksView.setViewMode,
    tasksView.setSelectedTask,
    tasksView.setActiveColumnId,
    tasksView.setShowTaskForm,
    tasksView.setSelectedSlotData,
    tasksView.setIsAddingColumn,
    tasksView.setNewColumnTitle,
    tasksView.setLocalColumns,
    tasksView.setLocalTasks,
    tasksView.tasks,
    tasksView.columns,
    tasksView.localColumns,
    tasksView.localTasks,
    tasksView.useBackendKanban,
    tasksView.board,
    tasksView.moveTaskByStatus,
    tasksView.fetchLocalTasks,
    tasksView.createTaskFromProvider,
    tasksView.deleteTaskFromProvider,
    tasksView.createColumn,
    tasksView.updateColumn,
    tasksView.deleteColumn,
  ]);

  // Handlers específicos para o KanbanBoard
  const handleTaskClick = React.useCallback((task: any) => {
    tasksView.setSelectedTask(task);
  }, [tasksView.setSelectedTask]);

  const handleTaskDelete = React.useCallback((taskId: string) => {
    handlers.handleDeleteTask(taskId, { preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent);
  }, [handlers]);

  const handleTaskComplete = React.useCallback((taskId: string) => {
    handlers.handleCompleteTask(taskId, { preventDefault: () => {}, stopPropagation: () => {} } as React.MouseEvent);
  }, [handlers]);  // Atualizar URL quando board for selecionado - OTIMIZADO
  React.useEffect(() => {
    const selectedBoard = boardSelector.selectedBoard;
    
    if (!selectedBoard) return;
    
    // Evitar navegações desnecessárias comparando com a URL atual
    const currentGoalId = searchParams.get('goalId');
    const currentBoardId = searchParams.get('boardId');
    
    // Para quadros de meta: usar goalId na URL
    if (selectedBoard.type === 'goal' && selectedBoard.goalId) {
      if (selectedBoard.goalId !== currentGoalId) {
        navigate(`/tasks?goalId=${selectedBoard.goalId}`, { replace: true });
      }
    }
    // Para quadros independentes: usar boardId na URL
    else if (selectedBoard.type === 'standalone' && selectedBoard.boardId) {
      if (selectedBoard.boardId !== currentBoardId) {
        navigate(`/tasks?boardId=${selectedBoard.boardId}`, { replace: true });
      }
    }
    // Limpar URL se não há board selecionado
    else if (!selectedBoard.goalId && !selectedBoard.boardId && (currentGoalId || currentBoardId)) {
      navigate('/tasks', { replace: true });
    }
  }, [boardSelector.selectedBoard, searchParams, navigate]); // Usar searchParams em vez de goalIdFromUrl/boardIdFromUrl
  // Memoizar estatísticas para evitar recálculos desnecessários
  const stats = React.useMemo(() => {
    const taskValues = Object.values(tasksView.tasks);
    return {
      pending: taskValues.filter((task: any) => task.status === "pending").length,
      inProgress: taskValues.filter((task: any) => task.status === "in_progress").length,
      completed: taskValues.filter((task: any) => task.status === "completed").length
    };
  }, [tasksView.tasks]);

  // Adaptar a função createBoard para compatibilidade com a interface de BoardDrawer
  const adaptedCreateBoard = React.useCallback(
    async (data: { name: string; description?: string }): Promise<void> => {
      await boardSelector.createBoard(data);
      // Retorna void explicitamente para satisfazer a interface
    },
    [boardSelector]
  );

  // Verificar loading primeiro
  if (boardSelector.loading) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.loading}>
          <p>Carregando quadros...</p>
        </div>
      </div>
    );
  }

  // Verificar se há quadros disponíveis
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
    );  }

  // Mostrar loading enquanto carrega dados do backend
  if (currentGoalId && tasksView.kanbanLoading) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.loading}>
          <p>Carregando quadro Kanban...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver problema ao carregar dados do backend
  if (currentGoalId && tasksView.kanbanError) {
    return (
      <div className={styles.tasksPage}>
        <div className={styles.error}>
          <p>Erro ao carregar quadro Kanban: {tasksView.kanbanError}</p>
          <p>Usando modo local...</p>
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
      
      <header className={styles.header}>        <div className={styles.headerLeft}>
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
          </button>          <h1>
            {boardSelector.selectedBoard?.name || 'Carregando...'}
            {boardSelector.selectedBoard?.goalTitle && (
              <span className={styles.goalSubtitle}> - {boardSelector.selectedBoard.goalTitle}</span>
            )}
          </h1>
        </div>
        <div className={styles.headerCenter}>
          <ViewToggle 
            currentView={tasksView.viewMode} 
            onViewChange={handlers.handleViewChange} 
          />
        </div>
        <div className={styles.headerRight}>          <div className={styles.statsCard}>
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
      </header>      {tasksView.viewMode === 'kanban' ? (
        <div className={styles.board}>
          <KanbanBoard
            columns={tasksView.columns}
            tasks={tasksView.tasks}
            boardId={currentBoardId || undefined}
            goalId={currentGoalId || undefined}
            onTaskMove={tasksView.handleOptimisticTaskMove}            onTaskClick={handleTaskClick}
            onTaskDelete={handleTaskDelete}
            onTaskComplete={handleTaskComplete}
            onColumnAdd={handlers.handleAddTask}
            onColumnUpdate={handlers.handleRenameColumn}
            onColumnDelete={handlers.handleDeleteColumn}
          />
          
          {/* Adicionar nova coluna */}
          {!tasksView.isAddingColumn ? (
            <div className={styles.addColumnContainer}>
              <button className={styles.addColumnButton} onClick={handlers.handleAddColumn}>
                <div className={styles.addColumnIcon}>+</div>
                <span>Adicionar coluna</span>
              </button>
            </div>
          ) : (
            <div className={styles.newColumnContainer}>
              <div className={styles.newColumn}>
                <input
                  type="text"
                  placeholder="Título da coluna"
                  value={tasksView.newColumnTitle}
                  onChange={(e) => tasksView.setNewColumnTitle(e.target.value)}
                  className={styles.newColumnInput}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlers.handleConfirmAddColumn(tasksView.newColumnTitle);
                    if (e.key === 'Escape') handlers.handleCancelAddColumn();
                  }}
                />
                <div className={styles.newColumnActions}>
                  <button
                    onClick={() => handlers.handleConfirmAddColumn(tasksView.newColumnTitle)}
                    className={styles.confirmButton}
                  >
                    ✓
                  </button>
                  <button
                    onClick={handlers.handleCancelAddColumn}
                    className={styles.cancelButton}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>) : (
        <TaskCalendar
          key={tasksView.calendarKey}
          tasks={tasksView.allTasksForCalendar}
          onTaskSelect={handlers.handleCalendarTaskSelect}
          onSlotSelect={handlers.handleCalendarSlotSelect}
        />
      )}

      {tasksView.showTaskForm && tasksView.activeColumnId && (
        <TaskFormModal
          columnId={tasksView.activeColumnId}
          onClose={() => {
            tasksView.setShowTaskForm(false);
            tasksView.setSelectedSlotData(null);
          }}
          onSubmit={(columnId, taskData) => 
            handlers.handleCreateTask(columnId, taskData, tasksView.selectedSlotData)
          }
          initialData={tasksView.selectedSlotData || undefined}
        />
      )}      {tasksView.selectedTask && (
        <TaskDetailModal
          task={tasksView.selectedTask}
          onClose={handlers.handleCloseTaskDetail}
          onEdit={handlers.handleEditTaskFromDetail}
          onDelete={handlers.handleDeleteTaskFromDetail}
          onComplete={handlers.handleCompleteTaskFromDetail}
        />
      )}      {/* Menu lateral para seleção de quadros */}
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
