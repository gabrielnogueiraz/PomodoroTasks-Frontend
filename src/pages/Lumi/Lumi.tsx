import React, { useState, useEffect, useRef } from "react";
import lumiService, { ChatMessage, LumiMoodType, LumiAction } from "../../services/lumiService";
import { Send, Sparkles, Zap, MessageCircle, Lightbulb, CheckCircle, AlertCircle, Info } from "lucide-react";
import MessageRenderer from "../../components/MessageRenderer/MessageRenderer";
import LumiActionHandler, { ActionFeedback } from "../../utils/lumiActionHandler";
import lumiUIAdapter from "../../utils/lumiUIAdapter";
import lumiErrorHandler from "../../utils/lumiErrorHandler";
import { useNavigate } from "react-router-dom";
import styles from "./Lumi.module.css";

const Lumi: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [currentMood, setCurrentMood] = useState<LumiMoodType | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const actionHandler = useRef(new LumiActionHandler());
  const navigate = useNavigate();

  useEffect(() => {
    setupActionHandlers();
    checkConnection();
    addWelcomeMessage();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => {
        setActionFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionFeedback]);

  useEffect(() => {
    if (currentMood) {
      lumiUIAdapter.adaptUIToMood(currentMood);
    }
  }, [currentMood]);const setupActionHandlers = () => {
    const handler = actionHandler.current;
    
    handler.registerFeedbackCallback((feedback: ActionFeedback) => {
      setActionFeedback(feedback);
    });

    handler.onTaskCreated((taskData) => {
      console.log('Task criada:', taskData);
    });

    handler.onTaskCompleted((taskData) => {
      console.log('Task completada:', taskData);
    });

    handler.onPomodoroStarted((pomodoroData) => {
      console.log('Pomodoro iniciado:', pomodoroData);
    });
  };

  const checkConnection = async () => {
    try {
      const status = await lumiService.checkStatus();
      setIsConnected(status);
    } catch (error) {
      console.error("Erro ao verificar conexão:", error);
      setIsConnected(false);
    }
  };

  const addWelcomeMessage = () => {
    const welcomeText = "Olá! Eu sou a Lumi, sua assistente pessoal de produtividade. Como posso ajudá-lo hoje?";

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
  };  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      message: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setCurrentSuggestions([]);
    setIsLoading(true);

    const typingMessage: ChatMessage = {
      id: "typing",
      message: "Lumi está pensando...",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await lumiService.sendMessage(inputMessage);

      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const lumiMessage: ChatMessage = {
        id: `lumi_${Date.now()}`,
        message: response.response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, lumiMessage]);

      if (response.suggestions && response.suggestions.length > 0) {
        setCurrentSuggestions(response.suggestions);
      } else {
        setCurrentSuggestions([]);
      }

      if (response.mood) {
        setCurrentMood(response.mood);
        console.log("Humor da Lumi:", response.mood);
      }

      if (response.actions && response.actions.length > 0) {
        console.log("Ações da Lumi:", response.actions);
        await actionHandler.current.processActions(response.actions);
      }    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const errorMessage = lumiErrorHandler.handleApiError(error);

      const errorMessageObj: ChatMessage = {
        id: `error_${Date.now()}`,
        message: errorMessage,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessageObj]);
      lumiErrorHandler.logError(error, 'sendMessage');
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };  const handleSuggestionClick = async (suggestion: string) => {
    setInputMessage(suggestion);
    await handleSendMessage();
  };

  const handleQuickActionClick = (action: string) => {
    setInputMessage(action);
    inputRef.current?.focus();
  };

  const getMoodEmoji = (mood: LumiMoodType): string => {
    return lumiUIAdapter.getMoodEmoji(mood);
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
        </div>        {actionFeedback && (
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
        )}

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
                {quickActions.map((action, index) => (                  <button
                    key={index}
                    onClick={() => handleQuickActionClick(action.action)}
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
                {currentSuggestions.map((suggestion, index) => (                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
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
            <div className={styles.inputWrapper}>              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className={styles.messageInput}
                disabled={isLoading || !isConnected}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !isConnected}
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
