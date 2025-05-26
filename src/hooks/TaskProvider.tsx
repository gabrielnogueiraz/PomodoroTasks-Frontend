import React, { createContext, useState, useContext, useEffect } from "react";
import taskService, { Task } from "../services/taskService";

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
    endTime?: string
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
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
      const pendingTasks = await taskService.getTasks("pending");
      setTasks(pendingTasks);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);
  const createTask = async (
    title: string,
    priority: "low" | "medium" | "high",
    description?: string,
    startDate?: string,
    endDate?: string,
    startTime?: string,
    endTime?: string
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
      });

      setTasks((prevTasks) => [newTask, ...prevTasks]);
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
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      throw error;
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const updatedTask = await taskService.completeTask(taskId);
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
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
    } catch (error) {
      console.error("Erro ao desmarcar tarefa como concluída:", error);
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
    refreshTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};
