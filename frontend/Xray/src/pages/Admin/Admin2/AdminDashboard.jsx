import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { getDashboardStats } from '../../../services/adminService';
import { toast } from 'react-toastify';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import AdminPanel from '../../../components/AdminPanel';
import styles from './AdminDashboard.module.css';

// Sample data for charts
const salesData = [
  { name: 'Tháng 1', orders: 120, revenue: 50000000 },
  { name: 'Tháng 2', orders: 150, revenue: 65000000 },
  { name: 'Tháng 3', orders: 180, revenue: 78000000 },
  { name: 'Tháng 4', orders: 200, revenue: 85000000 },
  { name: 'Tháng 5', orders: 220, revenue: 92000000 },
  { name: 'Tháng 6', orders: 250, revenue: 105000000 },
];

const categoryData = [
  { name: 'Gaming', value: 45, color: '#8884d8' },
  { name: 'Office', value: 30, color: '#82ca9d' },
  { name: 'Ultrabook', value: 25, color: '#ffc658' },
];

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
      <AdminPanel title="Admin Dashboard">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tải thống kê...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Admin Dashboard" 
      subtitle="Bảng điều khiển quản trị hệ thống"
      showBackButton={true}
      backPath="/"
    >
      {/* Statistics Cards */}
      <div className={styles.statsRow}>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Tổng số đơn hàng</span>
            <span className={styles.statValue}>{stats.totalOrders}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Tổng doanh thu</span>
            <span className={styles.statValue}>
              {Number(stats.totalRevenue).toLocaleString('vi-VN')}₫
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Tổng số người dùng</span>
            <span className={styles.statValue}>{stats.totalUsers}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Đơn hàng chờ xử lý</span>
            <span className={styles.statValue}>{stats.pendingOrders}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsRow}>
        <div className={styles.card}>
          <div className={styles.chartTitle}>Biểu đồ doanh thu theo tháng</div>
          <LineChart width={500} height={300} data={salesData}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN') + '₫'} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#1E90FF" strokeWidth={2} />
          </LineChart>
        </div>

        <div className={styles.card}>
          <div className={styles.chartTitle}>Số lượng đơn hàng theo tháng</div>
          <BarChart width={500} height={300} data={salesData}>
            <CartesianGrid stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#82ca9d" />
          </BarChart>
        </div>
      </div>

      <div className={styles.chartsRow}>
        <div className={styles.card}>
          <div className={styles.chartTitle}>Phân bố sản phẩm theo danh mục</div>
          <PieChart width={500} height={300}>
            <Pie
              data={categoryData}
              cx={250}
              cy={150}
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>

        <div className={styles.card}>
          <div className={styles.chartTitle}>Quản lý hệ thống</div>
          <div className={styles.managementButtons}>
            <button 
              className={styles.managementBtn}
              onClick={() => navigate('/admin/orders')}
            >
              Quản lý đơn hàng
            </button>
            <button 
              className={styles.managementBtn}
              onClick={() => navigate('/admin/products')}
            >
              Quản lý sản phẩm
            </button>
            <button 
              className={styles.managementBtn}
              onClick={() => navigate('/admin/users')}
            >
              Quản lý người dùng
            </button>
          </div>
        </div>
      </div>
    </AdminPanel>
  );
}