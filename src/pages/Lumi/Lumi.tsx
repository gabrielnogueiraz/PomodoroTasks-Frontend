import React, { useState, useEffect, useRef } from "react";
import lumiService, { ChatMessage } from "../../services/lumiService";
import { Send, Sparkles, Zap, MessageCircle, Lightbulb } from "lucide-react";
import styles from "./Lumi.module.css";

const Lumi: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkConnection();
    addWelcomeMessage();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkConnection = async () => {
    const status = await lumiService.checkStatus();
    setIsConnected(status);
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      message:
        "Olá! Eu sou a Lumi, sua assistente pessoal de produtividade. Como posso ajudá-lo hoje?",
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
    setIsLoading(true);

    // Adiciona mensagem de "digitando"
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

      // Remove mensagem de digitando
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const lumiMessage: ChatMessage = {
        id: `lumi_${Date.now()}`,
        message: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, lumiMessage]);
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

      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.lumiInfo}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatar}>
                  <Sparkles className={styles.avatarIcon} />
                </div>
                <div className={`${styles.statusIndicator} ${isConnected ? styles.online : styles.offline}`}></div>
              </div>
              <div className={styles.lumiDetails}>
                <h1 className={styles.title}>Lumi</h1>
                <p className={styles.subtitle}>Sua assistente pessoal de IA</p>
              </div>
            </div>
            <div className={`${styles.connectionStatus} ${isConnected ? styles.connectedStatus : styles.disconnectedStatus}`}>
              {isConnected ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className={styles.messagesContainer}>
          <div className={styles.messagesArea}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.messageRow} ${message.isUser ? styles.userMessage : styles.lumiMessage}`}
              >
                <div className={`${styles.messageAvatar} ${message.isUser ? styles.userAvatar : styles.lumiAvatar}`}>
                  {message.isUser ? (
                    <div className={styles.userAvatarIcon}></div>
                  ) : (
                    <Sparkles className={styles.lumiAvatarIcon} />
                  )}
                </div>

                <div className={styles.messageContent}>
                  <div className={`${styles.messageBubble} ${message.isUser ? styles.userBubble : styles.lumiBubble} ${message.isTyping ? styles.typingBubble : ''}`}>
                    {message.isTyping ? (
                      <div className={styles.typingIndicator}>
                        <div className={styles.typingDot}></div>
                        <div className={styles.typingDot}></div>
                        <div className={styles.typingDot}></div>
                      </div>
                    ) : (
                      <p className={styles.messageText}>{message.message}</p>
                    )}
                  </div>
                  <p className={`${styles.timestamp} ${message.isUser ? styles.userTimestamp : styles.lumiTimestamp}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
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

          {/* Input Area */}
          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>
              <input
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