import React, { useState } from 'react';
import styles from './BoardDrawer.module.css';
import { BoardSelectorOption } from '../../hooks/useBoardSelector';

interface BoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  boardOptions: BoardSelectorOption[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => Promise<void>;
  onCreateBoard?: (data: { name: string; description?: string }) => Promise<void>;
  deleteLoading: string | null;
  createLoading?: boolean;
  loading?: boolean;
}

const BoardDrawer: React.FC<BoardDrawerProps> = ({
  isOpen,
  onClose,
  boardOptions,
  selectedBoardId,
  onSelectBoard,
  onDeleteBoard,
  onCreateBoard,
  deleteLoading,
  createLoading = false,
  loading = false
}) => {
  const [newBoardName, setNewBoardName] = useState<string>("");

  const handleDeleteBoard = async (boardId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que o clique selecione o board
    
    if (window.confirm('Tem certeza que deseja excluir este quadro? Esta ação não pode ser desfeita.')) {
      try {
        await onDeleteBoard(boardId);
      } catch (error) {
        alert('Erro ao excluir quadro. Tente novamente.');
      }
    }
  };

  const handleCreateBoard = async () => {
    if (!onCreateBoard || !newBoardName.trim()) return;
    
    try {
      await onCreateBoard({ name: newBoardName.trim() });
      setNewBoardName("");
    } catch (error) {
      alert('Erro ao criar quadro. Tente novamente.');
    }
  };

  if (!isOpen) return null;  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}

      <div className={`${styles.drawer} ${isOpen ? styles.drawerVisible : ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Quadros</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Seção de criação de quadro */}
          <div className={styles.boardCreator}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Nome do novo quadro..."
                className={styles.boardInput}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateBoard()}
                disabled={createLoading}
              />
            </div>
            <button 
              onClick={handleCreateBoard} 
              className={styles.addBoardButton}
              disabled={createLoading || !newBoardName.trim()}
            >
              {createLoading ? (
                <div className={styles.buttonSpinner}></div>
              ) : 'Criar Quadro'}
            </button>
          </div>
          
          {loading ? (
            <div className={styles.loading}>
              <p>Carregando quadros...</p>
            </div>
          ) : boardOptions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum quadro disponível</p>
              <p>Crie um quadro usando o campo acima.</p>
            </div>
          ) : (
            <div className={styles.boardList}>
              <h2>Seus Quadros</h2>
              {boardOptions.map((board, index) => (
                <div 
                  key={board.id} 
                  className={styles.boardItemWrapper}
                  style={{ "--index": index } as React.CSSProperties}
                >
                  <button
                    className={`${styles.boardOption} ${
                      board.id === selectedBoardId ? styles.selected : ''
                    }`}
                    onClick={() => onSelectBoard(board.id)}
                  >
                    <div className={styles.boardIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className={styles.boardInfo}>
                      <h3 className={styles.boardName}>{board.name}</h3>
                      {board.goalTitle && (
                        <span className={styles.boardSubtitle}>Meta: {board.goalTitle}</span>
                      )}
                    </div>
                    {board.id === selectedBoardId && (
                      <div className={styles.selectedIndicator}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path 
                            d="M20 6L9 17L4 12" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                  
                  {/* Botão de exclusão */}
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteBoard(board.id, e)}
                    disabled={deleteLoading === board.id}
                    title="Excluir quadro"
                  >
                    {deleteLoading === board.id ? (
                      <div className={styles.deleteLoading}>
                        <div className={styles.spinner}></div>
                      </div>
                    ) : (
                      '×'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BoardDrawer;
