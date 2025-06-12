import React, { useState, useEffect, useCallback } from "react";
import styles from "./Tasks.module.css";
import taskService, { Task } from "../../services/taskService";
import TaskFormModal from "../../components/TaskFormModal/TaskFormModal";
import Column from "../../components/Column/Column";
import TaskCalendar from "../../components/Calendar/Calendar";
import ViewToggle from "../../components/ViewToggle/ViewToggle";
import TaskDetailModal from "../../components/TaskDetailModal/TaskDetailModal";
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface ColumnType {
  id: string;
  title: string;
  taskIds: string[];
}

interface TaskItem extends Task {
  columnId: string;
}

const Tasks: React.FC = () => {  const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [calendarKey, setCalendarKey] = useState<number>(0); // Key para forçar re-render do Calendar
  const [columns, setColumns] = useState<ColumnType[]>([
    { id: "col-1", title: "A fazer", taskIds: [] },
    { id: "col-2", title: "Em progresso", taskIds: [] },
    { id: "col-3", title: "Concluído", taskIds: [] },
  ]);

  const [tasks, setTasks] = useState<Record<string, TaskItem>>({});
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");

  // Função para carregar tarefas do servidor
  const fetchTasks = useCallback(async () => {
    try {
      console.log("Iniciando carregamento de tarefas...");
      
      // Buscar todas as tarefas
      const allTasks = await taskService.getTasks();
      console.log("Tarefas carregadas do servidor:", allTasks);

      // Preparar o mapa de tarefas
      const taskMap: Record<string, TaskItem> = {};

      // Criar colunas padrão
      const columnMap: Record<string, ColumnType> = {
        "col-1": { id: "col-1", title: "A fazer", taskIds: [] },
        "col-2": { id: "col-2", title: "Em progresso", taskIds: [] },
        "col-3": { id: "col-3", title: "Concluído", taskIds: [] }
      };

      // Distribuir as tarefas nas colunas corretas
      allTasks.forEach((task) => {
        if (task.status === "cancelled") {
          console.log(`Tarefa cancelada ignorada: ${task.id}`);
          return;
        }

        let columnId = "col-1";
        if (task.status === "in_progress") {
          columnId = "col-2";
        } else if (task.status === "completed") {
          columnId = "col-3";
        }

        // Adicionar o ID da tarefa à coluna adequada
        if (columnMap[columnId]) {
          columnMap[columnId].taskIds.push(task.id);
        }

        // Adicionar ao mapa de tarefas
        taskMap[task.id] = { ...task, columnId };
      });

      // Converter o mapa de volta para um array de colunas
      const updatedColumns = Object.values(columnMap);

      // Atualizar os estados
      setTasks(taskMap);
      setColumns(updatedColumns);

      console.log("Estados atualizados:");
      console.log("- Tarefas:", taskMap);
      console.log("- Colunas:", updatedColumns);
      console.log("Carregamento concluído com sucesso!");
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  }, []);

  // Effect para carregar tarefas inicialmente
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Effect para sincronização em tempo real - escutar eventos do TaskProvider
  useEffect(() => {
    const handleTaskCreated = (event: CustomEvent) => {
      const newTask = event.detail;
      console.log("Tarefa criada detectada no Tasks.tsx:", newTask);

      // Determinar a coluna baseada no status
      let columnId = "col-1";
      if (newTask.status === "in_progress") {
        columnId = "col-2";
      } else if (newTask.status === "completed") {
        columnId = "col-3";
      }

      // Atualizar estado local
      setTasks(prevTasks => ({
        ...prevTasks,
        [newTask.id]: { ...newTask, columnId }
      }));

      setColumns(prevColumns => 
        prevColumns.map(column => 
          column.id === columnId 
            ? { ...column, taskIds: [...column.taskIds, newTask.id] }
            : column
        )
      );
    };

    const handleTaskDeleted = (event: CustomEvent) => {
      const { taskId } = event.detail;
      console.log("Tarefa deletada detectada no Tasks.tsx:", taskId);

      // Remover tarefa do estado
      setTasks(prevTasks => {
        const newTasks = { ...prevTasks };
        delete newTasks[taskId];
        return newTasks;
      });

      // Remover tarefa das colunas
      setColumns(prevColumns =>
        prevColumns.map(column => ({
          ...column,
          taskIds: column.taskIds.filter(id => id !== taskId)
        }))
      );
    };

    const handleTaskUpdated = (event: CustomEvent) => {
      const updatedTask = event.detail;
      console.log("Tarefa atualizada detectada no Tasks.tsx:", updatedTask);

      // Determinar nova coluna baseada no status
      let newColumnId = "col-1";
      if (updatedTask.status === "in_progress") {
        newColumnId = "col-2";
      } else if (updatedTask.status === "completed") {
        newColumnId = "col-3";
      }

      // Atualizar a tarefa
      setTasks(prevTasks => ({
        ...prevTasks,
        [updatedTask.id]: { ...updatedTask, columnId: newColumnId }
      }));      // Reorganizar colunas se necessário
      setColumns(prevColumns => {
        // Remover da coluna atual e adicionar na nova
        return prevColumns.map(column => {
          const filteredTaskIds = column.taskIds.filter(id => id !== updatedTask.id);
          
          if (column.id === newColumnId) {
            return { ...column, taskIds: [...filteredTaskIds, updatedTask.id] };
          }
          
          return { ...column, taskIds: filteredTaskIds };
        });
      });
    };

    // Adicionar listeners para os eventos customizados
    window.addEventListener('taskCreated', handleTaskCreated as EventListener);
    window.addEventListener('taskDeleted', handleTaskDeleted as EventListener);
    window.addEventListener('taskUpdated', handleTaskUpdated as EventListener);

    // Cleanup - remover listeners quando o componente desmontar
    return () => {
      window.removeEventListener('taskCreated', handleTaskCreated as EventListener);
      window.removeEventListener('taskDeleted', handleTaskDeleted as EventListener);
      window.removeEventListener('taskUpdated', handleTaskUpdated as EventListener);
    };
  }, []); // Array vazio - listeners são configurados apenas uma vez// Verificar e remover duplicatas (simplificado)
  useEffect(() => {
    // Skip quando as colunas estiverem vazias (inicialização)
    const columnsCount = columns.length;
    const tasksCount = Object.keys(tasks).length;
    
    if (columnsCount === 0 || tasksCount === 0) {
      return;
    }

    // Verificar se há duplicatas
    const taskOccurrences = new Map<string, number>();
    let hasDuplicates = false;

    columns.forEach(column => {
      column.taskIds.forEach(taskId => {
        const count = taskOccurrences.get(taskId) || 0;
        taskOccurrences.set(taskId, count + 1);
        if (count > 0) {
          hasDuplicates = true;
        }
      });
    });

    // Se há duplicatas, remover
    if (hasDuplicates) {
      console.warn("Removendo tarefas duplicadas");
      const seen = new Set<string>();
      const updatedColumns = columns.map(column => ({
        ...column,
        taskIds: column.taskIds.filter(taskId => {
          if (seen.has(taskId)) {
            return false;
          }
          seen.add(taskId);
          return true;
        })
      }));
      setColumns(updatedColumns);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.length, Object.keys(tasks).length]); // Dependências otimizadas  // Logging para debugging e atualização do calendar key (otimizado)
  useEffect(() => {
    const tasksCount = Object.keys(tasks).length;
    console.log("Estado das tarefas atualizado:", tasksCount, "tarefas");
    
    // Só forçar re-render do Calendar se estamos na view do calendar
    if (viewMode === 'calendar') {
      setCalendarKey(prev => prev + 1);
      console.log("Calendar key atualizada para forçar re-render");
    }
    
    // Salvar o status atual das tarefas no localStorage para debugging
    localStorage.setItem(
      "lastTasksState",
      JSON.stringify(
        Object.values(tasks).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          columnId: t.columnId,
        }))
      )
    );
  }, [tasks, viewMode]);
  // Função para mover tarefas entre colunas
  const moveTask = useCallback(
    async (taskId: string, fromColumnId: string, toColumnId: string) => {
      try {
        const task = tasks[taskId];
        if (!task) {
          console.error(`Task ${taskId} não encontrada`);
          return;
        }

        console.log(
          `Movendo tarefa ${taskId} de ${fromColumnId} para ${toColumnId}`
        );

        // Determinar o novo status com base na coluna de destino
        let newStatus: "pending" | "in_progress" | "completed";
        if (toColumnId === "col-1") {
          newStatus = "pending";
        } else if (toColumnId === "col-2") {
          newStatus = "in_progress";
        } else {
          newStatus = "completed";
        }

        console.log(`Atualizando status para ${newStatus}`);

        // Importante: Atualizar o backend ANTES de atualizar o estado local
        const updatedTaskFromServer = await taskService.updateTaskStatus(taskId, newStatus);
        console.log("Backend atualizado com sucesso");

        // Atualizar o estado local das colunas
        const updatedColumns = columns.map((column) => {
          // Remover o ID da tarefa de todas as colunas
          const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);

          // Adicionar o ID da tarefa apenas à coluna de destino
          if (column.id === toColumnId) {
            return {
              ...column,
              taskIds: [...filteredTaskIds, taskId],
            };
          }

          return {
            ...column,
            taskIds: filteredTaskIds,
          };
        });

        // Atualizar o estado local da tarefa com dados do servidor
        const updatedTasks = {
          ...tasks,
          [taskId]: {
            ...updatedTaskFromServer,
            columnId: toColumnId,
          },
        };        // Atualizar os estados
        setColumns(updatedColumns);
        setTasks(updatedTasks);

        // Emitir evento para sincronizar com TaskProvider
        window.dispatchEvent(new CustomEvent('taskUpdated', { 
          detail: updatedTaskFromServer 
        }));

        console.log("Estado local atualizado com sucesso", updatedTaskFromServer);
      } catch (error) {
        console.error("Erro ao atualizar status da tarefa:", error);
        alert("Não foi possível mover a tarefa. Por favor, tente novamente.");
      }
    },
    [tasks, columns]
  );

  // Manipulador para alternar visualização
  const handleViewChange = (view: 'kanban' | 'calendar') => {
    setViewMode(view);
  };
  // Manipulador para seleção de tarefa no calendário
  const handleCalendarTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  // Manipulador para fechar modal de detalhes
  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
  };

  // Manipulador para editar tarefa do modal de detalhes
  const handleEditTaskFromDetail = (task: Task) => {
    // Determinar em qual coluna a tarefa está
    let columnId = "col-1"; // default
    if (task.status === "in_progress") columnId = "col-2";
    else if (task.status === "completed") columnId = "col-3";

    setSelectedTask(null);
    setActiveColumnId(columnId);
    setShowTaskForm(true);
  };

  // Manipulador para excluir tarefa do modal de detalhes
  const handleDeleteTaskFromDetail = async (taskId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      try {
        await taskService.updateTaskStatus(taskId, "cancelled");
        
        // Atualizar estado local
        const updatedColumns = columns.map((column) => ({
          ...column,
          taskIds: column.taskIds.filter((id) => id !== taskId),
        }));

        const updatedTasks = { ...tasks };
        delete updatedTasks[taskId];        setColumns(updatedColumns);
        setTasks(updatedTasks);
        setSelectedTask(null);

        // Emitir evento para sincronizar com TaskProvider
        window.dispatchEvent(new CustomEvent('taskDeleted', { 
          detail: { taskId } 
        }));
      } catch (error) {
        console.error("Erro ao excluir tarefa:", error);
        alert("Não foi possível excluir a tarefa. Por favor, tente novamente.");
      }
    }
  };

  // Manipulador para completar tarefa do modal de detalhes
  const handleCompleteTaskFromDetail = async (taskId: string) => {
    try {
      const task = tasks[taskId];
      if (!task) return;

      let updatedTask;
      if (task.status === "completed") {
        updatedTask = await taskService.uncompleteTask(taskId);
      } else {
        updatedTask = await taskService.completeTask(taskId);
      }

      // Determinar nova coluna baseada no status
      let newColumnId = task.columnId;
      if (updatedTask.status === "completed") {
        newColumnId = "col-3";
      } else if (updatedTask.status === "pending") {
        newColumnId = "col-1";
      }

      // Atualizar estado local
      const updatedColumns = columns.map((column) => {
        const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);

        if (column.id === newColumnId && !filteredTaskIds.includes(taskId)) {
          return {
            ...column,
            taskIds: [...filteredTaskIds, taskId],
          };
        }

        return {
          ...column,
          taskIds: filteredTaskIds,
        };
      });

      const updatedTasks = {
        ...tasks,
        [taskId]: {
          ...updatedTask,
          columnId: newColumnId,
        },
      };      setColumns(updatedColumns);
      setTasks(updatedTasks);
      setSelectedTask(updatedTasks[taskId]);

      // Emitir evento para sincronizar com TaskProvider
      window.dispatchEvent(new CustomEvent('taskUpdated', { 
        detail: updatedTask 
      }));
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
      alert("Não foi possível alterar o status da tarefa. Por favor, tente novamente.");
    }
  };  // Estado para armazenar dados do slot selecionado
  const [selectedSlotData, setSelectedSlotData] = useState<{
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
  } | null>(null);

  // Manipulador para seleção de slot no calendário (criar nova tarefa)
  const handleCalendarSlotSelect = (slot: { start: Date; end: Date }) => {
    // Converter as datas para o formato esperado pelo modal
    const startDate = slot.start.toISOString().split('T')[0];
    const startTime = slot.start.toTimeString().split(' ')[0].substring(0, 5);
    const endDate = slot.end.toISOString().split('T')[0];
    const endTime = slot.end.toTimeString().split(' ')[0].substring(0, 5);

    // Armazenar os dados do slot selecionado
    setSelectedSlotData({ startDate, startTime, endDate, endTime });
    
    console.log('Slot selecionado:', { startDate, startTime, endDate, endTime });
    
    // Abrir o modal na primeira coluna
    setActiveColumnId("col-1");
    setShowTaskForm(true);
  };

  // Manipulador para adicionar tarefa
  const handleAddTask = (columnId: string) => {
    setActiveColumnId(columnId);
    setShowTaskForm(true);
  };  // Manipulador para criar tarefa
  const handleCreateTask = async (
    columnId: string,
    taskData: {
      title: string;
      priority: "low" | "medium" | "high";
      description?: string;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
    }
  ) => {
    try {
      // Determinar o status com base na coluna
      let status: "pending" | "in_progress" | "completed";
      if (columnId === "col-1") {
        status = "pending";
      } else if (columnId === "col-2") {
        status = "in_progress";
      } else {
        status = "completed";
      }

      // Usar dados do slot selecionado se disponível
      const finalTaskData = {
        ...taskData,
        startDate: taskData.startDate || selectedSlotData?.startDate,
        endDate: taskData.endDate || selectedSlotData?.endDate,
        startTime: taskData.startTime || selectedSlotData?.startTime,
        endTime: taskData.endTime || selectedSlotData?.endTime,
      };

      // Criar a tarefa
      const newTask = await taskService.createTask({
        title: finalTaskData.title,
        description: finalTaskData.description || "",
        priority: finalTaskData.priority,
        startDate: finalTaskData.startDate,
        endDate: finalTaskData.endDate,
        startTime: finalTaskData.startTime,
        endTime: finalTaskData.endTime,
        estimatedPomodoros: 1,
      });

      // Atualizar o status se não for 'pending'
      if (status !== "pending") {
        await taskService.updateTaskStatus(newTask.id, status);
        newTask.status = status; // Atualizar o objeto de tarefa local
      }      // Atualizar o estado local
      const updatedColumns = columns.map((column) => {
        if (column.id === columnId) {
          return {
            ...column,
            taskIds: [...column.taskIds, newTask.id],
          };
        }
        return column;
      });

      const updatedTasks = {
        ...tasks,
        [newTask.id]: {
          ...newTask,
          columnId,
        },
      };      // Atualizar os estados imediatamente
      setColumns(updatedColumns);
      setTasks(updatedTasks);

      // Emitir evento para sincronizar com TaskProvider
      window.dispatchEvent(new CustomEvent('taskCreated', { 
        detail: newTask 
      }));

      console.log('Nova tarefa criada e estados atualizados:', {
        task: newTask,
        totalTasks: Object.keys(updatedTasks).length,
        calendaerTasks: Object.values(updatedTasks).length
      });

      // Limpar dados do slot selecionado
      setSelectedSlotData(null);

      // Fechar modal
      setShowTaskForm(false);
      setActiveColumnId(null);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Não foi possível criar a tarefa. Por favor, tente novamente.");
    }
  };

  // Manipulador para renomear coluna
  const handleRenameColumn = (columnId: string, newTitle: string) => {
    const updatedColumns = columns.map((column) => {
      if (column.id === columnId) {
        return { ...column, title: newTitle };
      }
      return column;
    });
    setColumns(updatedColumns);
  };

  // Manipulador para adicionar nova coluna
  const handleAddColumn = () => {
    setIsAddingColumn(true);
  };

  // Manipulador para confirmar adição de coluna
  const handleConfirmAddColumn = () => {
    if (newColumnTitle.trim()) {
      const newColumn: ColumnType = {
        id: `col-${Date.now()}`, // ID único
        title: newColumnTitle.trim(),
        taskIds: [],
      };
      setColumns([...columns, newColumn]);
      setNewColumnTitle("");
      setIsAddingColumn(false);
    }
  };

  // Manipulador para cancelar adição de coluna
  const handleCancelAddColumn = () => {
    setIsAddingColumn(false);
    setNewColumnTitle("");
  };

  // Manipulador para excluir coluna
  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);

    // Não permitir excluir colunas padrão
    if (["col-1", "col-2", "col-3"].includes(columnId)) {
      alert("Não é possível excluir colunas padrão do sistema.");
      return;
    }

    // Perguntar se o usuário tem certeza, especialmente se houver tarefas na coluna
    if (column && column.taskIds.length > 0) {
      const confirmDelete = window.confirm(
        `Esta coluna contém ${column.taskIds.length} tarefa(s). Deseja realmente excluí-la?`
      );
      if (!confirmDelete) return;
    }

    // Mover as tarefas da coluna para a coluna "A fazer"
    const updatedColumns = columns
      .map((col) => {
        if (col.id === "col-1" && column) {
          return {
            ...col,
            taskIds: [...col.taskIds, ...column.taskIds],
          };
        }
        return col;
      })
      .filter((col) => col.id !== columnId);

    // Atualizar o status das tarefas movidas para "pending"
    const updatedTasks = { ...tasks };
    if (column) {
      column.taskIds.forEach((taskId) => {
        const task = tasks[taskId];
        if (task) {
          updatedTasks[taskId] = {
            ...task,
            status: "pending",
            columnId: "col-1",
          };

          // Atualizar o backend (de forma assíncrona)
          taskService.updateTaskStatus(taskId, "pending").catch((error) => {
            console.error("Erro ao atualizar status da tarefa:", error);
          });
        }
      });
    }

    setColumns(updatedColumns);
    setTasks(updatedTasks);
  };

  // Manipulador para excluir tarefa
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir propagação

    try {
      // Atualizar o status da tarefa para "cancelled" no backend
      await taskService.updateTaskStatus(taskId, "cancelled");

      // Atualizar o estado local
      const updatedColumns = columns.map((column) => ({
        ...column,
        taskIds: column.taskIds.filter((id) => id !== taskId),
      }));      const updatedTasks = { ...tasks };
      delete updatedTasks[taskId];

      setColumns(updatedColumns);
      setTasks(updatedTasks);

      // Emitir evento para sincronizar com TaskProvider
      window.dispatchEvent(new CustomEvent('taskDeleted', { 
        detail: { taskId } 
      }));
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      alert("Não foi possível excluir a tarefa. Por favor, tente novamente.");
    }
  };

  // Manipulador para completar/descompletar tarefa
  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevenir propagação

    try {
      const task = tasks[taskId];
      if (!task) return;

      let updatedTask;
      if (task.status === "completed") {
        // Desmarcar como concluída
        updatedTask = await taskService.uncompleteTask(taskId);
      } else {
        // Marcar como concluída
        updatedTask = await taskService.completeTask(taskId);
      }

      // Determinar nova coluna baseada no status
      let newColumnId = task.columnId;
      if (updatedTask.status === "completed") {
        newColumnId = "col-3"; // Coluna "Concluído"
      } else if (updatedTask.status === "pending") {
        newColumnId = "col-1"; // Coluna "A fazer"
      }

      // Atualizar estado local
      const updatedColumns = columns.map((column) => {
        // Remover tarefa da coluna atual
        const filteredTaskIds = column.taskIds.filter((id) => id !== taskId);

        // Adicionar à nova coluna se necessário
        if (column.id === newColumnId && !filteredTaskIds.includes(taskId)) {
          return {
            ...column,
            taskIds: [...filteredTaskIds, taskId],
          };
        }

        return {
          ...column,
          taskIds: filteredTaskIds,
        };
      });      const updatedTasks = {
        ...tasks,
        [taskId]: {
          ...updatedTask,
          columnId: newColumnId,
        },
      };

      setColumns(updatedColumns);
      setTasks(updatedTasks);

      // Emitir evento para sincronizar com TaskProvider
      window.dispatchEvent(new CustomEvent('taskUpdated', { 
        detail: updatedTask 
      }));
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
      alert(
        "Não foi possível alterar o status da tarefa. Por favor, tente novamente."
      );
    }
  };  return (
    <div className={styles.tasksPage}>
      {/* Elementos de fundo com blur */}
      <div className={styles.backgroundGradient}></div>
      <div className={styles.backgroundBlob1}></div>
      <div className={styles.backgroundBlob2}></div>
        <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Quadro de Tarefas</h1>
        </div>
        <div className={styles.headerCenter}>
          <ViewToggle 
            currentView={viewMode} 
            onViewChange={handleViewChange} 
          />
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {
                  Object.values(tasks).filter(
                    (task) => task.status === "pending"
                  ).length
                }
              </span>
              <span className={styles.statLabel}>A fazer</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {
                  Object.values(tasks).filter(
                    (task) => task.status === "in_progress"
                  ).length
                }
              </span>
              <span className={styles.statLabel}>Em progresso</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {
                  Object.values(tasks).filter(
                    (task) => task.status === "completed"
                  ).length
                }
              </span>
              <span className={styles.statLabel}>Concluídas</span>
            </div>
          </div>        </div>
      </header>

      {viewMode === 'kanban' ? (
        <div className={styles.board}>
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={column.taskIds
                .map((taskId) => tasks[taskId])
                .filter((task): task is TaskItem => task !== undefined)}
              moveTask={moveTask}
              onAddTask={handleAddTask}
              onRenameColumn={handleRenameColumn}
              onDeleteColumn={handleDeleteColumn}
              onDeleteTask={handleDeleteTask}
              onCompleteTask={handleCompleteTask}
            />
          ))}
          {!isAddingColumn ? (
            <button className={styles.addColumnButton} onClick={handleAddColumn}>
              <div className={styles.addColumnIcon}>+</div>
              <span>Adicionar coluna</span>
            </button>
          ) : (
            <div className={styles.newColumn}>
              <input
                type="text"
                placeholder="Título da coluna"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                className={styles.newColumnInput}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleConfirmAddColumn();
                  if (e.key === 'Escape') handleCancelAddColumn();
                }}
              />
              <div className={styles.newColumnActions}>
                <button
                  onClick={handleConfirmAddColumn}
                  className={styles.confirmButton}
                >
                  Confirmar
                </button>
                <button
                  onClick={handleCancelAddColumn}
                  className={styles.cancelButton}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>      ) : (
        <TaskCalendar
          key={calendarKey} // Key para forçar re-render
          tasks={Object.values(tasks)}
          onTaskSelect={handleCalendarTaskSelect}
          onSlotSelect={handleCalendarSlotSelect}
        />
      )}{showTaskForm && activeColumnId && (
        <TaskFormModal
          columnId={activeColumnId}
          onClose={() => {
            setShowTaskForm(false);
            setSelectedSlotData(null); // Limpar dados do slot ao fechar
          }}
          onSubmit={handleCreateTask}
          initialData={selectedSlotData || undefined}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={handleCloseTaskDetail}
          onEdit={handleEditTaskFromDetail}
          onDelete={handleDeleteTaskFromDetail}
          onComplete={handleCompleteTaskFromDetail}
        />
      )}
    </div>
  );
};

export default Tasks;
