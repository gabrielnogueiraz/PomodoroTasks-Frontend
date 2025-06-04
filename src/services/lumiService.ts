export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface LumiResponse {
  status: string;
  response: string;
  mood?: string;
  suggestions?: string[];
  actions?: any[];
  insights?: string[];
  session_id?: string;
  timestamp?: string;
}

class LumiService {
  private baseURL = "http://localhost:5000";
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `web_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async sendMessage(message: string, context?: any): Promise<LumiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.sessionId,
          message: message,
          context: context || {},
          action: "chat"
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LumiResponse = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao se comunicar com Lumi:", error);
      throw new Error(
        "Não foi possível se conectar com a Lumi. Tente novamente."
      );
    }
  }

  async sendMessageWithContext(
    message: string, 
    userContext: any, 
    action: string = "chat"
  ): Promise<LumiResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.sessionId,
          message: message,
          context: userContext,
          action: action
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Erro ao se comunicar com Lumi:", error);
      throw new Error("Não foi possível se conectar com a Lumi. Tente novamente.");
    }
  }

  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/`);
      return response.ok;
    } catch (error) {
      console.error("Erro ao verificar status da Lumi:", error);
      return false;
    }
  }

  async getInsights(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/lumi/insights?userId=${this.sessionId}`);
      return response.json();
    } catch (error) {
      console.error("Erro ao obter insights:", error);
      return null;
    }
  }

  async getContext(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/lumi/context?userId=${this.sessionId}`);
      return response.json();
    } catch (error) {
      console.error("Erro ao obter contexto:", error);
      return null;
    }
  }

  async getHistory(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/lumi/history?userId=${this.sessionId}`);
      return response.json();
    } catch (error) {
      console.error("Erro ao obter histórico:", error);
      return null;
    }
  }

  // Método helper para enviar mensagem com contexto de pomodoro
  async sendPomodoroMessage(
    message: string,
    pomodoroData: any,
    taskData?: any,
    gardenData?: any
  ): Promise<LumiResponse> {
    const context = {
      pomodoro: pomodoroData,
      ...(taskData && { task: taskData }),
      ...(gardenData && { garden: gardenData }),
      timestamp: new Date().toISOString()
    };

    return this.sendMessageWithContext(message, context, "pomodoro_interaction");
  }

  // Método helper para contexto de tarefas
  async sendTaskMessage(
    message: string,
    taskData: any,
    action: "task_created" | "task_completed" | "task_updated" = "task_created"
  ): Promise<LumiResponse> {
    const context = {
      task: taskData,
      timestamp: new Date().toISOString()
    };

    return this.sendMessageWithContext(message, context, action);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

const lumiService = new LumiService();
export default lumiService;
