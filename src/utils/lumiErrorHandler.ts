export class LumiErrorHandler {
  private fallbackMessages = {
    rateLimit: "Ops! Muitas mensagens muito rápido. Aguarde um momento e tente novamente. 😊",
    serverError: "Estou passando por dificuldades técnicas. Tente novamente em alguns minutos! 🔧",
    serviceUnavailable: "Estou temporariamente indisponível. Voltarei em breve! 🛠️",
    networkError: "Parece que há um problema de conexão. Verifique sua internet e tente novamente.",
    generic: "Ops! Algo deu errado. Tente novamente em alguns instantes."
  };

  handleApiError(error: any, context?: string): string {
    console.error('Erro na API da Lumi:', error, context);

    if (error.message) {
      if (error.message.includes('Rate limit')) {
        return this.fallbackMessages.rateLimit;
      }
      if (error.message.includes('Service unavailable')) {
        return this.fallbackMessages.serviceUnavailable;
      }
      if (error.message.includes('HTTP 500')) {
        return this.fallbackMessages.serverError;
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return this.fallbackMessages.networkError;
      }
    }

    if (error.status) {
      switch (error.status) {
        case 429:
          return this.fallbackMessages.rateLimit;
        case 500:
          return this.fallbackMessages.serverError;
        case 503:
          return this.fallbackMessages.serviceUnavailable;
        default:
          return this.fallbackMessages.generic;
      }
    }

    return this.fallbackMessages.generic;
  }

  showErrorNotification(message: string, type: 'error' | 'warning' | 'info' = 'error'): void {
    console.warn(`Lumi ${type}:`, message);
  }

  enableOfflineMode(): void {
    console.warn('Modo offline ativado. Funcionalidades limitadas disponíveis.');
    this.showErrorNotification(
      "Modo offline ativado. Funcionalidades limitadas disponíveis.",
      'info'
    );
  }

  logError(error: any, context?: string): void {
    console.error('Erro da Lumi:', {
      error,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }

  createErrorResponse(error: any, fallbackMessage?: string): { 
    success: false; 
    error: string; 
    message: string; 
  } {
    const message = this.handleApiError(error);
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: fallbackMessage || message
    };
  }
}

export const lumiErrorHandler = new LumiErrorHandler();
export default lumiErrorHandler;
