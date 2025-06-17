import React, { createContext, useState, useContext, useEffect } from "react";
import taskService, { Task } from "../services/taskService";
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
    goalId?: string
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  moveTaskToColumn: (taskId: string, columnId: string, position: number) => Promise<void>;
  refreshTasks: () => Promise<void>;
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

  const refreshTasks = async () => {
    try {
      const allTasks = await taskService.getTasks();
      const activeTasks = allTasks.filter(task => task.status !== 'cancelled');
      console.log('TaskProvider: Atualizando tarefas:', activeTasks.length);
      setTasks(activeTasks);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  useEffect(() => {
    const handleTaskCreatedFromOtherComponent = (event: CustomEvent) => {
      const newTask = event.detail;
      console.log("TaskProvider: Tarefa criada em outro componente detectada:", newTask);
      
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
      console.log("TaskProvider: Tarefa deletada em outro componente detectada:", taskId);
      
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      if (taskId === selectedTaskId) {
        setSelectedTaskId(undefined);
      }
    };

    const handleTaskUpdatedFromOtherComponent = (event: CustomEvent) => {
      const updatedTask = event.detail;
      console.log("TaskProvider: Tarefa atualizada em outro componente detectada:", updatedTask);
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      );
    };

    window.addEventListener('taskCreated', handleTaskCreatedFromOtherComponent as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeletedFromOtherComponent as EventListener);
    window.addEventListener('taskUpdated', handleTaskUpdatedFromOtherComponent as EventListener);

    return () => {
      window.removeEventListener('taskCreated', handleTaskCreatedFromOtherComponent as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeletedFromOtherComponent as EventListener);
      window.removeEventListener('taskUpdated', handleTaskUpdatedFromOtherComponent as EventListener);
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
    goalId?: string
  ) => {
    try {
      const newTask = await taskService.createTask({
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
      });

      setTasks((prevTasks) => [newTask, ...prevTasks]);
      
      window.dispatchEvent(new CustomEvent('taskCreated', { detail: newTask }));
      console.log('TaskProvider: Nova tarefa criada:', newTask);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await taskService.updateTaskStatus(taskId, "cancelled");
      setTasks(tasks.filter((task) => task.id !== taskId));

      if (taskId === selectedTaskId) {
        setSelectedTaskId(undefined);
      }
      
      window.dispatchEvent(new CustomEvent('taskDeleted', { detail: { taskId } }));
      console.log('TaskProvider: Tarefa deletada:', taskId);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const updatedTask = await taskService.completeTask(taskId);
      
      // Registrar conclusão para analytics
      await productivityAnalyticsService.recordTaskCompletion({
        taskId,
        completedAt: new Date().toISOString(),
        productivityScore: 5.0
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      
      window.dispatchEvent(new CustomEvent('taskUpdated', { detail: updatedTask }));
      console.log('TaskProvider: Tarefa completada:', updatedTask);
    } catch (error) {
      console.error("Erro ao marcar tarefa como concluída:", error);
      throw error;
    }
  };

  const uncompleteTask = async (taskId: string) => {
    try {
      const updatedTask = await taskService.uncompleteTask(taskId);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      
      window.dispatchEvent(new CustomEvent('taskUpdated', { detail: updatedTask }));
      console.log('TaskProvider: Tarefa desmarcada:', updatedTask);
    } catch (error) {
      console.error("Erro ao desmarcar tarefa como concluída:", error);
      throw error;
    }
  };

  const moveTaskToColumn = async (taskId: string, columnId: string, position: number) => {
    try {
      const updatedTask = await taskService.moveTaskToColumn(taskId, columnId, position);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
      
      window.dispatchEvent(new CustomEvent('taskUpdated', { detail: updatedTask }));
      console.log('TaskProvider: Tarefa movida para coluna:', updatedTask);
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
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
