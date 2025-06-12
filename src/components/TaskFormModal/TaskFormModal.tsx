import { useState } from "react";
import styles from "../../pages/Tasks/Tasks.module.css";

const TaskFormModal: React.FC<{
  columnId: string;
  onClose: () => void;
  onSubmit: (
    columnId: string,
    task: {
      title: string;
      priority: "low" | "medium" | "high";
      description?: string;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
    }
  ) => void;
  initialData?: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  };
}> = ({ columnId, onClose, onSubmit, initialData }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "");
  const [endTime, setEndTime] = useState(initialData?.endTime || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === "") return;

    // Validação básica de datas
    if (startDate && endDate && startDate > endDate) {
      alert("A data de término deve ser posterior à data de início.");
      return;
    }

    onSubmit(columnId, {
      title,
      priority,
      description: description || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
    onClose();
  };

  const priorityOptions = [
    { value: "low", color: "#4caf50", label: "Baixa" },
    { value: "medium", color: "#ff9800", label: "Média" },
    { value: "high", color: "#f44336", label: "Alta" },
  ] as const;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modernModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Criar Nova Tarefa</h2>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modernForm}>
          <div className={styles.inputGroup}>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
              className={styles.modernInput}
              autoFocus
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.modernLabel}>Prioridade</label>
            <div className={styles.priorityButtons}>
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.priorityButton} ${
                    priority === option.value ? styles.active : ""
                  }`}
                  onClick={() => setPriority(option.value)}
                  title={option.label}
                >
                  <div
                    className={styles.priorityDot}
                    style={{ backgroundColor: option.color }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição (opcional)"
              className={styles.modernTextarea}
              rows={3}
            />
          </div>

          <div className={styles.dateTimeSection}>
            <h3 className={styles.sectionTitle}>Agendamento</h3>
            <div className={styles.dateTimeGrid}>
              <div className={styles.inputGroup}>
                <label htmlFor="startDate" className={styles.modernLabel}>
                  Data de Início
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.modernInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="startTime" className={styles.modernLabel}>
                  Horário
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={styles.modernInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="endDate" className={styles.modernLabel}>
                  Data de Término
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                  className={styles.modernInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="endTime" className={styles.modernLabel}>
                  Horário
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={styles.modernInput}
                />
              </div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modernCancelButton}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.modernSubmitButton}>
              Criar Tarefa
            </button>{" "}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
