import React from 'react';
import styles from './ViewToggle.module.css';

interface ViewToggleProps {
  currentView: 'kanban' | 'calendar';
  onViewChange: (view: 'kanban' | 'calendar') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className={styles.toggleContainer}>
      <button
        className={`${styles.toggleButton} ${currentView === 'kanban' ? styles.active : ''}`}
        onClick={() => onViewChange('kanban')}
        title="Visualização Kanban"
      >
        <svg
          className={styles.toggleIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <span className={styles.toggleLabel}>Kanban</span>
      </button>
      
      <button
        className={`${styles.toggleButton} ${currentView === 'calendar' ? styles.active : ''}`}
        onClick={() => onViewChange('calendar')}
        title="Visualização Calendário"
      >
        <svg
          className={styles.toggleIcon}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className={styles.toggleLabel}>Calendário</span>
      </button>
    </div>
  );
};

export default ViewToggle;
