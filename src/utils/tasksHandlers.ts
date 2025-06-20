import { Task, TaskStatus } from "../services/taskService";
import { ColumnType, TaskItem, SlotData } from "../hooks/useTasksView";

interface TaskHandlersConfig {
  // Estados
  setViewMode: (mode: 'kanban' | 'calendar') => void;
  setSelectedTask: (task: Task | null) => void;
  setActiveColumnId: (id: string | null) => void;
  setShowTaskForm: (show: boolean) => void;
  setSelectedSlotData: (data: SlotData | null) => void;
  setIsAddingColumn: (adding: boolean) => void;
  setNewColumnTitle: (title: string) => void;
  setLocalColumns: (columns: ColumnType[]) => void;
  setLocalTasks: (tasks: Record<string, TaskItem>) => void;

  // Dados
  tasks: Record<string, TaskItem>;
  columns: ColumnType[];
  localColumns: ColumnType[];
  localTasks: Record<string, TaskItem>;
  useBackendKanban: boolean;
  board?: any;
    // Funções
  moveTaskByStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  fetchLocalTasks: () => Promise<void>;
  createTaskFromProvider: (
    title: string,
    priority: "low" | "medium" | "high",
    description?: string,
    startDate?: string,
    endDate?: string,
    startTime?: string,
    endTime?: string,
    columnId?: string
  ) => Promise<Task>;
  deleteTaskFromProvider: (taskId: string) => Promise<void>;
  createColumn?: (boardId: string, data: any) => Promise<any>;
  updateColumn?: (columnId: string, data: any) => Promise<any>;
  deleteColumn?: (columnId: string) => Promise<void>;
}

