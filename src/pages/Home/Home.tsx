import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import logoSvg from "../../assets/logo.svg";

// Importando ícones do Material Icons
import GitHubIcon from "@mui/icons-material/GitHub";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import TimerIcon from "@mui/icons-material/Timer";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SmartToyIcon from "@mui/icons-material/SmartToy";

const Home: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={styles.container}>
      <header
        className={`${styles.header} ${
          isScrolled ? styles.headerScrolled : ""
        }`}
      >
        <div className={styles.headerContainer}>
          <div className={styles.headerLogo}>
            <Link to="/">
              <img src={logoSvg} alt="PomodoroTasks" />
              <span>PomodoroTasks</span>
            </Link>
          </div>

          <nav className={styles.headerNav}>
            <Link to="/features" className={styles.headerLink}>
              Features
            </Link>
            <Link to="/preview" className={styles.headerLink}>
              Preview
            </Link>
          </nav>

          <div className={styles.headerActions}>
            <a
              href="https://github.com/seu-usuario/pomodorotasks"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.githubButton}
            >
              <GitHubIcon className={styles.iconStyle} /> GitHub
            </a>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.contentWrapper}>
          <div
            className={`${styles.heroContent} ${
              isVisible ? styles.visible : ""
            }`}
          >
            <div className={styles.logoWrapper}>
              <img
                src={logoSvg}
                alt="PomodoroTasks Logo"
                className={styles.heroLogo}
              />
            </div>
            <h1 className={styles.heroTitle}>
              Mantenha o <span>foco</span> com <br />
              PomodoroTasks
            </h1>
            <p className={styles.heroDescription}>
              Uma ferramenta gratuita de produtividade que combina pomodoro e
              gerenciamento de tarefas para ajudar você a se manter focado,
              organizado e eficiente durante todo o dia.
            </p>
            <div className={styles.ctaWrapper}>
              <Link to="/register" className={styles.ctaButton}>
                Começar agora <span className={styles.ctaArrow}>→</span>
              </Link>
              <Link to="/login" className={styles.secondaryButton}>
                Fazer login
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section
        className={`${styles.features} ${isVisible ? styles.visible : ""}`}
      >
        <div className={styles.contentWrapper}>
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresTitle}>Recursos Essenciais</h2>
            <p className={styles.featuresDescription}>
              Tudo que você precisa em um só lugar para maximizar sua
              produtividade
            </p>
          </div>

          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <h3>Pomodoro</h3>
              <p>Técnica comprovada</p>
            </div>
            <div className={styles.statItem}>
              <h3>100%</h3>
              <p>Gratuito</p>
            </div>
            <div className={styles.statItem}>
              <h3>24/7</h3>
              <p>Disponibilidade</p>
            </div>
            <div className={styles.statItem}>
              <h3>0</h3>
              <p>Distrações</p>
            </div>
          </div>

          <div className={styles.featuresGrid}>
            {/* Feature 1 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <FormatListBulletedIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Lista de Tarefas</h3>
              <p className={styles.featureDescription}>
                Organize suas tarefas e aumente a produtividade com nosso
                gerenciador de tarefas intuitivo.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <TimerIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Timer Pomodoro</h3>
              <p className={styles.featureDescription}>
                Trabalhe em intervalos focados com nosso timer pomodoro
                personalizável para maximizar a eficiência.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <ViewKanbanIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Quadro Kanban</h3>
              <p className={styles.featureDescription}>
                Visualize seu fluxo de trabalho com nosso quadro kanban para um
                melhor gerenciamento de projetos.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <HeadphonesIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Controle de Foco</h3>
              <p className={styles.featureDescription}>
                Melhore sua concentração com técnicas avançadas de gerenciamento
                de tempo e foco.
              </p>
            </div>

            {/* Feature 5 - Substituído para Calendário de Tarefas */}
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <CalendarMonthIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Calendário de Tarefas</h3>
              <p className={styles.featureDescription}>
                Acompanhe e organize suas tarefas por data com nosso calendário
                integrado para melhor gestão do seu tempo.
              </p>
            </div>

            {/* Feature 6 - Substituído para Assistente IA (em breve) */}
            <div className={`${styles.featureCard} ${styles.comingSoonCard}`}>
              <div className={styles.comingSoonBadge}>Em breve</div>
              <div className={styles.featureIconWrapper}>
                <SmartToyIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Assistente com IA</h3>
              <p className={styles.featureDescription}>
                Otimize sua produtividade com um assistente pessoal de IA que
                ajudará a priorizar tarefas e sugerir melhorias no seu fluxo de
                trabalho.
              </p>
            </div>
          </div>

          <div className={styles.ctaSection}>
            <h2>Pronto para aumentar sua produtividade?</h2>
            <Link to="/register" className={styles.ctaButton}>
              Comece agora <span className={styles.ctaArrow}>→</span>
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.contentWrapper}>
          <p>© 2025 PomodoroTasks. Todos os direitos reservados.</p>
          <div className={styles.footerLinks}>
            <a href="#">Termos</a>
            <a href="#">Privacidade</a>
            <a href="#">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
