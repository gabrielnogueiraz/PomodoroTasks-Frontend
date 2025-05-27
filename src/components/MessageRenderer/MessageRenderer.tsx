import React from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import styles from "./MessageRenderer.module.css";

interface MessageRendererProps {
  content: string;
  isUser?: boolean;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  isUser = false,
}) => {
  if (isUser) {
    // Para mensagens do usuário, renderizar como texto simples
    return <p className={styles.userMessage}>{content}</p>;
  }

  return (
    <div className={styles.messageContent}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Customizar renderização de código
          code(props) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const isInline = !match;

            return isInline ? (
              <code className={styles.inlineCode} {...rest}>
                {children}
              </code>
            ) : (
              <div className={styles.codeBlock}>
                <div className={styles.codeHeader}>
                  <span className={styles.language}>
                    {language.toUpperCase()}
                  </span>
                  <button
                    className={styles.copyButton}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        String(children).replace(/\n$/, "")
                      )
                    }
                  >
                    Copiar
                  </button>
                </div>
                <SyntaxHighlighter
                  style={oneDark as { [key: string]: React.CSSProperties }}
                  language={language}
                  PreTag="div"
                  customStyle={{
                    margin: "0",
                    borderRadius: "0 0 8px 8px",
                    fontSize: "0.9rem",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            );
          },

          // Customizar títulos
          h1(props) {
            return <h1 className={styles.heading1}>{props.children}</h1>;
          },
          h2(props) {
            return <h2 className={styles.heading2}>{props.children}</h2>;
          },
          h3(props) {
            return <h3 className={styles.heading3}>{props.children}</h3>;
          },
          h4(props) {
            return <h4 className={styles.heading4}>{props.children}</h4>;
          },

          // Customizar parágrafos
          p(props) {
            return <p className={styles.paragraph}>{props.children}</p>;
          },

          // Customizar listas
          ul(props) {
            return <ul className={styles.unorderedList}>{props.children}</ul>;
          },
          ol(props) {
            return <ol className={styles.orderedList}>{props.children}</ol>;
          },
          li(props) {
            return <li className={styles.listItem}>{props.children}</li>;
          },

          // Customizar links
          a(props) {
            return (
              <a
                href={props.href}
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {props.children}
              </a>
            );
          },

          // Customizar texto em negrito
          strong(props) {
            return <strong className={styles.bold}>{props.children}</strong>;
          },

          // Customizar texto em itálico
          em(props) {
            return <em className={styles.italic}>{props.children}</em>;
          },

          // Customizar blockquotes
          blockquote(props) {
            return (
              <blockquote className={styles.blockquote}>
                {props.children}
              </blockquote>
            );
          },

          // Customizar tabelas
          table(props) {
            return (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>{props.children}</table>
              </div>
            );
          },
          th(props) {
            return <th className={styles.tableHeader}>{props.children}</th>;
          },
          td(props) {
            return <td className={styles.tableCell}>{props.children}</td>;
          },

          // Customizar divisores
          hr() {
            return <hr className={styles.divider} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageRenderer;
