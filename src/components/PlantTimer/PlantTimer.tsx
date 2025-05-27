import React from "react";
import styles from "./PlantTimer.module.css";

interface PlantTimerProps {
  progress: number; // 0 to 1
  isActive: boolean;
}

const PlantTimer: React.FC<PlantTimerProps> = ({ progress, isActive }) => {
  const getPlantStage = (progress: number) => {
    if (progress <= 0.2) return "seed";
    if (progress <= 0.4) return "sprout";
    if (progress <= 0.6) return "small";
    if (progress <= 0.8) return "medium";
    return "full";
  };

  const plantStage = getPlantStage(progress);

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
        )}

        {/* Full grown plant */}
        {plantStage === "full" && (
          <>
            <div className={styles.flower}></div>
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
