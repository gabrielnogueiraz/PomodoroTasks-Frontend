import React, { useCallback, useState, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task } from '../../services/taskService';
import kanbanService from '../../services/kanbanService';
import styles from './KanbanBoard.module.css';

interface TaskItem extends Task {
  columnId: string;
}

interface ColumnType {
  id: string;
  title: string;
  taskIds: string[];
  color?: string;
  position?: number;
}

interface KanbanBoardProps {
  columns: ColumnType[];
  tasks: Record<string, TaskItem>;
  boardId?: string;
  goalId?: string;
  onTaskMove: (taskId: string, sourceColumnId: string, destinationColumnId: string, position: number) => void;
  onTaskClick?: (task: TaskItem) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskComplete?: (taskId: string) => void;
  onColumnAdd?: (columnId: string) => void;
  onColumnUpdate?: (columnId: string, name: string) => void;
  onColumnDelete?: (columnId: string) => void;
}

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasks,
  boardId,
  goalId,
  onTaskMove,
  onTaskClick,
  onTaskDelete,
  onTaskComplete,
  onColumnAdd,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para armazenar estado anterior para rollback
  const previousStateRef = useRef<{
    taskId: string;
    sourceColumnId: string;
    sourceIndex: number;
  } | null>(null);

  // Memoized para evitar re-renders desnecessários
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [columns]);

  // Função para mostrar toast de erro
  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  // Debounced function para salvar no backend
  const debouncedSave = useMemo(
    () => debounce(async (taskId: string, columnId: string, position: number) => {
      try {
        await kanbanService.moveTask(taskId, {
          columnId,
          position
        });
        console.log('Task moved successfully on backend');
      } catch (error) {
        console.error('Failed to move task on backend:', error);
        throw error;
      }
    }, 300),
    []
  );

  // Função otimizada para mover tarefa - APENAS no onDragEnd
  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    setDraggedTaskId(null);

    // Se não há destino, cancela
    if (!destination) {
      return;
    }

    // Se não mudou de posição, cancela
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const taskId = draggableId;
    const sourceColumnId = source.droppableId;
    const destinationColumnId = destination.droppableId;
    const newPosition = destination.index;

    console.log('Moving task:', {
      taskId,
      from: sourceColumnId,
      to: destinationColumnId,
      position: newPosition
    });

    // Salvar estado anterior para rollback
    previousStateRef.current = {
      taskId,
      sourceColumnId,
      sourceIndex: source.index
    };

    // 1. ATUALIZAÇÃO LOCAL IMEDIATA (otimista)
    onTaskMove(taskId, sourceColumnId, destinationColumnId, newPosition);

    // 2. SINCRONIZAÇÃO COM BACKEND (debounced)
    setIsLoading(true);
    try {
      await debouncedSave(taskId, destinationColumnId, newPosition);
      setError(null);
    } catch (error) {
      console.error('Failed to move task on backend:', error);
      
      // ROLLBACK: reverter mudança local se backend falhou
      const previousState = previousStateRef.current;
      if (previousState) {
        onTaskMove(taskId, destinationColumnId, previousState.sourceColumnId, previousState.sourceIndex);
      }
      
      showError('Erro ao mover tarefa. A operação foi desfeita.');
    } finally {
      setIsLoading(false);
      previousStateRef.current = null;
    }
  }, [onTaskMove, debouncedSave, showError]);

  // Callback para início do drag
  const handleDragStart = useCallback((start: any) => {
    setDraggedTaskId(start.draggableId);
  }, []);

  // Render otimizado das tarefas
  const renderTask = useCallback((task: TaskItem, index: number) => {
    const isDragging = draggedTaskId === task.id;
    
    return (
      <Draggable key={task.id} draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`${styles.taskCard} ${
              snapshot.isDragging ? styles.dragging : ''
            } ${task.status === 'completed' ? styles.completed : ''}`}
            onClick={() => onTaskClick?.(task)}
          >
            <div className={styles.taskHeader}>
              <h4 className={styles.taskTitle}>{task.title}</h4>
              <div className={styles.taskActions}>
                {onTaskComplete && (
                  <button
                    className={`${styles.actionButton} ${styles.completeButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete(task.id);
                    }}
                    title={task.status === 'completed' ? 'Desmarcar' : 'Concluir'}
                  >
                    {task.status === 'completed' ? '↺' : '✓'}
                  </button>
                )}
                {onTaskDelete && (
                  <button
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskDelete(task.id);
                    }}
                    title="Excluir tarefa"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className={styles.taskDescription}>{task.description}</p>
            )}
            
            <div className={styles.taskFooter}>
              <span className={`${styles.priority} ${styles[`priority${task.priority?.charAt(0).toUpperCase()}${task.priority?.slice(1)}`]}`}>
                {task.priority?.toUpperCase()}
              </span>
              {task.dueDate && (
                <span className={styles.dueDate}>
                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        )}
      </Draggable>
    );
  }, [draggedTaskId, onTaskClick, onTaskComplete, onTaskDelete]);

  // Render otimizado das colunas
  const renderColumn = useCallback((column: ColumnType) => {
    const columnTasks = column.taskIds
      .map(taskId => tasks[taskId])
      .filter(Boolean)
      .sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      });

    return (
      <div key={column.id} className={styles.column} style={{ backgroundColor: column.color }}>
        <div className={styles.columnHeader}>
          <h3 className={styles.columnTitle}>{column.title}</h3>
          <div className={styles.columnActions}>
            <span className={styles.taskCount}>{columnTasks.length}</span>
            {onColumnAdd && (
              <button
                className={`${styles.actionButton} ${styles.addButton}`}
                onClick={() => onColumnAdd(column.id)}
                title="Adicionar tarefa"
              >
                +
              </button>
            )}
          </div>
        </div>

        <Droppable droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`${styles.taskList} ${
                snapshot.isDraggingOver ? styles.dragOver : ''
              }`}
            >
              {columnTasks.map((task, index) => renderTask(task, index))}
              {provided.placeholder}
              
              {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                <div className={styles.emptyState}>
                  <p>Nenhuma tarefa</p>
                  <p className={styles.emptyHint}>Arraste tarefas aqui</p>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </div>
    );
  }, [tasks, onColumnAdd, renderTask]);

  return (
    <div className={`${styles.kanbanBoard} ${isLoading ? styles.loading : ''}`}>
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <span>Salvando...</span>
        </div>
      )}
      
      {error && (
        <div className={styles.errorToast}>
          <span>{error}</span>
          <button onClick={() => setError(null)} className={styles.closeError}>×</button>
        </div>
      )}
      
      <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className={styles.columnsContainer}>
          {sortedColumns.map(renderColumn)}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
