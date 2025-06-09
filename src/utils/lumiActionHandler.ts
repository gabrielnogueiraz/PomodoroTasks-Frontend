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

  // Registrar callbacks para diferentes tipos de ação
  registerActionCallback(actionType: string, callback: (data: any) => void) {
    this.actionCallbacks.set(actionType, callback);
  }

  // Registrar callback para feedback de ações
  registerFeedbackCallback(callback: (feedback: ActionFeedback) => void) {
    this.feedbackCallback = callback;
  }

  // Processar array de ações da Lumi
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

  // Processar uma ação individual
  private async processAction(action: LumiAction): Promise<void> {
    const callback = this.actionCallbacks.get(action.type);
    
    if (callback) {
      callback(action.data);
    }

    // Mostrar feedback da ação
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

      default:
        console.warn('Tipo de ação não reconhecido:', action.type);
    }
  }

  // Mostrar feedback visual
  private showFeedback(feedback: ActionFeedback): void {
    if (this.feedbackCallback) {
      this.feedbackCallback(feedback);
    }
  }

  // Métodos de conveniência para ações específicas
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

  // Limpar todos os callbacks
  clearCallbacks() {
    this.actionCallbacks.clear();
    this.feedbackCallback = undefined;
  }
}

export default LumiActionHandler;
