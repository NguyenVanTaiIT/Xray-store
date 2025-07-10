import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { getDashboardStats } from '../../services/adminService';
import { toast } from 'react-toastify';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingOrders: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
  if (!isAuthenticated || user?.role !== 'admin') {
    toast.error('Bạn không có quyền truy cập trang này');
    navigate('/');
  }
}, [user, isAuthenticated, navigate]);

  useEffect(() => {
  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const data = await getDashboardStats();
      setStats({
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.totalRevenue || 0,
        totalUsers: data.totalUsers || 0,
        pendingOrders: data.pendingOrders || 0
      });
    } catch (err) {
      const errorMessage = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
        : err.response?.status === 403
        ? 'Quyền truy cập bị từ chối.'
        : err.message || 'Không thể tải thống kê';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  fetchStats();
}, [user, isAuthenticated, navigate]);


  if (isLoading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.titleIcon}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            Admin Dashboard
          </h1>
          <p className={styles.subtitle}>Bảng điều khiển quản trị hệ thống</p>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Trang chủ
        </button>
      </div>

      <div className={styles.mainContent}>
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Thống kê tổng quan</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                  <circle cx="17" cy="20" r="1"/>
                  <circle cx="9" cy="20" r="1"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stats.totalOrders}</span>
                <span className={styles.statLabel}>Tổng số đơn hàng</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{Number(stats.totalRevenue).toLocaleString('vi-VN')}₫</span>
                <span className={styles.statLabel}>Tổng doanh thu</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stats.totalUsers}</span>
                <span className={styles.statLabel}>Tổng số người dùng</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12,6 12,12 16,14"/>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{stats.pendingOrders}</span>
                <span className={styles.statLabel}>Đơn hàng chờ xử lý</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.managementSection}>
          <h2 className={styles.sectionTitle}>Quản lý hệ thống</h2>
          <div className={styles.managementGrid}>
            <button className={styles.managementCard} onClick={() => navigate('/admin/orders')}>
              <div className={styles.managementIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                  <circle cx="17" cy="20" r="1"/>
                  <circle cx="9" cy="20" r="1"/>
                </svg>
              </div>
              <div className={styles.managementContent}>
                <h3>Quản lý đơn hàng</h3>
                <p>Xem và cập nhật trạng thái đơn hàng</p>
              </div>
              <svg className={styles.managementArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            <button className={styles.managementCard} onClick={() => navigate('/admin/products')}>
              <div className={styles.managementIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div className={styles.managementContent}>
                <h3>Quản lý sản phẩm</h3>
                <p>Thêm, sửa, xóa sản phẩm</p>
              </div>
              <svg className={styles.managementArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>

            <button className={styles.managementCard} onClick={() => navigate('/admin/users')}>
              <div className={styles.managementIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className={styles.managementContent}>
                <h3>Quản lý người dùng</h3>
                <p>Xem và quản lý tài khoản người dùng</p>
              </div>
              <svg className={styles.managementArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}