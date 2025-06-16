import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/AuthProvider';
import styles from './Login.module.css';
import logo from '../../assets/logo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.brandingSide}>
        <div className={styles.brandingContent}>
          <img src={logo} alt="PomodoroTasks Logo" className={styles.logo} />
          <h1 className={styles.title}>Toivo</h1>
          <p className={styles.slogan}>
            Sua produtividade com alma!
          </p>
        </div>
        <div className={styles.decorativeCircle1}></div>
        <div className={styles.decorativeCircle2}></div>
      </div>

      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <h2 className={styles.formTitle}>Bem-vindo de volta!</h2>
          <p className={styles.formSubtitle}>
            Entre com suas credenciais para continuar
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <svg className={styles.inputIcon} viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className={styles.registerText}>
            Ainda não tem uma conta?{' '}
            <a href="/register" className={styles.registerLink}>
              Registre-se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 
