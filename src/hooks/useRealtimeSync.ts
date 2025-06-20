import { useEffect, useCallback, useRef } from 'react';

interface RealtimeSyncOptions {
  onTaskCreated?: (task: any) => void;
  onTaskUpdated?: (task: any) => void;
  onTaskDeleted?: (taskId: string) => void;
  onTasksRefreshed?: (tasks: any[]) => void;
  onColumnCreated?: (column: any) => void; 
  onColumnUpdated?: (column: any) => void;
  onColumnDeleted?: (columnId: string) => void;
  onBoardUpdated?: (board: any) => void;
  onTaskMoved?: (detail: { taskId: string, columnId: string, position: number }) => void;
}

export const useRealtimeSync = (options: RealtimeSyncOptions) => {
  const optionsRef = useRef(options);
  const throttleTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  
  // Atualizar referência sempre que as opções mudarem
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  // Função para throttle de eventos - versão otimizada
  const throttledExecution = useCallback((eventType: string, callback: () => void, delay: number = 500) => {
    // Limpar timeout anterior se existir
    const existingTimeout = throttleTimeouts.current.get(eventType);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Criar novo timeout com delay maior para reduzir requisições
    const newTimeout = setTimeout(() => {
      callback();
      throttleTimeouts.current.delete(eventType);
    }, delay);

    throttleTimeouts.current.set(eventType, newTimeout);
  }, []);
  
  // Função para disparar evento personalizado
  const dispatchTaskEvent = useCallback((eventType: string, detail: any) => {
    try {
      console.log(`useRealtimeSync: Dispatching event ${eventType}`, detail);
      if (!detail) {
        console.warn(`useRealtimeSync: Tentativa de disparar evento ${eventType} com detail indefinido`);
        detail = {}; // Garantir que detail nunca seja undefined
      }
      window.dispatchEvent(new CustomEvent(eventType, { detail }));
    } catch (error) {
      console.error(`useRealtimeSync: Erro ao disparar evento ${eventType}:`, error);
    }
  }, []);

  // Configurar listeners de eventos
  useEffect(() => {    // Handlers para tarefas - com validação e throttling otimizado
    const handleTaskCreated = (event: CustomEvent) => {
      throttledExecution('taskCreated', () => {
        try {
          if (event.detail) {
            optionsRef.current.onTaskCreated?.(event.detail);
          } else {
            console.warn("useRealtimeSync: Evento taskCreated recebido sem dados");
          }
        } catch (error) {
          console.error("useRealtimeSync: Erro ao processar taskCreated", error);
        }
      }, 600); // Aumentado para 600ms
    };

    const handleTaskUpdated = (event: CustomEvent) => {
      throttledExecution('taskUpdated', () => {
        try {
          if (event.detail) {
            optionsRef.current.onTaskUpdated?.(event.detail);
          } else {
            console.warn("useRealtimeSync: Evento taskUpdated recebido sem dados");
          }
        } catch (error) {
          console.error("useRealtimeSync: Erro ao processar taskUpdated", error);
        }
      }, 600); // Aumentado para 600ms
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      throttledExecution('taskDeleted', () => {
        try {
          if (event.detail && event.detail.taskId) {
            optionsRef.current.onTaskDeleted?.(event.detail.taskId);
          } else {
            console.warn("useRealtimeSync: Evento taskDeleted recebido sem taskId válido");
          }
        } catch (error) {
          console.error("useRealtimeSync: Erro ao processar taskDeleted", error);
        }
      }, 400); // Menor delay para exclusões
    };

    const handleTasksRefreshed = (event: CustomEvent) => {
      throttledExecution('tasksRefreshed', () => {
        try {
          if (event.detail) {
            optionsRef.current.onTasksRefreshed?.(event.detail);
          } else {
            console.warn("useRealtimeSync: Evento tasksRefreshed recebido sem dados");
          }        } catch (error) {
          console.error("useRealtimeSync: Erro ao processar tasksRefreshed", error);
        }
      }, 1000); // Aumentado para 1 segundo para evitar múltiplas atualizações
    };
      const handleTaskMoved = (event: CustomEvent) => {
      throttledExecution('taskMoved', () => {
        try {
          if (event.detail && event.detail.taskId && event.detail.columnId) {
            optionsRef.current.onTaskMoved?.(event.detail);
          } else {
            console.warn("useRealtimeSync: Evento taskMoved recebido sem dados válidos", event.detail);
          }
        } catch (error) {
          console.error("useRealtimeSync: Erro ao processar taskMoved", error);
        }
      }, 800); // Aumentado para 800ms para reduzir tremor
    };// Handlers para colunas e boards - com validação adicionada
    const handleColumnCreated = (event: CustomEvent) => {
      try {
        if (event.detail) {
          optionsRef.current.onColumnCreated?.(event.detail);
        } else {
          console.warn("useRealtimeSync: Evento columnCreated recebido sem dados");
        }
      } catch (error) {
        console.error("useRealtimeSync: Erro ao processar columnCreated", error);
      }
    };

    const handleColumnUpdated = (event: CustomEvent) => {
      try {
        if (event.detail) {
          optionsRef.current.onColumnUpdated?.(event.detail);
        } else {
          console.warn("useRealtimeSync: Evento columnUpdated recebido sem dados");
        }
      } catch (error) {
        console.error("useRealtimeSync: Erro ao processar columnUpdated", error);
      }
    };

    const handleColumnDeleted = (event: CustomEvent) => {
      try {
        if (event.detail && event.detail.columnId) {
          optionsRef.current.onColumnDeleted?.(event.detail.columnId);
        } else {
          console.warn("useRealtimeSync: Evento columnDeleted recebido sem columnId válido");
        }
      } catch (error) {
        console.error("useRealtimeSync: Erro ao processar columnDeleted", error);
      }
    };

    const handleBoardUpdated = (event: CustomEvent) => {
      try {
        if (event.detail) {
          optionsRef.current.onBoardUpdated?.(event.detail);
        } else {
          console.warn("useRealtimeSync: Evento boardUpdated recebido sem dados");
        }
      } catch (error) {
        console.error("useRealtimeSync: Erro ao processar boardUpdated", error);
      }
    };

    // Adicionar listeners
    window.addEventListener('taskCreated', handleTaskCreated as EventListener);
    window.addEventListener('taskUpdated', handleTaskUpdated as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);
    window.addEventListener('tasksRefreshed', handleTasksRefreshed as EventListener);
    window.addEventListener('taskMoved', handleTaskMoved as EventListener);
    window.addEventListener('columnCreated', handleColumnCreated as EventListener);
    window.addEventListener('columnUpdated', handleColumnUpdated as EventListener);
    window.addEventListener('columnDeleted', handleColumnDeleted as EventListener);
    window.addEventListener('boardUpdated', handleBoardUpdated as EventListener);

    return () => {
      // Remover listeners na limpeza
      window.removeEventListener('taskCreated', handleTaskCreated as EventListener);
      window.removeEventListener('taskUpdated', handleTaskUpdated as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
      window.removeEventListener('tasksRefreshed', handleTasksRefreshed as EventListener);
      window.removeEventListener('taskMoved', handleTaskMoved as EventListener);
      window.removeEventListener('columnCreated', handleColumnCreated as EventListener);
      window.removeEventListener('columnUpdated', handleColumnUpdated as EventListener);
      window.removeEventListener('columnDeleted', handleColumnDeleted as EventListener);
      window.removeEventListener('boardUpdated', handleBoardUpdated as EventListener);
    };
  }, []);

  return {
    dispatchTaskEvent
  };
};
