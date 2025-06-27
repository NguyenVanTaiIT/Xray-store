import React from "react";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
    return (
        <section className={styles.heroSection}>
            <div className={styles.heroLeft}>
                <h1 className={styles.heroTitle}>Chào mừng đến với Xray</h1>
                <p className={styles.heroSubtitle}>
                    Khám phá laptop gaming mới nhất với hiệu năng vượt trội và giá tốt nhất. <br />
                    Trải nghiệm gaming đỉnh cao cùng những công nghệ hàng đầu.
                </p>
                <button className={styles.heroButton}>Khám phá ngay</button>
            </div>
            <div className={styles.heroRight}>
                <div className={styles.techGrid}>
                    <div className={styles.gridLine}></div>
                    <div className={styles.gridLine}></div>
                    <div className={styles.gridLine}></div>
                    <div className={styles.gridLine}></div>
                </div>
                
                <div className={styles.floatingElements}>
                    <div className={styles.glowOrb}></div>
                    <div className={styles.glowOrb}></div>
                    <div className={styles.glowOrb}></div>
                    
                    <div className={styles.techIcon}>
                        <div className={styles.iconCore}></div>
                        <div className={styles.iconRing}></div>
                        <div className={styles.iconRing}></div>
                    </div>
                    
                    <div className={styles.dataStream}>
                        <div className={styles.streamLine}></div>
                        <div className={styles.streamLine}></div>
                        <div className={styles.streamLine}></div>
                    </div>
                    
                    <div className={styles.hologram}>
                        <div className={styles.holoLayer}></div>
                        <div className={styles.holoLayer}></div>
                        <div className={styles.holoLayer}></div>
                    </div>
                </div>
                
                <div className={styles.centerPiece}>
                    <div className={styles.mainCircle}>
                        <div className={styles.innerCircle}>
                            <div className={styles.coreGlow}></div>
                        </div>
                    </div>
                    <div className={styles.orbitRing}></div>
                    <div className={styles.orbitRing}></div>
                </div>
            </div>
        </section>
    );
}
