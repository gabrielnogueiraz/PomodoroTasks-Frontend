import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./Tasks.module.css";
import { useTasksView } from "../../hooks/useTasksView";
import { useMoveTask } from "../../hooks/useMoveTask";
import { useBoardSelector } from "../../hooks/useBoardSelector";
import { createTaskHandlers } from "../../utils/tasksHandlers";
import TaskFormModal from "../../components/TaskFormModal/TaskFormModal";
import Column from "../../components/Column/Column";
import TaskCalendar from "../../components/Calendar/Calendar";
import ViewToggle from "../../components/ViewToggle/ViewToggle";
import TaskDetailModal from "../../components/TaskDetailModal/TaskDetailModal";
import BoardDrawer from "../../components/BoardDrawer";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const Tasks: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const goalIdFromUrl = searchParams.get('goalId');
  
  // Hook para gerenciar seleção de boards
  const boardSelector = useBoardSelector(goalIdFromUrl);
    // Usar goalId do seletor de boards
  const currentGoalId = boardSelector.selectedBoardId;
  
  // Hook principal para gerenciar estado e dados
  const tasksView = useTasksView(currentGoalId);
  
  // Hook para movimento de tarefas
  const { moveTask } = useMoveTask({
    tasks: tasksView.tasks,
    useBackendKanban: Boolean(tasksView.useBackendKanban),
    moveKanbanTask: tasksView.moveKanbanTask,
    moveTaskByStatus: tasksView.moveTaskByStatus,
    localColumns: tasksView.localColumns,
    localTasks: tasksView.localTasks,
    setLocalColumns: tasksView.setLocalColumns,
    setLocalTasks: tasksView.setLocalTasks,
    board: tasksView.board
  });
  
  // Handlers para todas as ações
  const handlers = createTaskHandlers({
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
  });  // Atualizar URL quando board for selecionado
  React.useEffect(() => {
    if (currentGoalId && currentGoalId !== goalIdFromUrl) {
      navigate(`/tasks?goalId=${currentGoalId}`, { replace: true });
    } else if (!currentGoalId && goalIdFromUrl) {
      navigate('/tasks', { replace: true });
    }
  }, [currentGoalId, goalIdFromUrl, navigate]);

  // Memoizar estatísticas para evitar recálculos desnecessários
  const stats = React.useMemo(() => {
    const taskValues = Object.values(tasksView.tasks);
    return {
      pending: taskValues.filter(task => task.status === "pending").length,
      inProgress: taskValues.filter(task => task.status === "in_progress").length,
      completed: taskValues.filter(task => task.status === "completed").length
    };  }, [tasksView.tasks]);

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
      </header>

      {tasksView.viewMode === 'kanban' ? (
        <div className={styles.board}>
          {tasksView.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={column.taskIds
                .map((taskId) => tasksView.tasks[taskId])
                .filter((task) => task !== undefined)}
              moveTask={moveTask}
              onAddTask={handlers.handleAddTask}
              onRenameColumn={handlers.handleRenameColumn}
              onDeleteColumn={handlers.handleDeleteColumn}
              onDeleteTask={handlers.handleDeleteTask}
              onCompleteTask={handlers.handleCompleteTask}
            />
          ))}
          {!tasksView.isAddingColumn ? (
            <button className={styles.addColumnButton} onClick={handlers.handleAddColumn}>
              <div className={styles.addColumnIcon}>+</div>
              <span>Adicionar coluna</span>
            </button>
          ) : (
            <div className={styles.newColumn}>
              <input
                type="text"
                placeholder="Título da coluna"
                value={tasksView.newColumnTitle}
                onChange={(e) => tasksView.setNewColumnTitle(e.target.value)}
                className={styles.newColumnInput}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handlers.handleConfirmAddColumn(tasksView.newColumnTitle);
                  if (e.key === 'Escape') handlers.handleCancelAddColumn();
                }}
              />
              <div className={styles.newColumnActions}>
                <button
                  onClick={() => handlers.handleConfirmAddColumn(tasksView.newColumnTitle)}
                  className={styles.confirmButton}
                >
                  Confirmar
                </button>
                <button
                  onClick={handlers.handleCancelAddColumn}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>      ) : (
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
        deleteLoading={boardSelector.deleteLoading}
        loading={boardSelector.loading}
      />
    </div>
  );
};

export default Tasks;
