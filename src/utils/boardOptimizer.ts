import { TaskItem, ColumnType } from '../hooks/useTasksView';
import { KanbanTask, KanbanColumn } from '../services/kanbanService';

export interface BoardUpdateResult {
  success: boolean;
  error?: string;
  rollbackData?: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    fromIndex: number;
  };
}

// Utilitário para debounce de operações
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// Utilitário para throttle de operações
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Utilitário para otimizar operações de board Kanban
 */
export class BoardOptimizer {
  private static instance: BoardOptimizer;
  private updateQueue: Map<string, any> = new Map();
  private isProcessing = false;

  static getInstance(): BoardOptimizer {
    if (!BoardOptimizer.instance) {
      BoardOptimizer.instance = new BoardOptimizer();
    }
    return BoardOptimizer.instance;
  }

  /**
   * Atualiza o estado local do board de forma otimizada
   */
  updateLocalBoard(
    columns: ColumnType[],
    tasks: Record<string, TaskItem>,
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newPosition: number
  ): { columns: ColumnType[]; tasks: Record<string, TaskItem> } {
    
    const updatedTasks = { ...tasks };
    const updatedColumns = [...columns];

    // Atualizar a tarefa
    if (updatedTasks[taskId]) {
      updatedTasks[taskId] = {
        ...updatedTasks[taskId],
        columnId: destinationColumnId
      };
    }

    // Atualizar as colunas
    const sourceColumn = updatedColumns.find(col => col.id === sourceColumnId);
    const destinationColumn = updatedColumns.find(col => col.id === destinationColumnId);

    if (sourceColumn && destinationColumn) {
      // Remover da coluna origem
      const sourceIndex = updatedColumns.findIndex(col => col.id === sourceColumnId);
      if (sourceIndex >= 0) {
        updatedColumns[sourceIndex] = {
          ...sourceColumn,
          taskIds: sourceColumn.taskIds.filter((id: string) => id !== taskId)
        };
      }

      // Adicionar na coluna destino
      const destinationIndex = updatedColumns.findIndex(col => col.id === destinationColumnId);
      if (destinationIndex >= 0) {
        const newTaskIds = [...destinationColumn.taskIds];
        newTaskIds.splice(newPosition, 0, taskId);
        
        updatedColumns[destinationIndex] = {
          ...destinationColumn,
          taskIds: newTaskIds
        };
      }
    }

    return { columns: updatedColumns, tasks: updatedTasks };
  }

  /**
   * Converte KanbanColumn para ColumnType
   */
  convertKanbanColumn(kanbanColumn: KanbanColumn): ColumnType {
    return {
      id: kanbanColumn.id,
      title: kanbanColumn.name,
      taskIds: kanbanColumn.tasks.map(t => t.id),
      color: kanbanColumn.color,
      position: kanbanColumn.position
    };
  }

  /**
   * Converte KanbanTask para TaskItem
   */
  convertKanbanTask(kanbanTask: KanbanTask): TaskItem {
    return {
      id: kanbanTask.id,
      title: kanbanTask.title,
      description: kanbanTask.description || "",
      priority: kanbanTask.priority,
      status: kanbanTask.isCompleted ? "completed" : "pending",
      createdAt: kanbanTask.createdAt,
      updatedAt: kanbanTask.updatedAt,
      dueDate: kanbanTask.dueDate,
      columnId: kanbanTask.columnId,
      estimatedPomodoros: 1,
      completedPomodoros: 0,
      isCompleted: kanbanTask.isCompleted
    };
  }

  /**
   * Debounce para operações de board
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Throttle para operações de board
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let lastFunc: NodeJS.Timeout;
    let lastRan: number;
    
    return (...args: Parameters<T>) => {
      if (!lastRan) {
        func.apply(this, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  /**
   * Memoização para evitar recálculos desnecessários
   */
  memoize<T extends (...args: any[]) => any>(fn: T): T {
    const cache = new Map();
    
    return ((...args: any[]) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      
      // Limpar cache após 5 minutos para evitar vazamentos de memória
      setTimeout(() => cache.delete(key), 5 * 60 * 1000);
      
      return result;
    }) as T;
  }

  /**
   * Detecta mudanças reais no estado para evitar re-renders desnecessários
   */
  hasStateChanged<T>(prev: T, current: T): boolean {
    if (prev === current) return false;
    
    // Para objetos, fazer comparação profunda simples
    try {
      return JSON.stringify(prev) !== JSON.stringify(current);
    } catch {
      return true;
    }
  }

  /**
   * Otimiza arrays de tarefas removendo duplicatas
   */
  optimizeTaskArray(tasks: TaskItem[]): TaskItem[] {
    const seen = new Set();
    return tasks.filter(task => {
      if (seen.has(task.id)) {
        return false;
      }
      seen.add(task.id);
      return true;
    });
  }

  /**
   * Cria uma chave única para cache baseada em parâmetros
   */
  createCacheKey(...params: any[]): string {
    return params.map(p => typeof p === 'object' ? JSON.stringify(p) : String(p)).join('|');
  }
}

export const boardOptimizer = BoardOptimizer.getInstance();
