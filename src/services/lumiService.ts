// CORREÇÃO PARA LumiService.ts
// Substitua o método getUserId() pelo código abaixo:

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
  personality_tone?: string;
  suggestions?: string[];
  actions?: LumiAction[];
  insights?: string[];
  emotional_context?: {
    detected_mood: string;
    confidence: number;
    adaptation_applied: boolean;
  };
}

export enum LumiMoodType {
  MOTIVATED = "motivated",
  FOCUSED = "focused",
  STRUGGLING = "struggling",
  OVERWHELMED = "overwhelmed",
  CELEBRATING = "celebrating",
  RETURNING = "returning",
  ENCOURAGING = "encouraging",
  SUPPORTIVE = "supportive",
  EXCITED = "excited",
  PROUD = "proud",
  CONCERNED = "concerned",
  MOTIVATIONAL = "motivational",
}

export interface LumiAction {
  type:
    | "task_created"
    | "task_updated"
    | "task_deleted"
    | "task_completed"
    | "pomodoro_started"
    | "task_suggestion"
    | "insight_provided";
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

export interface AnalyticsData {
  productivity_score: number;
  period: string;
  tasks_completed: number;
  pomodoros_completed: number;
  total_focus_time: number;
  peak_hours: number[];
  trends: {
    productivity_change: number;
    completion_rate_change: number;
    focus_quality_change: number;
  };
  breakdown: {
    task_completion: number;
    focus_quality: number;
    time_efficiency: number;
    consistency: number;
  };
  behavioral_patterns: {
    best_day: string;
    peak_performance_hour: number;
    average_session_duration: number;
    distraction_frequency: string;
  };
}

export interface InsightData {
  insights: Array<{
    type: string;
    title: string;
    message: string;
    confidence: number;
    suggested_actions: string[];
  }>;
  recommendations: Array<{
    category: string;
    suggestion: string;
    reason: string;
    impact: string;
  }>;
}

export interface MoodHistoryData {
  mood_timeline: Array<{
    timestamp: string;
    mood: string;
    confidence: number;
    triggers: string[];
    context: string;
  }>;
  mood_distribution: Record<string, number>;
  mood_trends: {
    dominant_mood: string;
    stability_score: number;
    positive_ratio: number;
  };
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

class LumiService {
  private baseURL = "http://localhost:5000";
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000;

  constructor() {}

  private getUserId(): string {
    const userData = localStorage.getItem("@PomodoroTasks:user");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        const userId = parsedData?.id;

        // 🔧 CORREÇÃO: Validação rigorosa do user_id
        if (
          userId &&
          userId !== null &&
          userId !== undefined &&
          userId !== "null" &&
          userId !== "undefined" &&
          userId !== "" &&
          !isNaN(Number(userId)) &&
          Number(userId) > 0
        ) {
          return String(userId);
        }

        console.warn(
          "❌ User ID inválido no localStorage:",
          userId,
          "usando fallback: 1"
        );
        return "1";
      } catch (error) {
        console.error("❌ Erro ao parsear dados do usuário:", error);
        return "1";
      }
    }

    console.warn(
      "⚠️ Nenhum dado de usuário encontrado no localStorage, usando ID padrão: 1"
    );
    return "1";
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🔄 Fazendo requisição para: ${this.baseURL}${endpoint}`);
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded");
        }
        if (response.status === 503) {
          throw new Error("Service unavailable");
        }

        // 🔧 CORREÇÃO: Melhor tratamento de erros
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error?.message ||
            errorData.message ||
            errorData.detail ||
            errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status} - ${response.statusText}`;
        }

        console.error(`❌ Erro na requisição: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ Resposta recebida de ${endpoint}:`, data);
      return data;
    } catch (error) {
      console.error("Erro na requisição para Lumi:", error);
      throw error;
    }
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async sendMessage(message: string, context?: any): Promise<LumiResponse> {
    const userId = this.getUserId();

    // 🔧 CORREÇÃO: Validação final antes do envio
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber) || userIdNumber <= 0) {
      console.error("❌ User ID inválido para envio:", userId);
      throw new Error("ID de usuário inválido. Faça login novamente.");
    }

    console.log(`💬 Enviando mensagem para usuário ${userIdNumber}:`, message);

    const payload = {
      user_id: userIdNumber, // 🔧 Enviando como número
      message: message.trim(),
      ...(context && { context }),
    };

    console.log("📤 Payload:", payload);

    return this.makeRequest("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAnalytics(
    period: "day" | "week" | "month" = "week",
    includeTrends: boolean = true
  ): Promise<AnalyticsData> {
    const userId = this.getUserId();
    const cacheKey = `analytics_${userId}_${period}_${includeTrends}`;

    const cached = this.getCachedData<AnalyticsData>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest(
      `/api/user/${userId}/analytics?period=${period}&include_trends=${includeTrends}`
    );
    this.setCachedData(cacheKey, data);
    return data;
  }

  async getInsights(): Promise<InsightData> {
    const userId = this.getUserId();
    const cacheKey = `insights_${userId}`;

    const cached = this.getCachedData<InsightData>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest(`/api/user/${userId}/insights`);
    this.setCachedData(cacheKey, data);
    return data;
  }

  async getMoodHistory(days: number = 7): Promise<MoodHistoryData> {
    const userId = this.getUserId();
    const cacheKey = `mood_${userId}_${days}`;

    const cached = this.getCachedData<MoodHistoryData>(cacheKey);
    if (cached) return cached;

    const data = await this.makeRequest(
      `/api/user/${userId}/mood-history?days=${days}`
    );
    this.setCachedData(cacheKey, data);
    return data;
  }

  async sendFeedback(
    interactionId: string,
    rating: number,
    feedbackType: string,
    comment?: string
  ): Promise<ActionResponse> {
    const userId = this.getUserId();
    return this.makeRequest(`/api/user/${userId}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        interaction_id: interactionId,
        rating,
        feedback_type: feedbackType,
        comment,
        suggestion_accuracy: rating,
      }),
    });
  }

  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      const data = await response.json();
      return data.status === "healthy";
    } catch (error) {
      console.error("Erro ao verificar status da Lumi:", error);
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  async sendMessageWithContext(
    message: string,
    userContext: any,
    action: string = "chat"
  ): Promise<LumiResponse> {
    return this.sendMessage(message, userContext);
  }

  async getContext(): Promise<any> {
    return this.getInsights();
  }

  async getHistory(): Promise<any> {
    return this.getMoodHistory();
  }

  async sendPomodoroMessage(
    message: string,
    pomodoroData: any,
    taskData?: any,
    gardenData?: any
  ): Promise<LumiResponse> {
    return this.sendMessage(message, {
      pomodoro: pomodoroData,
      task: taskData,
      garden: gardenData,
    });
  }

  async sendTaskMessage(
    message: string,
    taskData: any,
    action: "task_created" | "task_completed" | "task_updated" = "task_created"
  ): Promise<LumiResponse> {
    return this.sendMessage(message, { task: taskData, action });
  }

  // 🔧 MÉTODO ADICIONAL: Debug para verificar user_id
  debugUserId(): void {
    const userData = localStorage.getItem("@PomodoroTasks:user");
    console.log("🔍 Debug localStorage data:");
    console.log("Raw data:", userData);

    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        console.log("Parsed data:", parsed);
        console.log("User ID:", parsed?.id);
        console.log("getUserId() result:", this.getUserId());
      } catch (e) {
        console.error("Parse error:", e);
      }
    } else {
      console.log("No user data found");
    }
  }
}

const lumiService = new LumiService();
export default lumiService;
