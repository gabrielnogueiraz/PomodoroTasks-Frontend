import React, { useEffect, useState } from "react";
import { Flower, Sparkles } from "lucide-react";
import styles from "./FlowerCreationAnimation.module.css";

interface FlowerCreationAnimationProps {
  isVisible: boolean;
  flowerType: "green" | "orange" | "red" | "purple";
  isRare?: boolean;
  onComplete: () => void;
}

const FlowerCreationAnimation: React.FC<FlowerCreationAnimationProps> = ({
  isVisible,
  flowerType,
  isRare = false,
  onComplete,
}) => {
  const [animationStage, setAnimationStage] = useState<"growing" | "blooming" | "complete">("growing");

  useEffect(() => {
    if (isVisible) {
      setAnimationStage("growing");
      
      // Sequência de animação
      const timer1 = setTimeout(() => {
        setAnimationStage("blooming");
      }, 1000);

      const timer2 = setTimeout(() => {
        setAnimationStage("complete");
      }, 2000);

      const timer3 = setTimeout(() => {
        onComplete();
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.animationContainer}>
        {/* Particles de fundo */}
        <div className={styles.backgroundParticles}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`${styles.backgroundParticle} ${styles[flowerType]}`}
              style={{
                "--delay": `${i * 0.1}s`,
                "--rotation": `${i * 30}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Container da flor */}
        <div className={`${styles.flowerContainer} ${styles[animationStage]}`}>
          {/* Caule crescendo */}
          <div className={`${styles.stem} ${animationStage === "growing" ? styles.growing : ""}`} />
          
          {/* Folhas */}
          <div className={`${styles.leaves} ${animationStage !== "growing" ? styles.show : ""}`}>
            <div className={styles.leaf1} />
            <div className={styles.leaf2} />
          </div>

          {/* Flor */}
          <div 
            className={`${styles.flower} ${styles[flowerType]} ${
              animationStage === "blooming" || animationStage === "complete" ? styles.bloom : ""
            } ${isRare ? styles.rare : ""}`}
          >
            <Flower size={40} />
            
            {isRare && (
              <div className={styles.rareEffect}>
                <Sparkles size={20} className={styles.sparkle1} />
                <Sparkles size={16} className={styles.sparkle2} />
                <Sparkles size={18} className={styles.sparkle3} />
              </div>
            )}
          </div>

          {/* Partículas de criação */}
          {animationStage === "blooming" && (
            <div className={styles.creationParticles}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.creationParticle} ${styles[flowerType]}`}
                  style={{
                    "--delay": `${i * 0.05}s`,
                    "--angle": `${i * 45}deg`,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          )}
        </div>

        {/* Texto de parabéns */}
        {animationStage === "complete" && (
          <div className={`${styles.congratsText} ${styles.fadeIn}`}>
            {isRare ? (
              <>
                <div className={styles.rareTitle}>🎉 Flor Roxa Rara! 🎉</div>
                <div className={styles.subtitle}>3 pomodoros consecutivos de alta prioridade!</div>
              </>
            ) : (
              <>
                <div className={styles.title}>🌸 Nova Flor Criada!</div>
                <div className={styles.subtitle}>Parabéns por completar o pomodoro!</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowerCreationAnimation;
