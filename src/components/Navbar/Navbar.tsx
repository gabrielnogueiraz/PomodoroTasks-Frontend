import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Navbar.module.css';

const Navbar: React.FC = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <h1>PomodoroTasks</h1>
      </div>
      <ul className={styles.navItems}>
        <li>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? styles.activeLink : ''}
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink 
            to="/tasks" 
            className={({ isActive }) => isActive ? styles.activeLink : ''}
          >
            Quadro de Tarefas
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;