import React from 'react';
import styles from '../Profile/Profile.module.css'; // Reuse existing styles
import { useNavigate } from 'react-router-dom';

const statusMap = {
  pending: { text: 'Chờ xử lý', color: '#808080' },
  processing: { text: 'Đang xử lý', color: '#FFA500' },
  shipped: { text: 'Đang giao', color: '#1E90FF' },
  delivered: { text: 'Đã giao', color: '#32CD32' },
  cancelled: { text: 'Đã hủy', color: '#FF6347' }
};

export default function Orders({ user, orders, isLoadingOrders }) {
  const navigate = useNavigate();

  const renderOrdersContent = () => (
    user ? (
      <div className={styles.ordersContent}>
        <div className={styles.ordersHeader}>
          <h3 className={styles.sectionTitle}>Lịch sử đơn hàng</h3>
          <p className={styles.ordersSummary}>Tổng cộng {orders.length} đơn hàng</p>
        </div>
        <div className={styles.ordersList}>
          {isLoadingOrders ? (
            <div className={styles.loading}>Đang tải đơn hàng...</div>
          ) : orders.length > 0 ? (
            orders.map(order => (
              <div key={order._id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderId}>{order._id}</span>
                    <span className={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span
                    className={styles.orderStatus}
                    style={{ color: statusMap[order.status]?.color || '#666' }}
                  >
                    {statusMap[order.status]?.text || 'N/A'}
                  </span>
                </div>
                <div className={styles.orderDetails}>
                  <div className={styles.orderMeta}>
                    <span className={styles.orderItems}>{order.items.length} sản phẩm</span>
                    <span className={styles.orderTotal}>
                      {Number(order.totalPrice).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className={styles.orderActions}>
                    <button className={styles.orderViewBtn} onClick={() => navigate(`/orders/${order._id}`)}>
                      Xem chi tiết
                    </button>
                    {order.status === 'delivered' && (
                      <button className={styles.orderReviewBtn}>Đánh giá</button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>Chưa có đơn hàng nào.</p>
          )}
        </div>
      </div>
    ) : (
      <div className={styles.loading}>Đang tải đơn hàng...</div>
    )
  );

  return renderOrdersContent();
}