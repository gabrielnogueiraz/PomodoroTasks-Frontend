export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface LumiResponse {
  response: string;
  mood: LumiMoodType;
  suggestions?: string[];
  actions?: LumiAction[];
}

export enum LumiMoodType {
  ENCOURAGING = "encouraging",
  SUPPORTIVE = "supportive",
  EXCITED = "excited",
  FOCUSED = "focused",
  PROUD = "proud",
  CONCERNED = "concerned",
  MOTIVATIONAL = "motivational"
}

export interface LumiAction {
  type: "task_created" | "task_updated" | "task_deleted" | "task_completed" | "pomodoro_started";
  data: any;
  message?: string;
}

export interface TaskData {
  id?: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status?: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: string;
  estimatedPomodoros: number;
  completedPomodoros?: number;
  tags?: string[];
}

export interface UserContext {
  user: {
    id: string;
    name: string;
    email: string;
    memberSince: Date;
  };
  recentTasks: any[];
  garden: {
    totalFlowers: number;
    recentFlowers: any[];
  };
  statistics: {
    totalTasksCompleted: number;
    currentStreak: number;
    averageCompletionRate: number;
    mostProductiveTimeOfDay: string;
  };
  conversationHistory: any[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class LumiService {
  private baseURL = "http://localhost:8080/api/lumi";

  constructor() {}  private getAuthToken(): string | null {
    const token = localStorage.getItem('@PomodoroTasks:token');
    console.log('LumiService - Token:', token ? 'Existe' : 'Não existe');
    return token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getAuthToken();
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }

    const config: RequestInit = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado ou inválido
          localStorage.removeItem('token');
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Erro na requisição para Lumi:', error);
      throw error;
    }
  }

  // Chat principal com a Lumi - ROTA PRINCIPAL
  async sendMessage(message: string, context?: any): Promise<LumiResponse> {
    return this.makeRequest('/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        context: context || {} 
      })
    });
  }

  // Ações diretas
  async executeAction(action: any): Promise<ActionResponse> {
    return this.makeRequest('/action', {
      method: 'POST',
      body: JSON.stringify(action)
    });
  }

  async createTask(taskData: Partial<TaskData>): Promise<ActionResponse> {
    return this.makeRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async updateTask(taskId: string, updates: Partial<TaskData>): Promise<ActionResponse> {
    return this.makeRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteTask(taskId: string): Promise<ActionResponse> {
    return this.makeRequest(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }

  async startPomodoro(taskId: string, pomodoroData: { duration?: number; notes?: string } = {}): Promise<ActionResponse> {
    return this.makeRequest(`/tasks/${taskId}/pomodoro`, {
      method: 'POST',
      body: JSON.stringify(pomodoroData)
    });
  }

  // Contexto e memória
  async getUserContext(): Promise<UserContext> {
    return this.makeRequest('/context');
  }

  async getUserMemory(): Promise<any> {
    return this.makeRequest('/memory');
  }

  async getConversationHistory(): Promise<any> {
    return this.makeRequest('/history');
  }
  // Verificar status de conexão
  async checkStatus(): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) return false;

      const response = await fetch(`${this.baseURL}/context`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error("Erro ao verificar status da Lumi:", error);
      return false;
    }
  }

  // Métodos de compatibilidade (mantidos para não quebrar código existente)
  async sendMessageWithContext(message: string, userContext: any, action: string = "chat"): Promise<LumiResponse> {
    return this.sendMessage(message, { ...userContext, action });
  }

  async getInsights(): Promise<any> {
    return this.getUserMemory();
  }

  async getContext(): Promise<any> {
    return this.getUserContext();
  }

  async getHistory(): Promise<any> {
    return this.getConversationHistory();
  }

  async sendPomodoroMessage(message: string, pomodoroData: any, taskData?: any, gardenData?: any): Promise<LumiResponse> {
    const context = {
      pomodoro: pomodoroData,
      ...(taskData && { task: taskData }),
      ...(gardenData && { garden: gardenData }),
      timestamp: new Date().toISOString()
    };

    return this.sendMessage(message, context);
  }

  async sendTaskMessage(message: string, taskData: any, action: "task_created" | "task_completed" | "task_updated" = "task_created"): Promise<LumiResponse> {
    const context = {
      task: taskData,
      action: action,
      timestamp: new Date().toISOString()
    };

    return this.sendMessage(message, context);
  }
}

const lumiService = new LumiService();
export default lumiService;
