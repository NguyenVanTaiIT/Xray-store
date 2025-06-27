import React from "react";
import styles from "./Intro.module.css";

export default function Intro() {
    return (
        <div className={styles.intro}>
            <div className={styles.introContent}>
                <div className={styles.logo}>
                    <img src="/razer.png" alt="Razer" className={styles.logoImage} />
                </div>
                <h1 className={styles.title}>
                    <span className={styles.titleGradient}>Xray</span> Laptop Store
                </h1>
                <p className={styles.subtitle}>
                    Khám phá những mẫu laptop gaming mạnh mẽ, thiết kế ấn tượng!
                </p>
                <div className={styles.headerStats}>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>500+</span>
                        <span className={styles.statLabel}>Sản phẩm</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>24/7</span>
                        <span className={styles.statLabel}>Hỗ trợ</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statNumber}>4.9★</span>
                        <span className={styles.statLabel}>Đánh giá</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
