import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import logo from "../../assets/logo.svg";
import authService from "../../services/authService";
import LogoutIcon from "@mui/icons-material/Logout";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const user = authService.getUser();

  useEffect(() => {
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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Impedir rolagem quando o menu está aberto
    document.body.style.overflow = !isMenuOpen ? "hidden" : "auto";
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    document.body.style.overflow = "auto";
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <nav className={`${styles.navbar} ${isScrolled ? styles.navbarScrolled : ""}`}>
      <div className={styles.navbarContainer}>
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <NavLink to="/dashboard" onClick={closeMenu}>
              <img src={logo} alt="PomodoroTasks" className={styles.logoImage} />
              <span>PomodoroTasks</span>
            </NavLink>
          </div>
        </div>

        <button
          className={`${styles.mobileMenuButton} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
          onClick={toggleMenu}
          aria-label="Menu principal"
        >
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
          <span className={styles.hamburger}></span>
        </button>

        <ul className={`${styles.navItems} ${isMenuOpen ? styles.navItemsVisible : ""}`}>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
              onClick={closeMenu}
            >
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/tasks"
              className={({ isActive }) => (isActive ? styles.activeLink : "")}
              onClick={closeMenu}
            >
              Quadro de Tarefas
            </NavLink>
          </li>
        </ul>

        {/* Removido de dentro da ul e colocado como elemento independente */}
        <div className={styles.userSection}>
          <span className={styles.userName}>{user?.name}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <LogoutIcon style={{fontSize: "1rem"}} /> Sair
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;