import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import logo from "../../assets/logo.png";
import authService from "../../services/authService";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = authService.getUser();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <NavLink to="/">
          <img src={logo} alt="PomodoroTasks" className={styles.logoImage} />
        </NavLink>
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
        <li className={styles.userSection}>
          <span className={styles.userName}>{user?.name}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Sair
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;