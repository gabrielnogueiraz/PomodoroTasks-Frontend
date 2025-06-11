import { LumiAction, TaskData } from '../services/lumiService';

export interface ActionFeedback {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

export class LumiActionHandler {
  private actionCallbacks: Map<string, (data: any) => void> = new Map();
  private feedbackCallback?: (feedback: ActionFeedback) => void;

  constructor() {}

  registerActionCallback(actionType: string, callback: (data: any) => void) {
    this.actionCallbacks.set(actionType, callback);
  }

  registerFeedbackCallback(callback: (feedback: ActionFeedback) => void) {
    this.feedbackCallback = callback;
  }

  async processActions(actions: LumiAction[]): Promise<void> {
    for (const action of actions) {
      try {
        await this.processAction(action);
      } catch (error) {
        console.error(`Erro ao processar ação ${action.type}:`, error);
        this.showFeedback({
          type: 'error',
          message: `Erro ao processar ação: ${action.type}`,
          details: error
        });
      }
    }
  }

  private async processAction(action: LumiAction): Promise<void> {
    const callback = this.actionCallbacks.get(action.type);
    
    if (callback) {
      callback(action.data);
    }

    switch (action.type) {
      case 'task_created':
        this.showFeedback({
          type: 'success',
          message: action.message || 'Tarefa criada com sucesso!',
          details: action.data
        });
        break;

      case 'task_updated':
        this.showFeedback({
          type: 'info',
          message: action.message || 'Tarefa atualizada!',
          details: action.data
        });
        break;

      case 'task_completed':
        this.showFeedback({
          type: 'success',
          message: action.message || 'Tarefa completada! 🎉',
          details: action.data
        });
        break;

      case 'task_deleted':
        this.showFeedback({
          type: 'info',
          message: action.message || 'Tarefa removida.',
          details: action.data
        });
        break;

      case 'pomodoro_started':
        this.showFeedback({
          type: 'success',
          message: action.message || 'Pomodoro iniciado! Boa sorte! 🍅',
          details: action.data
        });
        break;

      case 'task_suggestion':
        this.showFeedback({
          type: 'info',
          message: action.message || 'Aqui está uma sugestão de tarefa para você!',
          details: action.data
        });
        break;

      case 'insight_provided':
        this.showFeedback({
          type: 'info',
          message: action.message || 'Insight personalizado disponível!',
          details: action.data
        });
        break;

      default:
        console.warn('Tipo de ação não reconhecido:', action.type);
    }
  }

  private showFeedback(feedback: ActionFeedback): void {
    if (this.feedbackCallback) {
      this.feedbackCallback(feedback);
    }
  }

  onTaskCreated(callback: (taskData: TaskData) => void) {
    this.registerActionCallback('task_created', callback);
  }

  onTaskUpdated(callback: (taskData: TaskData) => void) {
    this.registerActionCallback('task_updated', callback);
  }

  onTaskCompleted(callback: (taskData: TaskData) => void) {
    this.registerActionCallback('task_completed', callback);
  }

  onTaskDeleted(callback: (taskId: string) => void) {
    this.registerActionCallback('task_deleted', callback);
  }

  onPomodoroStarted(callback: (pomodoroData: any) => void) {
    this.registerActionCallback('pomodoro_started', callback);
  }

  onTaskSuggestion(callback: (suggestionData: any) => void) {
    this.registerActionCallback('task_suggestion', callback);
  }

  onInsightProvided(callback: (insightData: any) => void) {
    this.registerActionCallback('insight_provided', callback);
  }

  clearCallbacks() {
    this.actionCallbacks.clear();
    this.feedbackCallback = undefined;
  }
}

export default LumiActionHandler;
