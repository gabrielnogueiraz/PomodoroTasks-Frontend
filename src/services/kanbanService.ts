import { api } from "./api";

export interface KanbanColumn {
  id: string;
  name: string;
  description?: string;
  color: string;
  position: number;
  tasks: KanbanTask[];
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  columnId: string;
  position: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanBoard {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  goal: {
    id: string;
    title: string;
  };
  columns: KanbanColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnData {
  name: string;
  description?: string;
  color: string;
  position: number;
}

export interface UpdateColumnData {
  name?: string;
  description?: string;
  color?: string;
  position?: number;
}

export interface MoveTaskData {
  columnId: string;
  position: number;
}

export interface ReorderColumnsData {
  columnIds: string[];
}

export const kanbanService = {
  getBoardByGoal: async (goalId: string): Promise<{ board: KanbanBoard }> => {
    return api.get<{ board: KanbanBoard }>(`/kanban/boards/goal/${goalId}`);
  },

  getUserBoards: async (): Promise<{ boards: KanbanBoard[] }> => {
    return api.get<{ boards: KanbanBoard[] }>('/kanban/boards');
  },

  updateBoard: async (boardId: string, data: { name?: string; description?: string }): Promise<{ board: KanbanBoard }> => {
    return api.put<{ board: KanbanBoard }>(`/kanban/boards/${boardId}`, data);
  },

  deleteBoard: async (boardId: string): Promise<void> => {
    return api.delete<void>(`/kanban/boards/${boardId}`);
  },

  createColumn: async (boardId: string, data: CreateColumnData): Promise<{ column: KanbanColumn }> => {
    return api.post<{ column: KanbanColumn }>(`/kanban/boards/${boardId}/columns`, data);
  },

  updateColumn: async (columnId: string, data: UpdateColumnData): Promise<{ column: KanbanColumn }> => {
    return api.put<{ column: KanbanColumn }>(`/kanban/columns/${columnId}`, data);
  },

  deleteColumn: async (columnId: string): Promise<void> => {
    return api.delete<void>(`/kanban/columns/${columnId}`);
  },

  reorderColumns: async (boardId: string, data: ReorderColumnsData): Promise<{ columns: KanbanColumn[] }> => {
    return api.put<{ columns: KanbanColumn[] }>(`/kanban/boards/${boardId}/columns/reorder`, data);
  },

  moveTask: async (taskId: string, data: MoveTaskData): Promise<{ task: KanbanTask }> => {
    return api.put<{ task: KanbanTask }>(`/kanban/tasks/${taskId}/move`, data);
  },
};

export default kanbanService;
