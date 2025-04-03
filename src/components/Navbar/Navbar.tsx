import React from "react";
import { NavLink } from "react-router-dom";
import styles from "./Navbar.module.css";
import logo from "../../assets/logo.png"; 

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <NavLink to="/">
          <img src={logo} alt="PomodoroTasks" className={styles.logoImage} />
        </NavLink>
      </div>
      <ul className={styles.navItems}>
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? styles.activeLink : "")}
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/tasks"
            className={({ isActive }) => (isActive ? styles.activeLink : "")}
          >
            Quadro de Tarefas
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
