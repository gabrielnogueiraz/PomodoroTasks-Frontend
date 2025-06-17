import React from 'react';
import styles from './BoardDrawer.module.css';
import { BoardSelectorOption } from '../../hooks/useBoardSelector';

interface BoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  boardOptions: BoardSelectorOption[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onDeleteBoard: (boardId: string) => Promise<void>;
  deleteLoading: string | null;
  loading?: boolean;
}

const BoardDrawer: React.FC<BoardDrawerProps> = ({
  isOpen,
  onClose,
  boardOptions,
  selectedBoardId,
  onSelectBoard,
  onDeleteBoard,
  deleteLoading,
  loading = false
}) => {
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

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className={styles.overlay} onClick={onClose} />
      
      {/* Drawer */}
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2>Quadros</h2>
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
          {loading ? (
            <div className={styles.loading}>
              <p>Carregando quadros...</p>
            </div>
          ) : boardOptions.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nenhum quadro disponível</p>
              <p>Crie uma meta para ter acesso aos quadros Kanban.</p>
            </div>
          ) : (
            <div className={styles.boardList}>
              {boardOptions.map((board) => (
                <div key={board.id} className={styles.boardItemWrapper}>                  <button
                    className={`${styles.boardOption} ${
                      board.goalId === selectedBoardId ? styles.selected : ''
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
                      <span className={styles.boardName}>{board.name}</span>
                      {board.goalTitle && (
                        <span className={styles.boardSubtitle}>Meta: {board.goalTitle}</span>
                      )}
                    </div>                    {board.goalId === selectedBoardId && (
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path 
                          d="M3 6H5H21M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6M19 6V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V6H19ZM10 11V17M14 11V17" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                        />
                      </svg>
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
