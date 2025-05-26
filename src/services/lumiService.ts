export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface LumiResponse {
  response: string;
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

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          session_id: this.sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LumiResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error("Erro ao se comunicar com Lumi:", error);
      throw new Error(
        "Não foi possível se conectar com a Lumi. Tente novamente."
      );
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

  getSessionId(): string {
    return this.sessionId;
  }

  resetSession(): void {
    this.sessionId = this.generateSessionId();
  }
}

const lumiService = new LumiService();
export default lumiService;
