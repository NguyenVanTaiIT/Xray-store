import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { getOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import { toast } from 'react-toastify';
import styles from './AdminOrders.module.css';

export default function AdminOrders() {
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
  const fetchOrders = async () => {
    // if (!isAuthenticated || !user?.id) {
    //   toast.error('Vui lòng đăng nhập để quản lý đơn hàng');
    //   navigate('/login');
    //   return;
    // }
    if (user.role !== 'admin') {
      toast.error('Chỉ admin mới có quyền truy cập trang này');
      navigate('/profile');
      return;
    }
    setIsLoading(true);
    try {
      const data = await getOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err.response?.data || err.message);
      const errorMessage = err.response?.status === 401
        ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
        : err.message || 'Không thể tải danh sách đơn hàng';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };
  fetchOrders();
}, [user, isAuthenticated, navigate]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders(orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      toast.success('Cập nhật trạng thái đơn hàng thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc muốn xóa đơn hàng này?')) return;
    try {
      await deleteOrder(orderId);
      setOrders(orders.filter(order => order._id !== orderId));
      toast.success('Xóa đơn hàng thành công');
    } catch (err) {
      console.error('Error deleting order:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Không thể xóa đơn hàng');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'processing': return styles.statusProcessing;
      case 'shipped': return styles.statusShipped;
      case 'delivered': return styles.statusDelivered;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusPending;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đang giao';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải danh sách đơn hàng...</p>
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
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
              <circle cx="17" cy="20" r="1"/>
              <circle cx="9" cy="20" r="1"/>
            </svg>
            Quản lý đơn hàng
          </h1>
          <p className={styles.subtitle}>Xem và cập nhật trạng thái đơn hàng</p>
        </div>
        <button className={styles.backBtn} onClick={() => navigate('/admin')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Quay lại Admin
        </button>
      </div>

      <div className={styles.mainContent}>
        <section className={styles.ordersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Danh sách đơn hàng</h2>
            <div className={styles.orderStats}>
              <span className={styles.statsText}>Tổng cộng: {orders.length} đơn hàng</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.emptyIcon}>
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"/>
                <circle cx="17" cy="20" r="1"/>
                <circle cx="9" cy="20" r="1"/>
              </svg>
              <h3>Chưa có đơn hàng nào</h3>
              <p>Các đơn hàng mới sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.ordersTable}>
                <thead>
                  <tr>
                    <th>ID đơn hàng</th>
                    <th>Người dùng</th>
                    <th>Ngày đặt</th>
                    <th>Tổng giá</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} className={styles.orderRow}>
                      <td className={styles.orderIdCell}>
                        <span className={styles.orderId}>#{order._id.slice(-8)}</span>
                      </td>
                      <td className={styles.userCell}>
                        <div className={styles.userInfo}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={styles.userIcon}>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </svg>
                          <span>{order.name || 'Không có tên'}</span>
                        </div>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={styles.priceCell}>
                        <span className={styles.price}>
                          {Number(order.totalPrice).toLocaleString('vi-VN')}₫
                        </span>
                      </td>
                      <td className={styles.statusCell}>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order._id, e.target.value)}
                          className={`${styles.statusSelect} ${getStatusColor(order.status)}`}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="shipped">Đang giao</option>
                          <option value="delivered">Đã giao</option>
                          <option value="cancelled">Đã hủy</option>
                        </select>
                      </td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.viewBtn}
                            onClick={() => navigate(`/orders/${order._id}`)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Chi tiết
                          </button>
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteOrder(order._id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3,6 5,6 21,6"/>
                              <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6m3,0V4a2,2 0,0,1,2-2h4a2,2 0,0,1,2,2v2"/>
                            </svg>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}