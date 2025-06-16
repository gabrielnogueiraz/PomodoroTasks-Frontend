import React, { useState, useEffect, useRef } from "react";
import lumiService, { ChatMessage } from "../../services/lumiService";
import { Send, Sparkles, Zap, Brain, Target } from "lucide-react";
import MessageRenderer from "../../components/MessageRenderer/MessageRenderer";
import { useAuthContext } from "../../hooks/AuthProvider";
import styles from "./Lumi.module.css";

const Lumi: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    checkConnection();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkConnection = async () => {
    try {
      const status = await lumiService.checkStatus();
      setIsConnected(status);
    } catch (error) {
      setIsConnected(false);
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    adjustTextareaHeight(e.target);
  };
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !isAuthenticated) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      message: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);

    const typingMessage: ChatMessage = {
      id: "typing",
      message: "",
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
    } catch (error) {
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        message: "Desculpe, não consegui processar sua mensagem no momento. Tente novamente em instantes.",
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
  const features = [
    {
      icon: <Target className={styles.featureIcon} />,
      title: "Gestão de Tarefas",
      description: "Criação e organização inteligente de tarefas com base em suas prioridades"
    },
    {
      icon: <Zap className={styles.featureIcon} />,
      title: "Técnica Pomodoro",
      description: "Acompanhamento personalizado de sessões de foco e produtividade"
    },
    {
      icon: <Brain className={styles.featureIcon} />,
      title: "Insights Inteligentes",
      description: "Análise de padrões e sugestões para melhorar sua produtividade"
    }
  ];

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundElements}>
          <div className={`${styles.backgroundBlob} ${styles.blob1}`}></div>
          <div className={`${styles.backgroundBlob} ${styles.blob2}`}></div>
          <div className={`${styles.backgroundBlob} ${styles.blob3}`}></div>
        </div>

        <div className={styles.content}>
          <div className={styles.welcomeSection}>
            <div className={styles.lumiIcon}>
              <Sparkles className={styles.lumiIconSvg} />
            </div>
            <h1 className={styles.welcomeTitle}>Lumi</h1>
            <p className={styles.welcomeSubtitle}>
              Faça login para acessar sua assistente pessoal de produtividade
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundElements}>
          <div className={`${styles.backgroundBlob} ${styles.blob1}`}></div>
          <div className={`${styles.backgroundBlob} ${styles.blob2}`}></div>
          <div className={`${styles.backgroundBlob} ${styles.blob3}`}></div>
        </div>

        <div className={styles.content}>
          <div className={styles.welcomeSection}>
            <div className={styles.lumiIcon}>
              <Sparkles className={styles.lumiIconSvg} />
            </div>
            <h1 className={styles.welcomeTitle}>Lumi está chegando!</h1>
            <p className={styles.welcomeSubtitle}>
              Sua assistente pessoal de IA está em desenvolvimento e em breve estará disponível com recursos incríveis para turbinar sua produtividade.
            </p>
            
            <div className={styles.featuresGrid}>
              {features.map((feature, index) => (
                <div key={index} className={styles.featureCard}>
                  {feature.icon}
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte alguma coisa para Lumi..."
                className={styles.messageInput}
                disabled={isLoading || !isConnected}
                rows={1}
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
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundElements}>
        <div className={`${styles.backgroundBlob} ${styles.blob1}`}></div>
        <div className={`${styles.backgroundBlob} ${styles.blob2}`}></div>
        <div className={`${styles.backgroundBlob} ${styles.blob3}`}></div>
      </div>

      <div className={styles.chatContainer}>
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
          </div>          <div className={styles.inputContainer}>
            <div className={styles.inputWrapper}>              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className={styles.messageInput}
                disabled={isLoading || !isConnected}
                rows={1}
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
