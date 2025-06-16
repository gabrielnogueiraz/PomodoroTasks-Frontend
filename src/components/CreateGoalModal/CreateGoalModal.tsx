import React, { useState } from 'react';
import { X, Target, Calendar, Trophy, Clock, Star } from 'lucide-react';
import { CreateGoalDTO } from '../../services/goalService';
import styles from './CreateGoalModal.module.css';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: any) => void;
}

const CreateGoalModal: React.FC<CreateGoalModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateGoalDTO>({
    title: '',
    description: '',
    type: 'daily',
    category: 'tasks_completed',
    targetValue: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const goalTypes = [
    { value: 'daily', label: 'Diária', icon: Calendar },
    { value: 'weekly', label: 'Semanal', icon: Calendar },
    { value: 'monthly', label: 'Mensal', icon: Calendar },
    { value: 'yearly', label: 'Anual', icon: Trophy }
  ] as const;

  const goalCategories = [
    { value: 'tasks_completed', label: 'Tarefas Completadas', icon: Target },
    { value: 'pomodoros_completed', label: 'Pomodoros Completados', icon: Clock },
    { value: 'focus_time', label: 'Tempo de Foco (minutos)', icon: Clock },
    { value: 'productivity_score', label: 'Score de Produtividade', icon: Star }
  ] as const;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const goalData = {
        ...formData,
        targetValue: parseFloat(formData.targetValue.toString()),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate + 'T23:59:59').toISOString()
      };

      onSuccess(goalData);
      onClose();
      
      setFormData({
        title: '',
        description: '',
        type: 'daily',
        category: 'tasks_completed',
        targetValue: 1,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Erro ao criar meta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateGoalDTO, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Nova Meta</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Título da Meta</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={styles.input}
              placeholder="Ex: Completar 5 tarefas por dia"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descrição (opcional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={styles.textarea}
              rows={2}
              placeholder="Descreva sua meta..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Tipo da Meta</label>
            <div className={styles.typeGrid}>
              {goalTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    className={`${styles.typeButton} ${
                      formData.type === type.value ? styles.active : ''
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <IconComponent size={16} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Categoria</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as any)}
              className={styles.select}
            >
              {goalCategories.map(category => {
                const IconComponent = category.icon;
                return (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Valor Alvo</label>
            <input
              type="number"
              required
              min="1"
              step={formData.category === 'productivity_score' ? '0.1' : '1'}
              value={formData.targetValue}
              onChange={(e) => handleInputChange('targetValue', parseFloat(e.target.value))}
              className={styles.input}
            />
          </div>

          <div className={styles.dateFields}>
            <div className={styles.field}>
              <label className={styles.label}>Data Início</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Data Fim</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className={styles.input}
                min={formData.startDate}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Criando...' : 'Criar Meta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGoalModal;
