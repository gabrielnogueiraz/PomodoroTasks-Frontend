import { useState } from "react";
import styles from '../../pages/Tasks/Tasks.module.css'

const TaskFormModal: React.FC<{
  columnId: string;
  onClose: () => void;
  onSubmit: (
    columnId: string,
    task: {
      title: string;
      priority: "low" | "medium" | "high";
      description?: string;
    }
  ) => void;
}> = ({ columnId, onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") return;

    onSubmit(columnId, {
      title,
      priority,
      description: description || undefined,
    });
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Nova Tarefa</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="title">Título</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Prioridade</label>
            <div className={styles.priorityButtons}>
              <button
                type="button"
                className={`${styles.priorityButton} ${
                  priority === "low" ? styles.active : ""
                }`}
                onClick={() => setPriority("low")}
                title="Baixa"
              >
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: "#388e3c" }}
                ></div>
              </button>
              <button
                type="button"
                className={`${styles.priorityButton} ${
                  priority === "medium" ? styles.active : ""
                }`}
                onClick={() => setPriority("medium")}
                title="Média"
              >
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: "#f57c00" }}
                ></div>
              </button>
              <button
                type="button"
                className={`${styles.priorityButton} ${
                  priority === "high" ? styles.active : ""
                }`}
                onClick={() => setPriority("high")}
                title="Alta"
              >
                <div
                  className={styles.priorityDot}
                  style={{ backgroundColor: "#c62828" }}
                ></div>
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Descrição (opcional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton}>
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;