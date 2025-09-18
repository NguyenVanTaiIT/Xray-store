import React from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import styles from './DarkModeToggle.module.css';

const DarkModeToggle = () => {
  const { isDark, toggleTheme } = useDarkMode();

  return (
    <button
      onClick={toggleTheme}
      className={`${styles.toggleButton} ${isDark ? styles.dark : styles.light}`}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      {/* Toggle Track */}
      <div className={styles.track}>
        {/* Toggle Circle */}
        <div className={`${styles.thumb} ${isDark ? styles.thumbDark : styles.thumbLight}`}>
          {/* Icon inside thumb */}
          <div className={styles.icon}>
            {isDark ? (
              // Moon Icon
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.moonIcon}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              // Sun Icon
              <svg viewBox="0 0 24 24" fill="currentColor" className={styles.sunIcon}>
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            )}
          </div>
        </div>
        
        {/* Background Icons */}
        <div className={styles.backgroundIcons}>
          {/* Sun Icon (Left) */}
          <div className={`${styles.bgIcon} ${styles.bgSun} ${isDark ? styles.iconInactive : styles.iconActive}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3" strokeLinecap="round"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </div>
          
          {/* Moon Icon (Right) */}
          <div className={`${styles.bgIcon} ${styles.bgMoon} ${isDark ? styles.iconActive : styles.iconInactive}`}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
};

export default DarkModeToggle;