export const createTaskHandlers = (config: TaskHandlersConfig) => {
  const {
    setViewMode,
    setSelectedTask,
    setActiveColumnId,
    setShowTaskForm,
    setSelectedSlotData,
    setIsAddingColumn,
    setNewColumnTitle,
    setLocalColumns,
    setLocalTasks,
    tasks,
    columns,
    localColumns,
    localTasks,
    useBackendKanban,
    board,
    moveTaskByStatus,
    fetchLocalTasks,
    createTaskFromProvider,
    deleteTaskFromProvider,
    createColumn,
    updateColumn,
    deleteColumn,
  } = config;

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
        await deleteTaskFromProvider(taskId);
        
        if (!useBackendKanban) {
          // Atualizar estado local
          const updatedColumns = localColumns.map((column) => ({
            ...column,
            taskIds: column.taskIds.filter((id) => id !== taskId),
          }));

          const updatedTasks = { ...localTasks };
          delete updatedTasks[taskId];

          setLocalColumns(updatedColumns);
          setLocalTasks(updatedTasks);
        }
        
        setSelectedTask(null);
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

      const newStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
      await moveTaskByStatus(taskId, newStatus);

      if (!useBackendKanban) {
        // Determinar nova coluna baseada no status
        let newColumnId = newStatus === "completed" ? "col-3" : "col-1";

        // Atualizar estado local
        const updatedColumns = localColumns.map((column) => {
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

        const updatedTasks: Record<string, TaskItem> = {
          ...localTasks,
          [taskId]: {
            ...task,
            status: newStatus,
            columnId: newColumnId,
          } as TaskItem,
        };

        setLocalColumns(updatedColumns);
        setLocalTasks(updatedTasks);
        setSelectedTask(updatedTasks[taskId] as Task);
      }
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
      alert("Não foi possível alterar o status da tarefa. Por favor, tente novamente.");
    }
  };

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
  };  // Manipulador para criar tarefa - OTIMIZADO para aparecer em tempo real
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
    },
    selectedSlotData?: SlotData | null
  ) => {
    try {
      console.log("Criando nova tarefa:", taskData);

      // Usar dados do slot selecionado se disponível
      const finalTaskData = {
        ...taskData,
        startDate: taskData.startDate || selectedSlotData?.startDate,
        endDate: taskData.endDate || selectedSlotData?.endDate,
        startTime: taskData.startTime || selectedSlotData?.startTime,
        endTime: taskData.endTime || selectedSlotData?.endTime,
      };

      // Criar a tarefa usando TaskProvider (que já atualiza o estado local)
      const newTask = await createTaskFromProvider(
        finalTaskData.title,
        finalTaskData.priority,
        finalTaskData.description || "",
        finalTaskData.startDate,
        finalTaskData.endDate,
        finalTaskData.startTime,
        finalTaskData.endTime,
        columnId
      );

      console.log("Nova tarefa criada:", newTask);

      // APENAS fetchLocal se for sistema local (não backend Kanban)
      if (!useBackendKanban) {
        await fetchLocalTasks();
      }

      // Limpar dados do slot selecionado
      setSelectedSlotData(null);

      // Fechar modal
      setShowTaskForm(false);
      setActiveColumnId(null);

      console.log("Tarefa criada com sucesso");
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      alert("Não foi possível criar a tarefa. Por favor, tente novamente.");
    }
  };

  // Manipulador para renomear coluna
  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    try {
      if (useBackendKanban && updateColumn) {
        await updateColumn(columnId, { name: newTitle });
      } else {
        const updatedColumns = localColumns.map((column) => {
          if (column.id === columnId) {
            return { ...column, title: newTitle };
          }
          return column;
        });
        setLocalColumns(updatedColumns);
      }
    } catch (error) {
      console.error("Erro ao renomear coluna:", error);
      alert("Não foi possível renomear a coluna. Por favor, tente novamente.");
    }
  };

  // Manipulador para adicionar nova coluna
  const handleAddColumn = () => {
    setIsAddingColumn(true);
  };

  // Manipulador para confirmar adição de coluna
  const handleConfirmAddColumn = async (newColumnTitle: string) => {
    if (newColumnTitle.trim()) {
      try {
        if (useBackendKanban && createColumn && board) {
          await createColumn(board.id, {
            name: newColumnTitle.trim(),
            color: "#f5f5f5",
            position: board.columns.length
          });
        } else {
          const newColumn: ColumnType = {
            id: `col-${Date.now()}`,
            title: newColumnTitle.trim(),
            taskIds: [],
            color: "#f5f5f5",
            position: localColumns.length
          };
          setLocalColumns([...localColumns, newColumn]);
        }
        
        setNewColumnTitle("");
        setIsAddingColumn(false);
      } catch (error) {
        console.error("Erro ao criar coluna:", error);
        alert("Não foi possível criar a coluna. Por favor, tente novamente.");
      }
    }
  };

  // Manipulador para cancelar adição de coluna
  const handleCancelAddColumn = () => {
    setIsAddingColumn(false);
    setNewColumnTitle("");
  };

  // Manipulador para excluir coluna
  const handleDeleteColumn = async (columnId: string) => {
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

    try {
      if (useBackendKanban && deleteColumn) {
        await deleteColumn(columnId);
      } else {
        // Mover as tarefas da coluna para a coluna "A fazer"
        const updatedColumns = localColumns
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
        const updatedTasks = { ...localTasks };
        if (column) {
          column.taskIds.forEach((taskId) => {
            const task = localTasks[taskId];
            if (task) {
              updatedTasks[taskId] = {
                ...task,
                status: "pending",
                columnId: "col-1",
              };

              // Atualizar o backend via TaskProvider
              moveTaskByStatus(taskId, "pending").catch((error: any) => {
                console.error("Erro ao atualizar status da tarefa:", error);
              });
            }
          });
        }

        setLocalColumns(updatedColumns);
        setLocalTasks(updatedTasks);
      }
    } catch (error) {
      console.error("Erro ao excluir coluna:", error);
      alert("Não foi possível excluir a coluna. Por favor, tente novamente.");
    }
  };  // Manipuladores para ações diretas das tarefas no Kanban - OTIMIZADOS
  const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      return;
    }

    try {
      console.log("Deletando tarefa:", taskId);
      await deleteTaskFromProvider(taskId);

      if (!useBackendKanban) {
        // Atualizar estado local imediatamente
        const updatedColumns = localColumns.map((column) => ({
          ...column,
          taskIds: column.taskIds.filter((id) => id !== taskId),
        }));

        const updatedTasks = { ...localTasks };
        delete updatedTasks[taskId];

        setLocalColumns(updatedColumns);
        setLocalTasks(updatedTasks);
        
        // Fetch apenas para sistemas locais
        await fetchLocalTasks();
      }

      console.log("Tarefa deletada com sucesso");
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      alert("Não foi possível excluir a tarefa. Por favor, tente novamente.");
    }
  };

  const handleCompleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    try {
      const task = tasks[taskId];
      if (!task) {
        console.error("Tarefa não encontrada:", taskId);
        return;
      }

      const newStatus: TaskStatus = task.status === "completed" ? "pending" : "completed";
      console.log("Alterando status da tarefa:", taskId, "para:", newStatus);
      
      await moveTaskByStatus(taskId, newStatus);

      if (!useBackendKanban) {
        // Determinar nova coluna baseada no status
        let newColumnId = newStatus === "completed" ? "col-3" : "col-1";

        // Atualizar estado local imediatamente
        const updatedColumns = localColumns.map((column) => {
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

        const updatedTasks: Record<string, TaskItem> = {
          ...localTasks,
          [taskId]: {
            ...task,
            status: newStatus,
            columnId: newColumnId,
          } as TaskItem,
        };

        setLocalColumns(updatedColumns);
        setLocalTasks(updatedTasks);
        
        // Fetch apenas para sistemas locais
        await fetchLocalTasks();
      }

      console.log("Status da tarefa alterado com sucesso");
    } catch (error) {
      console.error("Erro ao alterar status da tarefa:", error);
      alert("Não foi possível alterar o status da tarefa. Por favor, tente novamente.");
    }
  };

  return {
    handleViewChange,
    handleCalendarTaskSelect,
    handleCloseTaskDetail,
    handleEditTaskFromDetail,
    handleDeleteTaskFromDetail,
    handleCompleteTaskFromDetail,
    handleCalendarSlotSelect,
    handleAddTask,
    handleCreateTask,
    handleRenameColumn,
    handleAddColumn,
    handleConfirmAddColumn,
    handleCancelAddColumn,
    handleDeleteColumn,
    handleDeleteTask,
    handleCompleteTask,
  };
};
