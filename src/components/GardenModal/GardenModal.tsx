import React, { useEffect, useState } from "react";
import { X, Flower, Trophy, Calendar, Clock } from "lucide-react";
import { flowerService, Flower as FlowerType, GardenStats } from "../../services/flowerService";
import styles from "./GardenModal.module.css";

interface GardenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GardenModal: React.FC<GardenModalProps> = ({ isOpen, onClose }) => {
  const [flowers, setFlowers] = useState<FlowerType[]>([]);
  const [stats, setStats] = useState<GardenStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"all" | "green" | "orange" | "red" | "purple">("all");
  const [flowerPomodoroTimes, setFlowerPomodoroTimes] = useState<Record<string, number>>({});  useEffect(() => {
    if (isOpen) {
      loadGardenData();
    }
  }, [isOpen]);const loadGardenData = async () => {
    setLoading(true);
    try {
      // Carregar as flores
      const flowersData = await flowerService.getFlowers();
      
      // Remover possíveis duplicatas por ID
      console.log("Total de flores antes de remover duplicatas:", flowersData.length);
      
      const uniqueFlowers = flowersData.filter((flower, index, self) => 
        index === self.findIndex((f) => f.id === flower.id)
      );
      
      console.log("Total de flores após remover duplicatas:", uniqueFlowers.length);
      
      // Log para verificar a distribuição de flores por tipo e cor
      const flowersByColor = {
        green: uniqueFlowers.filter(f => f.color === "green").length,
        orange: uniqueFlowers.filter(f => f.color === "orange").length,
        red: uniqueFlowers.filter(f => f.color === "red").length,
        purple: uniqueFlowers.filter(f => f.color === "purple").length,
      };
      console.log("Distribuição de flores por cor:", flowersByColor);
      
      setFlowers(uniqueFlowers);
      
      // Buscar tempos de pomodoro para cada flor
      const pomodoroTimes: Record<string, number> = {};
      
      for (const flower of uniqueFlowers) {        try {
          const pomodoros = await flowerService.getPomodorosByTask(flower.task.id) as any[];
          
          // Encontrar o pomodoro mais próximo da data de criação da flor
          const matchingPomodoro = pomodoros
            .filter((p: any) => p.status === "completed")
            .sort((a: any, b: any) => {
              const dateA = new Date(a.endTime);
              const dateB = new Date(b.endTime);
              const flowerDate = new Date(flower.createdAt);
              
              return Math.abs(dateA.getTime() - flowerDate.getTime()) - Math.abs(dateB.getTime() - flowerDate.getTime());
            })[0];
          
          pomodoroTimes[flower.id] = matchingPomodoro ? matchingPomodoro.duration : 1500; // 25 minutos padrão
        } catch (error) {
          console.warn(`Não foi possível buscar pomodoros para tarefa ${flower.task.id}:`, error);
          pomodoroTimes[flower.id] = 1500; // 25 minutos padrão
        }
      }
      
      setFlowerPomodoroTimes(pomodoroTimes);
      
      // Tentar carregar estatísticas
      try {
        const statsData = await flowerService.getGardenStats();
        setStats(statsData);
      } catch (statsError: any) {
        console.warn("Endpoint de estatísticas não disponível:", statsError);
        // Criar estatísticas básicas baseadas nas flores carregadas
        const basicStats: GardenStats = {
          totalFlowers: uniqueFlowers.length,
          flowersByType: {
            GREEN: uniqueFlowers.filter(f => f.color === "green").length,
            ORANGE: uniqueFlowers.filter(f => f.color === "orange").length,
            RED: uniqueFlowers.filter(f => f.color === "red").length,
            PURPLE: uniqueFlowers.filter(f => f.color === "purple").length,
          },
          consecutiveHighPriority: 0,
          totalPomodorosCompleted: uniqueFlowers.length,
          rareFlowersCount: uniqueFlowers.filter(f => f.type === "rare").length,
        };
        setStats(basicStats);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do jardim:", error);
      // Se não conseguir carregar flores, criar estado vazio
      setFlowers([]);
      setStats({
        totalFlowers: 0,
        flowersByType: { GREEN: 0, ORANGE: 0, RED: 0, PURPLE: 0 },
        consecutiveHighPriority: 0,
        totalPomodorosCompleted: 0,
        rareFlowersCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };  const getFilteredFlowers = () => {
    if (selectedTab === "all") return flowers;
    
    // Filtrar flores pela cor selecionada
    return flowers.filter(flower => flower.color === selectedTab);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };  const formatCompletionTime = (seconds: number) => {
    // Verificar se seconds é um número válido
    if (!seconds || isNaN(seconds)) {
      return "00:00";
    }
    
    try {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    } catch (error) {
      console.warn("Erro ao formatar tempo de conclusão:", error);
      return "00:00";
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <Flower className={styles.headerIcon} />
            <h2>Meu Jardim Virtual</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Carregando seu jardim...</p>
          </div>
        ) : (
          <>
            {/* Estatísticas */}
            {stats && (
              <div className={styles.statsSection}>
                <div className={styles.statCard}>
                  <Trophy className={styles.statIcon} />
                  <div>
                    <span className={styles.statNumber}>{stats.totalFlowers}</span>
                    <span className={styles.statLabel}>Flores Totais</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Clock className={styles.statIcon} />
                  <div>
                    <span className={styles.statNumber}>{stats.totalPomodorosCompleted}</span>
                    <span className={styles.statLabel}>Pomodoros</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <Flower className={styles.statIcon} />
                  <div>
                    <span className={styles.statNumber}>{stats.rareFlowersCount}</span>
                    <span className={styles.statLabel}>Flores Raras</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.consecutiveIndicator}>
                    <span className={styles.statNumber}>{stats.consecutiveHighPriority}</span>
                    <span className={styles.statLabel}>Consecutivas Alta</span>
                  </div>
                </div>
              </div>
            )}

            {/* Abas de Filtro */}
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${selectedTab === "all" ? styles.active : ""}`}
                onClick={() => setSelectedTab("all")}
              >
                Todas ({flowers.length})
              </button>
              <button
                className={`${styles.tab} ${styles.greenTab} ${selectedTab === "green" ? styles.active : ""}`}
                onClick={() => setSelectedTab("green")}
              >
                Verdes ({stats?.flowersByType.GREEN || 0})
              </button>
              <button
                className={`${styles.tab} ${styles.orangeTab} ${selectedTab === "orange" ? styles.active : ""}`}
                onClick={() => setSelectedTab("orange")}
              >
                Laranjas ({stats?.flowersByType.ORANGE || 0})
              </button>
              <button
                className={`${styles.tab} ${styles.redTab} ${selectedTab === "red" ? styles.active : ""}`}
                onClick={() => setSelectedTab("red")}
              >
                Vermelhas ({stats?.flowersByType.RED || 0})
              </button>
              <button
                className={`${styles.tab} ${styles.purpleTab} ${selectedTab === "purple" ? styles.active : ""}`}
                onClick={() => setSelectedTab("purple")}
              >
                Roxas ({stats?.flowersByType.PURPLE || 0})
              </button>
            </div>

            {/* Lista de Flores */}
            <div className={styles.flowersGrid}>
              {getFilteredFlowers().length === 0 ? (
                <div className={styles.emptyState}>
                  <Flower size={48} className={styles.emptyIcon} />
                  <p>Nenhuma flor encontrada nesta categoria</p>
                  <span>Complete pomodoros para cultivar flores!</span>
                </div>
              ) : (
                getFilteredFlowers().map((flower) => (
                  <div key={flower.id} className={`${styles.flowerCard} ${styles[flower.color]}`}>
                    <div className={`${styles.flowerIcon} ${styles[`${flower.color}Flower`]}`}>
                      <Flower size={32} />
                    </div>                    <div className={styles.flowerInfo}>
                      <h3 className={styles.taskName}>{flower.earnedFromTaskTitle || flower.task?.title || "Tarefa sem nome"}</h3>
                      <div className={styles.flowerDetails}>
                        <div className={styles.detail}>
                          <Calendar size={14} />
                          <span>{formatDate(flower.createdAt)}</span>
                        </div>
                        <div className={styles.detail}>
                          <Clock size={14} />
                          <span>{formatCompletionTime(flowerPomodoroTimes[flower.id] || 1500)}</span>
                        </div>
                      </div>
                      {flower.type === "rare" && (
                        <div className={styles.rareLabel}>
                          <Trophy size={12} />
                          Flor Rara!
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GardenModal;
