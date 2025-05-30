import React from "react";
import styles from "./PlantTimer.module.css";

interface PlantTimerProps {
  progress: number; // 0 to 1
  isActive: boolean;
  priority?: "low" | "medium" | "high"; // Adiciona prioridade para colorir a flor
}

const PlantTimer: React.FC<PlantTimerProps> = ({ progress, isActive, priority = "low" }) => {
  const getPlantStage = (progress: number) => {
    if (progress <= 0.2) return "seed";
    if (progress <= 0.4) return "sprout";
    if (progress <= 0.6) return "small";
    if (progress <= 0.8) return "medium";
    return "full";
  };

  const getFlowerColorClass = (priority: string) => {
    switch (priority) {
      case "high":
        return styles.redFlower;
      case "medium":
        return styles.orangeFlower;
      case "low":
      default:
        return styles.greenFlower;
    }
  };

  const plantStage = getPlantStage(progress);
  const flowerColorClass = getFlowerColorClass(priority);

  return (
    <div
      className={`${styles.plantContainer} ${isActive ? styles.active : ""}`}
    >
      <div className={styles.pot}>
        <div className={styles.potRim}></div>
        <div className={styles.soil}></div>
      </div>

      <div className={`${styles.plant} ${styles[plantStage]}`}>
        {/* Seed stage */}
        {plantStage === "seed" && <div className={styles.seed}></div>}

        {/* Sprout stage */}
        {(plantStage === "sprout" ||
          plantStage === "small" ||
          plantStage === "medium" ||
          plantStage === "full") && (
          <>
            <div className={styles.stem}></div>
            <div className={styles.firstLeaf}></div>
          </>
        )}

        {/* Small plant stage */}
        {(plantStage === "small" ||
          plantStage === "medium" ||
          plantStage === "full") && (
          <>
            <div className={styles.secondLeaf}></div>
            <div className={styles.thirdLeaf}></div>
          </>
        )}

        {/* Medium plant stage */}
        {(plantStage === "medium" || plantStage === "full") && (
          <>
            <div className={styles.fourthLeaf}></div>
            <div className={styles.fifthLeaf}></div>
          </>
        )}        {/* Full grown plant */}
        {plantStage === "full" && (
          <>
            <div className={`${styles.flower} ${flowerColorClass}`}></div>
            <div className={styles.flowerCenter}></div>
          </>
        )}
      </div>

      {/* Growing animation particles */}
      {isActive && (
        <div className={styles.particles}>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
          <div className={styles.particle}></div>
        </div>
      )}
    </div>
  );
};

export default PlantTimer;
