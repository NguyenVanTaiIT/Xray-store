import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { getOrders, updateOrderStatus, deleteOrder } from '../../../services/orderService';
import { toast } from 'react-toastify';
import AdminPanel from '../../../components/AdminPanel';
import styles from './AdminOrders.module.css';

export default function AdminOrders() {
  const { user, isAuthenticated } = useContext(UserContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
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

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'processing': return styles.statusProcessing;
      case 'shipped': return styles.statusShipped;
      case 'delivered': return styles.statusDelivered;
      case 'cancelled': return styles.statusCancelled;
      default: return styles.statusDefault;
    }
  };

  if (isLoading) {
    return (
      <AdminPanel title="Quản lý đơn hàng" subtitle="Đang tải danh sách đơn hàng...">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tải danh sách đơn hàng...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Quản lý đơn hàng" 
      subtitle="Xem và cập nhật trạng thái đơn hàng"
    >
      {/* Statistics */}
      <div className={styles.statsRow}>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Tổng đơn hàng</span>
            <span className={styles.statValue}>{orders.length}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Chờ xử lý</span>
            <span className={`${styles.statValue} ${styles.statPending}`}>
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Đã giao</span>
            <span className={`${styles.statValue} ${styles.statDelivered}`}>
              {orders.filter(o => o.status === 'delivered').length}
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Đã hủy</span>
            <span className={`${styles.statValue} ${styles.statCancelled}`}>
              {orders.filter(o => o.status === 'cancelled').length}
            </span>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Danh sách đơn hàng</h3>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
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
                <tr key={order._id}>
                  <td>
                    <span className={styles.orderId}>#{order._id.slice(-8)}</span>
                  </td>
                  <td>
                    <div className={styles.userInfo}>
                      <span className={styles.userName}>{order.name || 'Không có tên'}</span>
                    </div>
                  </td>
                  <td className={styles.orderDate}>
                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <span className={styles.totalPrice}>
                      {Number(order.totalPrice).toLocaleString('vi-VN')}₫
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.detailBtn}
                        onClick={() => navigate(`/orders/${order._id}`)}
                      >
                        Chi tiết
                      </button>
                      <button 
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteOrder(order._id)}
                      >
                        Xóa
                      </button>
                      <select
                        className={styles.statusSelect}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="processing">Đang xử lý</option>
                        <option value="shipped">Đang giao</option>
                        <option value="delivered">Đã giao</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPanel>
  );
}