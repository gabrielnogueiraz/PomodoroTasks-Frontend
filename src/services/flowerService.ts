import { api } from "./api";

export type FlowerType = "GREEN" | "ORANGE" | "RED" | "PURPLE";

export type FlowerColor = "green" | "orange" | "red" | "purple";

export interface Flower {
  id: string;
  type: FlowerType;
  color: FlowerColor;
  createdAt: string;
  taskName: string;
  completionTime: number; // em segundos
}

export interface GardenStats {
  totalFlowers: number;
  flowersByType: Record<FlowerType, number>;
  consecutiveHighPriority: number;
  totalPomodorosCompleted: number;
  rareFlowersCount: number;
}

export interface CreateFlowerRequest {
  type: FlowerType;
  taskName: string;
  completionTime: number;
}

export const flowerService = {
  // Buscar todas as flores do usuário
  getFlowers: async (): Promise<Flower[]> => {
    try {
      return api.get<Flower[]>("/flowers");
    } catch (error) {
      console.warn("Endpoint /flowers não disponível, retornando lista vazia");
      return [];
    }
  },

  // Criar uma nova flor após completar um pomodoro
  createFlower: async (data: CreateFlowerRequest): Promise<Flower> => {
    return api.post<Flower>("/flowers", data);
  },

  // Buscar estatísticas do jardim
  getGardenStats: async (): Promise<GardenStats> => {
    return api.get<GardenStats>("/flowers/stats");
  },

  // Deletar uma flor (se necessário)
  deleteFlower: async (flowerId: string): Promise<void> => {
    return api.delete(`/flowers/${flowerId}`);
  },

  // Buscar flores por tipo
  getFlowersByType: async (type: FlowerType): Promise<Flower[]> => {
    try {
      return api.get<Flower[]>(`/flowers?type=${type}`);
    } catch (error) {
      console.warn(`Endpoint /flowers?type=${type} não disponível, retornando lista vazia`);
      return [];
    }
  },
};

// Função helper para converter prioridade em tipo de flor
export const priorityToFlowerType = (priority: string): FlowerType => {
  switch (priority.toLowerCase()) {
    case "low":
    case "baixa":
      return "GREEN";
    case "medium":
    case "média":
      return "ORANGE";
    case "high":
    case "alta":
      return "RED";
    default:
      return "GREEN";
  }
};

// Função helper para converter tipo de flor em cor
export const flowerTypeToColor = (type: FlowerType): FlowerColor => {
  switch (type) {
    case "GREEN":
      return "green";
    case "ORANGE":
      return "orange";
    case "RED":
      return "red";
    case "PURPLE":
      return "purple";
    default:
      return "green";
  }
};

// Função helper para obter nome amigável do tipo de flor
export const getFlowerTypeName = (type: FlowerType): string => {
  switch (type) {
    case "GREEN":
      return "Flor Verde (Baixa Prioridade)";
    case "ORANGE":
      return "Flor Laranja (Média Prioridade)";
    case "RED":
      return "Flor Vermelha (Alta Prioridade)";
    case "PURPLE":
      return "Flor Roxa (Rara)";
    default:
      return "Flor";
  }
};
