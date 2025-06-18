import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import taskService, { Task } from "../services/taskService";
import kanbanService from "../services/kanbanService";
import productivityAnalyticsService from "../services/productivityAnalyticsService";

interface TaskContextType {
  tasks: Task[];
  selectedTaskId: string | undefined;
  setSelectedTaskId: (id: string | undefined) => void;
  createTask: (
    title: string,
    priority: "low" | "medium" | "high",
    description?: string,
    startDate?: string,
    endDate?: string,
    startTime?: string,
    endTime?: string,
    columnId?: string,
    goalId?: string,
    boardId?: string
  ) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  moveTaskToColumn: (taskId: string, columnId: string, position: number) => Promise<void>;  refreshTasks: () => Promise<Task[]>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext deve ser usado dentro de um TaskProvider");
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(
    undefined
  );

  // Função otimizada para disparar eventos
  const notifyTaskChange = useCallback((eventType: string, data: any) => {
    console.log(`Notificando evento: ${eventType}`, data);
    window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  }, []);

  const refreshTasks = async () => {
    try {
      console.log("Refreshing tasks...");
      const allTasks = await taskService.getTasks();
      const activeTasks = allTasks.filter(task => task.status !== 'cancelled');
      
      console.log(`Loaded ${activeTasks.length} active tasks`);
      setTasks(activeTasks);
      
      // Disparar evento para notificar outros componentes sobre a atualização
      notifyTaskChange('tasksRefreshed', activeTasks);
      return activeTasks;
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      return [];
    }
  };

  useEffect(() => {
    console.log("TaskProvider inicializando, carregando tarefas...");
    refreshTasks();
  }, []);

  // Escutar eventos de outros componentes para manter sincronização
  useEffect(() => {
    const handleTaskCreatedFromOtherComponent = (event: CustomEvent) => {
      const newTask = event.detail;
      console.log("Task created event received:", newTask);
      
      setTasks(prevTasks => {
        const taskExists = prevTasks.some(task => task.id === newTask.id);
        if (!taskExists) {
          return [newTask, ...prevTasks];
        }
        return prevTasks;
      });
    };

    const handleTaskDeletedFromOtherComponent = (event: CustomEvent) => {
      const { taskId } = event.detail;
      console.log("Task deleted event received:", taskId);
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      if (taskId === selectedTaskId) {
        setSelectedTaskId(undefined);
      }
    };

    const handleTaskUpdatedFromOtherComponent = (event: CustomEvent) => {
      const updatedTask = event.detail;
      console.log("Task updated event received:", updatedTask);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id ? { ...task, ...updatedTask } : task
        )
      );
    };
      const handleTaskMovedFromOtherComponent = (event: CustomEvent) => {
      if (!event.detail) {
        console.warn("Task moved event received without detail");
        return;
      }
      
      const { taskId, columnId } = event.detail;
      console.log("Task moved event received:", { taskId, columnId });
      
      if (!taskId || !columnId) {
        console.warn("Task moved event missing taskId or columnId", event.detail);
        return;
      }
      
      // Atualizar columnId na tarefa correspondente
      setTasks(prevTasks => {
        // Verificar se a tarefa existe
        const taskExists = prevTasks.some(task => task.id === taskId);
        if (!taskExists) {
          console.warn(`Task ${taskId} not found when trying to move`);
          return prevTasks;
        }
        
        return prevTasks.map(task => 
          task.id === taskId ? { ...task, columnId } : task
        );
      });
    };

    window.addEventListener('taskCreated', handleTaskCreatedFromOtherComponent as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeletedFromOtherComponent as EventListener);
    window.addEventListener('taskUpdated', handleTaskUpdatedFromOtherComponent as EventListener);
    window.addEventListener('taskMoved', handleTaskMovedFromOtherComponent as EventListener);

