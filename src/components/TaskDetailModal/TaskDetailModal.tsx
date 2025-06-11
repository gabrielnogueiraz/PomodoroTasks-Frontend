import React from 'react';
import styles from './TaskDetailModal.module.css';
import { Task } from '../../services/taskService';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onComplete?: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onEdit,
  onDelete,
  onComplete,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definida';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Concluída';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.modalHeader}>
          <h2>{task.title}</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            title="Fechar"
          >
            ×
          </button>
        </header>

        <div className={styles.modalContent}>
          {task.description && (
            <div className={styles.section}>
              <h3>Descrição</h3>
              <p>{task.description}</p>
            </div>
          )}

          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <label>Status</label>
              <span className={`${styles.status} ${styles[task.status]}`}>
                {getStatusLabel(task.status)}
              </span>
            </div>

            <div className={styles.infoItem}>
              <label>Prioridade</label>
              <span className={`${styles.priority} ${styles[`priority${task.priority.charAt(0).toUpperCase()}${task.priority.slice(1)}`]}`}>
                {getPriorityLabel(task.priority)}
              </span>
            </div>

            <div className={styles.infoItem}>
              <label>Data de Início</label>
              <span>{formatDate(task.startDate)} {formatTime(task.startTime)}</span>
            </div>

            <div className={styles.infoItem}>
              <label>Data de Término</label>
              <span>{formatDate(task.endDate)} {formatTime(task.endTime)}</span>
            </div>

            {task.estimatedPomodoros && (
              <div className={styles.infoItem}>
                <label>Pomodoros Estimados</label>
                <span>{task.estimatedPomodoros}</span>
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            {task.status !== 'completed' && onComplete && (
              <button
                className={`${styles.actionButton} ${styles.completeButton}`}
                onClick={() => onComplete(task.id)}
              >
                Marcar como Concluída
              </button>
            )}
            
            {task.status === 'completed' && onComplete && (
              <button
                className={`${styles.actionButton} ${styles.uncompleteButton}`}
                onClick={() => onComplete(task.id)}
              >
                Desmarcar Conclusão
              </button>
            )}

            {onEdit && (
              <button
                className={`${styles.actionButton} ${styles.editButton}`}
                onClick={() => onEdit(task)}
              >
                Editar
              </button>
            )}

            {onDelete && (
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => onDelete(task.id)}
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
