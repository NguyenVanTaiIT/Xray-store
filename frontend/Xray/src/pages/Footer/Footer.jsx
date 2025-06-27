import React from "react";
import styles from "./Footer.module.css";

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                <p>&copy; 2024 Gaming Laptop Store. Tất cả quyền được bảo lưu.</p>
            </div>
        </footer>
    );
}
