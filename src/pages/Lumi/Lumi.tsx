import React, { useState, useEffect, useRef } from "react";
import lumiService, { ChatMessage, LumiMoodType, LumiAction } from "../../services/lumiService";
import authService from "../../services/authService";
import { Send, Sparkles, Zap, MessageCircle, Lightbulb, CheckCircle, AlertCircle, Info, LogIn } from "lucide-react";
import MessageRenderer from "../../components/MessageRenderer/MessageRenderer";
import LumiActionHandler, { ActionFeedback } from "../../utils/lumiActionHandler";
import { useNavigate } from "react-router-dom";
import styles from "./Lumi.module.css";

const Lumi: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [currentMood, setCurrentMood] = useState<LumiMoodType | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const actionHandler = useRef(new LumiActionHandler());
  const navigate = useNavigate();  useEffect(() => {
    checkAuthentication();
    setupActionHandlers();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (isAuthenticated !== null) {
      checkConnection();
      addWelcomeMessage();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-hide feedback após 5 segundos
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);
  const checkAuthentication = () => {
    const isAuth = authService.isAuthenticated();
    const token = authService.getToken();
    console.log('Verificação de autenticação:', { isAuth, token: token ? 'Existe' : 'Não existe' });
    setIsAuthenticated(isAuth);
    if (!isAuth) {
      setIsConnected(false);
    }
  };

  const setupActionHandlers = () => {
    const handler = actionHandler.current;
    
    // Registrar callback para feedback de ações
    handler.registerFeedbackCallback((feedback: ActionFeedback) => {
      setActionFeedback(feedback);
    });

    // Registrar handlers específicos para diferentes tipos de ação
    handler.onTaskCreated((taskData) => {
      console.log('Task criada:', taskData);
      // Aqui você pode atualizar a UI, recarregar lista de tasks, etc.
    });

    handler.onTaskCompleted((taskData) => {
      console.log('Task completada:', taskData);
      // Aqui você pode atualizar estatísticas, mostrar animação, etc.
    });

    handler.onPomodoroStarted((pomodoroData) => {
      console.log('Pomodoro iniciado:', pomodoroData);
      // Aqui você pode iniciar o timer, navegar para página do pomodoro, etc.
    });
  };  const checkConnection = async () => {
    if (!isAuthenticated) {
      setIsConnected(false);
      return;
    }
    
    try {
      const status = await lumiService.checkStatus();
      setIsConnected(status);
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setIsConnected(false);
      
      // Se o erro for de autenticação (401), atualizar estado
      if (error instanceof Error && error.message.includes('401')) {
        setIsAuthenticated(false);
      }
    }
  };  const addWelcomeMessage = () => {
    let welcomeText = "Olá! Eu sou a Lumi, sua assistente pessoal de produtividade.";
    
    if (isAuthenticated === false) {
      welcomeText = "Olá! Para conversar comigo, você precisa fazer login primeiro. 😊";
    } else if (isAuthenticated === true) {
      welcomeText = "Olá! Eu sou a Lumi, sua assistente pessoal de produtividade. Como posso ajudá-lo hoje?";
    } else {
      // isAuthenticated === null (carregando)
      welcomeText = "Verificando autenticação...";
    }

    const welcomeMessage: ChatMessage = {
      id: "welcome",
      message: welcomeText,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      message: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setCurrentSuggestions([]); // Limpar sugestões ao enviar nova mensagem
    setIsLoading(true);

    // Adiciona mensagem de "digitando"
    const typingMessage: ChatMessage = {
      id: "typing",
      message: "Lumi está pensando...",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);    try {
      const response = await lumiService.sendMessage(inputMessage);

      // Remove mensagem de digitando
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const lumiMessage: ChatMessage = {
        id: `lumi_${Date.now()}`,
        message: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, lumiMessage]);

      // Atualizar sugestões se disponíveis
      if (response.suggestions && response.suggestions.length > 0) {
        setCurrentSuggestions(response.suggestions);
      } else {
        setCurrentSuggestions([]);
      }

      // Atualizar humor da Lumi
      if (response.mood) {
        setCurrentMood(response.mood);
        console.log("Humor da Lumi:", response.mood);
      }

      // Processar ações se disponíveis
      if (response.actions && response.actions.length > 0) {
        console.log("Ações da Lumi:", response.actions);
        await actionHandler.current.processActions(response.actions);
      }
    } catch (error) {
      // Remove mensagem de digitando
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        message:
          "Desculpe, não consegui processar sua mensagem. Tente novamente.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMoodEmoji = (mood: LumiMoodType): string => {
    switch (mood) {
      case LumiMoodType.ENCOURAGING:
        return "💪";
      case LumiMoodType.SUPPORTIVE:
        return "🤗";
      case LumiMoodType.EXCITED:
        return "🎉";
      case LumiMoodType.FOCUSED:
        return "🎯";
      case LumiMoodType.PROUD:
        return "⭐";
      case LumiMoodType.CONCERNED:
        return "😕";
      case LumiMoodType.MOTIVATIONAL:
        return "🚀";
      default:
        return "✨";
    }
  };

  const quickActions = [
    {
      icon: <Lightbulb className={styles.quickActionIcon} />,
      text: "Dicas de produtividade",
      action: "Me dê algumas dicas para ser mais produtivo",
    },
    {
      icon: <Zap className={styles.quickActionIcon} />,
      text: "Técnica Pomodoro",
      action: "Como posso melhorar meu uso da técnica Pomodoro?",
    },
    {
      icon: <MessageCircle className={styles.quickActionIcon} />,
      text: "Organizar tarefas",
      action: "Como devo organizar minhas tarefas diárias?",
    },
  ];

  return (
    <div className={styles.container}>
      {/* Background animated elements */}
      <div className={styles.backgroundElements}>
        <div className={`${styles.backgroundBlob} ${styles.blob1}`}></div>
        <div className={`${styles.backgroundBlob} ${styles.blob2}`}></div>
        <div className={`${styles.backgroundBlob} ${styles.blob3}`}></div>
      </div>

      <div className={styles.content}>        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.lumiInfo}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  <Sparkles className={styles.avatarIcon} />
                </div>
                <div
                  className={`${styles.statusIndicator} ${
                    isConnected ? styles.online : styles.offline
                  }`}
                ></div>
              </div>
              <div className={styles.lumiDetails}>
                <h1 className={styles.title}>Lumi</h1>
                <p className={styles.subtitle}>
                  Sua assistente pessoal de IA
                  {currentMood && (
                    <span className={styles.moodIndicator}>
                      • {getMoodEmoji(currentMood)} {currentMood}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div
              className={`${styles.connectionStatus} ${
                isConnected ? styles.connectedStatus : styles.disconnectedStatus
              }`}
            >
              {isConnected ? "Online" : "Offline"}
            </div>
          </div>
        </div>        {/* Action Feedback */}
        {actionFeedback && (
          <div className={`${styles.actionFeedback} ${styles[actionFeedback.type]}`}>
            <div className={styles.feedbackContent}>
              {actionFeedback.type === 'success' && <CheckCircle className={styles.feedbackIcon} />}
              {actionFeedback.type === 'error' && <AlertCircle className={styles.feedbackIcon} />}
              {actionFeedback.type === 'info' && <Info className={styles.feedbackIcon} />}
              <span className={styles.feedbackMessage}>{actionFeedback.message}</span>
              <button 
                onClick={() => setActionFeedback(null)}
                className={styles.feedbackClose}
              >
                ×
              </button>
            </div>
          </div>
        )}        {/* Login Prompt */}
        {isAuthenticated === false && (
          <div className={styles.loginPrompt}>
            <div className={styles.loginPromptContent}>
              <LogIn className={styles.loginIcon} />
              <div className={styles.loginText}>
                <h3>Faça login para conversar com a Lumi</h3>
                <p>A Lumi precisa acessar suas informações pessoais para fornecer uma experiência personalizada.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className={styles.loginButton}
              >
                Fazer Login
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className={styles.messagesContainer}>
          <div className={styles.messagesArea}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${
                  message.isUser ? styles.userMessage : styles.lumiMessage
                }`}
              >
                <div
                  className={`${styles.messageAvatar} ${
                    message.isUser ? styles.userAvatar : styles.lumiAvatar
                  }`}
                >
                  {message.isUser ? (
                    <div className={styles.userAvatarIcon}></div>
                  ) : (
                    <Sparkles className={styles.lumiAvatarIcon} />
                  )}
                </div>

                <div className={styles.messageContent}>
                  <div
                    className={`${styles.messageBubble} ${
                      message.isUser ? styles.userBubble : styles.lumiBubble
                    } ${message.isTyping ? styles.typingBubble : ""}`}
                  >
                    {message.isTyping ? (
                      <div className={styles.typingIndicator}>
                        <div className={styles.typingDot}></div>
                        <div className={styles.typingDot}></div>
                        <div className={styles.typingDot}></div>
                      </div>
                    ) : (
                      <MessageRenderer
                        content={message.message}
                        isUser={message.isUser}
                      />
                    )}
                  </div>
                  <p
                    className={`${styles.timestamp} ${
                      message.isUser
                        ? styles.userTimestamp
                        : styles.lumiTimestamp
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className={styles.quickActionsContainer}>
              <div className={styles.quickActions}>
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(action.action)}
                    className={styles.quickActionButton}
                  >
                    {action.icon}
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugestões da Lumi */}
          {currentSuggestions.length > 0 && (
            <div className={styles.suggestionsContainer}>
              <div className={styles.suggestionsHeader}>
                <Lightbulb className={styles.suggestionsIcon} />
                <span>Sugestões da Lumi:</span>
              </div>
              <div className={styles.suggestions}>
                {currentSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(suggestion)}
                    className={styles.suggestionButton}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}                placeholder="Digite sua mensagem..."
                className={styles.messageInput}
                disabled={isLoading || !isConnected || isAuthenticated !== true}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !isConnected || isAuthenticated !== true}
                className={styles.sendButton}
              >
                <Send className={styles.sendIcon} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lumi;
