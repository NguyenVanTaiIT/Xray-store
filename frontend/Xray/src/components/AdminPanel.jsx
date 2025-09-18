import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import styles from './AdminPanel.module.css';

const AdminPanel = ({ children, title, showBackButton = true, backPath = '/admin' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định menu item active dựa trên path hiện tại
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/admin/orders')) return '2';
    if (path.includes('/admin/products')) return '3';
    if (path.includes('/admin/users')) return '4';
    return '1'; // Dashboard
  };

  const menuItems = [
    {
      key: '1',
      label: 'Dashboard',
      onClick: () => navigate('/admin')
    },
    {
      key: '2',
      label: 'Đơn hàng',
      onClick: () => navigate('/admin/orders')
    },
    {
      key: '3',
      label: 'Sản phẩm',
      onClick: () => navigate('/admin/products')
    },
    {
      key: '4',
      label: 'Người dùng',
      onClick: () => navigate('/admin/users')
    }
  ];

  return (
    <div className={styles.layoutTransition}>
      {/* Sidebar cố định */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>Admin Panel</h3>
        </div>
        <ul className={styles.menu}>
          {menuItems.map(item => (
            <li
              key={item.key}
              className={`${styles.menuItem} ${getSelectedKey() === item.key ? styles.active : ''}`}
              onClick={item.onClick}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </aside>

      {/* Layout chính, chừa khoảng trống sidebar */}
      <div className={styles.mainLayout}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.headerTitle}>{title}</h1>
            
            {/* Header Actions */}
            <div className={styles.headerActions}>
              <DarkModeToggle />
              {showBackButton && (
                <button
                  className={styles.backButton}
                  onClick={() => navigate(backPath)}
                >
                  {backPath === '/admin' ? 'Dashboard' : 'Quay lại'}
                </button>
              )}
            </div>
          </div>
        </header>

        <main className={styles.content}>
          <div className={styles.contentInner}>
            {children}
          </div>
        </main>

        <footer className={styles.footer}>
          Admin Dashboard ©2024 - Powered by React
        </footer>
      </div>
    </div>
  );
};

export default AdminPanel;