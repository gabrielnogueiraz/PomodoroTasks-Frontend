import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import logo from "../../assets/logo.svg";
import authService from "../../services/authService";
import LogoutIcon from "@mui/icons-material/Logout";
import TaskSideMenu from "../TaskSideMenu/TaskSideMenu";
import { useTaskContext } from "../../hooks/TaskProvider";
import MenuIcon from "@mui/icons-material/Menu";
import AssignmentIcon from "@mui/icons-material/Assignment";

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isTaskMenuOpen, setIsTaskMenuOpen] = useState(false);
  const user = authService.getUser();

  const { tasks, selectedTaskId, setSelectedTaskId, createTask, deleteTask } =
    useTaskContext();

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

  const toggleTaskMenu = () => {
    setIsTaskMenuOpen(!isTaskMenuOpen);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskMenuOpen(false);
  };

  const handleCreateTask = async (
    title: string,
    priority: "low" | "medium" | "high"
  ) => {
    await createTask(title, priority);
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Animação de fade out antes de remover
    const taskElement = document.getElementById(`task-${taskId}`);
    if (taskElement) {
      taskElement.style.opacity = "0";
      taskElement.style.transform = "translateX(30px)";
      taskElement.style.transition = "all 0.3s ease-out";
    }

    // Aguardar a animação terminar
    setTimeout(async () => {
      await deleteTask(taskId);
    }, 300);
  };

  return (
    <>
      <nav
        className={`${styles.navbar} ${
          isScrolled ? styles.navbarScrolled : ""
        }`}
      >
        <div className={styles.navbarContainer}>
          {/* Botão de tarefas à esquerda da logo */}
          <button
            className={styles.taskIconButton}
            onClick={toggleTaskMenu}
            title="Menu de Tarefas"
          >
            <AssignmentIcon />
          </button>

          <div className={styles.logoSection}>
            <div className={styles.logo}>
              <NavLink to="/dashboard" onClick={closeMenu}>
                <img
                  src={logo}
                  alt="PomodoroTasks"
                  className={styles.logoImage}
                />
                <span>PomodoroTasks</span>
              </NavLink>
            </div>
          </div>

          <button
            className={`${styles.mobileMenuButton} ${
              isMenuOpen ? styles.mobileMenuOpen : ""
            }`}
            onClick={toggleMenu}
            aria-label="Menu principal"
          >
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
            <span className={styles.hamburger}></span>
          </button>

          <ul
            className={`${styles.navItems} ${
              isMenuOpen ? styles.navItemsVisible : ""
            }`}
          >
            <li>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : ""
                }
                onClick={closeMenu}
              >
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  isActive ? styles.activeLink : ""
                }
                onClick={closeMenu}
              >
                Quadro de Tarefas
              </NavLink>
            </li>
          </ul>

          <div className={styles.userSection}>
            <span className={styles.userName}>{user?.name}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogoutIcon style={{ fontSize: "1rem" }} /> Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Menu lateral de tarefas */}
      <TaskSideMenu
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        onTaskSelect={handleTaskSelect}
        onCreateTask={handleCreateTask}
        onDeleteTask={handleDeleteTask}
        isOpen={isTaskMenuOpen}
        onClose={() => setIsTaskMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;
