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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import NaturePeopleIcon from "@mui/icons-material/NaturePeople";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import FavoriteIcon from "@mui/icons-material/Favorite";
import PsychologyIcon from "@mui/icons-material/Psychology";

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
        <div className={styles.headerContainer}>          <div className={styles.headerLogo}>
            <Link to="/">
              <img src={logoSvg} alt="Toivo" />
              <span>Toivo</span>
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
              href="https://github.com/gabrielnogueiraz/PomodoroTasks-Frontend"
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
          >            <div className={styles.logoWrapper}>
              <img
                src={logoSvg}
                alt="Toivo Logo"
                className={styles.heroLogo}
              />
            </div>
            <h1 className={styles.heroTitle}>
              Cultive <span>Esperança</span> com <br />
              Toivo
            </h1>
            <p className={styles.heroDescription}>
              Transforme sua rotina em um jardim de conquistas. Toivo combina produtividade
              com crescimento pessoal, onde cada tarefa concluída floresce em seu jardim virtual
              e cada pomodoro cultiva sua jornada de esperança e renovação.
            </p>            <div className={styles.ctaWrapper}>
              <Link to="/register" className={styles.ctaButton}>
                Plante sua primeira semente <span className={styles.ctaArrow}>→</span>
              </Link>
              <Link to="/login" className={styles.secondaryButton}>
                Retornar ao jardim
              </Link>
            </div>
          </div>
        </div>      </section>

      {/* Video Section */}
      <section className={styles.videoSection}>
        <div className={styles.contentWrapper}>
          <div className={styles.videoContainer}>
            <div className={styles.videoPlaceholder}>
              <div className={styles.playButton}>
                <PlayArrowIcon className={styles.playIcon} />
              </div>
              <div className={styles.videoOverlay}>
                <h3>Veja Toivo em Ação</h3>
                <p>Descubra como transformar sua produtividade em um jardim de conquistas</p>
              </div>
            </div>
            <div className={styles.videoContent}>
              <span className={styles.videoLabel}>APRESENTAÇÃO</span>
              <h2>Uma nova forma de <span>florescer</span></h2>
              <p>
                Assista como Toivo transforma cada momento de foco em crescimento pessoal,
                criando um ecossistema único onde produtividade e bem-estar se encontram.
              </p>
              <div className={styles.videoStats}>
                <div className={styles.videoStat}>
                  <span className={styles.statNumber}>2min</span>
                  <span className={styles.statLabel}>de inspiração</span>
                </div>
                <div className={styles.videoStat}>
                  <span className={styles.statNumber}>∞</span>
                  <span className={styles.statLabel}>possibilidades</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>      {/* Lumi Section */}
      <section className={styles.lumiSection}>
        <div className={styles.contentWrapper}>
          <div className={styles.lumiContainer}>
            <div className={styles.lumiContent}>
              <div className={styles.lumiHeader}>
                <span className={styles.lumiLabel}>CONHEÇA A LUMI</span>
                <h2>Sua parceira inteligente de <span>produtividade</span></h2>
              </div>
              <div className={styles.lumiDescription}>
                <p>
                  Lumi é mais que uma assistente - ela é uma revolução em IA conversacional. 
                  Com personalidade carismática e capacidades avançadas, ela combina Google Gemini 
                  e OpenRouter para oferecer uma experiência única que evolui com você.
                </p>
                <p>
                  Arquitetura modular de ponta, análise de humor contextual e sistema de 
                  personalidade adaptativa fazem da Lumi sua companheira inteligente ideal 
                  para transformar produtividade em crescimento pessoal.
                </p>
              </div>
              <div className={styles.lumiTechStack}>
                <div className={styles.techItem}>
                  <span className={styles.techLabel}>IA Dual</span>
                  <span className={styles.techDetail}>Gemini + OpenRouter</span>
                </div>
                <div className={styles.techItem}>
                  <span className={styles.techLabel}>Arquitetura</span>
                  <span className={styles.techDetail}>Modular 2.0</span>
                </div>
                <div className={styles.techItem}>
                  <span className={styles.techLabel}>Personalidade</span>
                  <span className={styles.techDetail}>Adaptativa</span>
                </div>
              </div>
              <div className={styles.lumiFeatures}>
                <div className={styles.lumiFeature}>
                  <PsychologyIcon className={styles.lumiFeatureIcon} />
                  <div>
                    <h4>Inteligência Adaptativa</h4>
                    <p>IA que aprende e evolui com seus padrões de trabalho e preferências</p>
                  </div>
                </div>
                <div className={styles.lumiFeature}>
                  <AutoAwesomeIcon className={styles.lumiFeatureIcon} />
                  <div>
                    <h4>Processamento Inteligente</h4>
                    <p>Extração automática de tarefas e análise contextual avançada</p>
                  </div>
                </div>
                <div className={styles.lumiFeature}>
                  <FavoriteIcon className={styles.lumiFeatureIcon} />
                  <div>
                    <h4>Personalidade Carismática</h4>
                    <p>Respostas personalizadas baseadas em seu humor e contexto emocional</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.lumiVisual}>
              <div className={styles.lumiAvatar}>
                <div className={styles.lumiGlow}></div>
                <AutoAwesomeIcon className={styles.lumiIcon} />
                <div className={styles.lumiPulse}></div>
                <div className={styles.lumiOrbit}></div>
              </div>
              <div className={styles.lumiStats}>
                <div className={styles.lumiStat}>
                  <span className={styles.statValue}>2.0</span>
                  <span className={styles.statLabel}>Versão Modular</span>
                </div>
                <div className={styles.lumiStat}>
                  <span className={styles.statValue}>∞</span>
                  <span className={styles.statLabel}>Possibilidades</span>
                </div>
              </div>
              <div className={styles.lumiQuote}>
                <p>"Sou sua parceira inteligente de produtividade. Combino IA avançada com personalidade carismática para transformar seu trabalho em crescimento."</p>
                <span>- Lumi AI 2.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>      {/* Garden Section */}
      <section className={styles.gardenSection}>
        <div className={styles.contentWrapper}>
          <div className={styles.gardenHeader}>
            <span className={styles.gardenLabel}>SEU JARDIM VIRTUAL</span>
            <h2>Cada pomodoro <span>cultiva</span> uma conquista</h2>
            <p className={styles.gardenSubtitle}>
              Transforme sua produtividade em um jardim vivo que registra cada vitória
            </p>
          </div>
          
          <div className={styles.gardenGrid}>
            <div className={styles.gardenCard}>
              <div className={styles.gardenCardIcon}>
                <LocalFloristIcon className={styles.gardenIcon} />
              </div>
              <h3>Flores por Prioridade</h3>
              <p>
                Flores verdes para tarefas de baixa prioridade, laranjas para médias, 
                vermelhas para altas e roxas especiais quando você completa 3 tarefas 
                consecutivas de alta prioridade.
              </p>
            </div>
            
            <div className={styles.gardenCard}>
              <div className={styles.gardenCardIcon}>
                <NaturePeopleIcon className={styles.gardenIcon} />
              </div>
              <h3>Crescimento Visual</h3>
              <p>
                Acompanhe em tempo real sua planta crescendo durante cada pomodoro: 
                da semente ao broto, até a flor completa que representa sua conquista.
              </p>
            </div>
            
            <div className={styles.gardenCard}>
              <div className={styles.gardenCardIcon}>
                <AutoAwesomeIcon className={styles.gardenIcon} />
              </div>
              <h3>Histórico Permanente</h3>
              <p>
                Cada flor preserva a memória: qual tarefa foi concluída, quando, 
                e quanto tempo durou. Sua jornada fica eternizada no jardim.
              </p>
            </div>
          </div>
          
          <div className={styles.gardenShowcase}>
            <div className={styles.gardenPreview}>
              <div className={styles.gardenBackground}>
                <div className={`${styles.gardenFlower} ${styles.greenFlower}`} style={{left: '15%', animationDelay: '0s'}}></div>
                <div className={`${styles.gardenFlower} ${styles.orangeFlower}`} style={{left: '35%', animationDelay: '0.5s'}}></div>
                <div className={`${styles.gardenFlower} ${styles.redFlower}`} style={{left: '55%', animationDelay: '1s'}}></div>
                <div className={`${styles.gardenFlower} ${styles.purpleFlower}`} style={{left: '75%', animationDelay: '1.5s'}}></div>
                <div className={styles.gardenStats}>
                  <div className={styles.statBadge}>24 flores</div>
                  <div className={styles.statBadge}>3 raras</div>
                </div>
              </div>
            </div>
            <div className={styles.gardenShowcaseContent}>
              <h3>Sua produtividade visualizada</h3>
              <p>
                Cada cor conta uma história diferente: verde para o dia a dia, 
                laranja para projetos importantes, vermelho para urgências, 
                e roxo para suas sequências épicas de foco total.
              </p>
              <Link to="/register" className={styles.gardenCta}>
                Plantar primeira flor
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
            <div className={`${styles.featureCard}`}>
              <div className={styles.featureIconWrapper}>
                <AutoAwesomeIcon className={styles.featureIcon} />
              </div>
              <h3 className={styles.featureTitle}>Assistente com IA</h3>
              <p className={styles.featureDescription}>
                Otimize sua produtividade com um assistente pessoal de IA que
                ajudará a priorizar tarefas e sugerir melhorias no seu fluxo de
                trabalho.
              </p>
            </div>
          </div>          <div className={styles.ctaSection}>
            <h2>Pronto para cultivar sua melhor versão?</h2>
            <p>Junte-se a milhares de pessoas que já transformaram sua produtividade em crescimento pessoal</p>
            <Link to="/register" className={styles.ctaButton}>
              Plantar minha primeira semente <span className={styles.ctaArrow}>→</span>
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.contentWrapper}>
          <p>© 2025 Gabriel Nogueira. Todos os direitos reservados.</p>
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