    return () => {
      window.removeEventListener('taskCreated', handleTaskCreatedFromOtherComponent as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeletedFromOtherComponent as EventListener);
      window.removeEventListener('taskUpdated', handleTaskUpdatedFromOtherComponent as EventListener);
      window.removeEventListener('taskMoved', handleTaskMovedFromOtherComponent as EventListener);
    };
  }, [selectedTaskId]);

  const createTask = async (
    title: string,
    priority: "low" | "medium" | "high",
    description?: string,
    startDate?: string,
    endDate?: string,
    startTime?: string,
    endTime?: string,
    columnId?: string,
    goalId?: string,
    boardId?: string
  ): Promise<Task> => {
    try {
      console.log("Creating task:", {
        title, priority, description, startDate, endDate, startTime, endTime, columnId, goalId, boardId
      });
      
      const taskData = {
        title,
        priority,
        description,
        startDate,
        endDate,
        startTime,
        endTime,
        estimatedPomodoros: 1,
        columnId,
        goalId,
        boardId,
      };
      
      const newTask = await taskService.createTask(taskData);
      console.log("Task created successfully:", newTask);
      
      // Atualizar estado local
      setTasks(prevTasks => [newTask, ...prevTasks]);
      
      // Disparar eventos para notificar componentes sobre a nova tarefa
      notifyTaskChange('taskCreated', newTask);
      notifyTaskChange('tasksRefreshed', [newTask, ...tasks]);
      
      return newTask;
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      console.log("Deleting task:", taskId);
      await taskService.updateTaskStatus(taskId, "cancelled");
      
      const updatedTasks = tasks.filter((task) => task.id !== taskId);
      setTasks(updatedTasks);

      if (taskId === selectedTaskId) {
        setSelectedTaskId(undefined);
      }
      
      // Disparar eventos para notificar componentes sobre a exclusão
      notifyTaskChange('taskDeleted', { taskId });
      notifyTaskChange('tasksRefreshed', updatedTasks);
      
      console.log("Task deleted successfully:", taskId);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      console.log("Completing task:", taskId);
      const updatedTask = await taskService.completeTask(taskId);
      
      // Registrar conclusão para analytics
      await productivityAnalyticsService.recordTaskCompletion({
        taskId,
        completedAt: new Date().toISOString(),
        productivityScore: 5.0
      });

      const updatedTasks = tasks.map((task) => (task.id === taskId ? updatedTask : task));
      setTasks(updatedTasks);
      
      // Disparar eventos para notificar componentes sobre a atualização
      notifyTaskChange('taskUpdated', updatedTask);
      notifyTaskChange('tasksRefreshed', updatedTasks);
      
      console.log("Task completed successfully:", updatedTask);
    } catch (error) {
      console.error("Erro ao marcar tarefa como concluída:", error);
      throw error;
    }
  };

  const uncompleteTask = async (taskId: string) => {
    try {
      console.log("Uncompleting task:", taskId);
      const updatedTask = await taskService.uncompleteTask(taskId);
      
      const updatedTasks = tasks.map((task) => (task.id === taskId ? updatedTask : task));
      setTasks(updatedTasks);
      
      // Disparar eventos para notificar componentes sobre a atualização
      notifyTaskChange('taskUpdated', updatedTask);
      notifyTaskChange('tasksRefreshed', updatedTasks);
      
      console.log("Task uncompleted successfully:", updatedTask);
    } catch (error) {
      console.error("Erro ao desmarcar tarefa como concluída:", error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      console.log("Updating task:", { taskId, updates });
      const updatedTask = await taskService.updateTask(taskId, updates);
      
      const updatedTasks = tasks.map((task) => (task.id === taskId ? { ...task, ...updatedTask } : task));
      setTasks(updatedTasks);
      
      // Disparar eventos para notificar componentes sobre a atualização
      notifyTaskChange('taskUpdated', updatedTask);
      notifyTaskChange('tasksRefreshed', updatedTasks);
      
      console.log("Task updated successfully:", updatedTask);
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
      throw error;
    }
  };

  const moveTaskToColumn = async (taskId: string, columnId: string, position: number) => {
    try {
      console.log("Moving task to column:", { taskId, columnId, position });
      
      // Mover tarefa usando a API Kanban
      const updatedTask = await kanbanService.moveTask(taskId, {
        columnId,
        position
      });
      
      // Atualizar o estado local
      const updatedTasks = tasks.map((task) => 
        task.id === taskId ? { ...task, columnId } : task
      );
      
      setTasks(updatedTasks);
      
      // Disparar eventos para notificar componentes sobre a atualização
      notifyTaskChange('taskUpdated', { ...updatedTask, columnId });
      notifyTaskChange('taskMoved', { taskId, columnId, position });
      notifyTaskChange('tasksRefreshed', updatedTasks);
      
      console.log("Task moved successfully:", { taskId, columnId, position });
    } catch (error) {
      console.error("Erro ao mover tarefa:", error);
      throw error;
    }
  };

  const value = {
    tasks,
    selectedTaskId,
    setSelectedTaskId,
    createTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    moveTaskToColumn,
    refreshTasks,
    updateTask
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
