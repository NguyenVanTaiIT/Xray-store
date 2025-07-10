import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderById } from '../../services/orderService';
import { useContext } from 'react';
import { UserContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import styles from './OrderDetail.module.css';

export default function OrderDetail() {
  const { user, isAuthenticated } = useContext(UserContext);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async (id) => {
      if (!isAuthenticated || !user?.id) {
        toast.error('Vui lòng đăng nhập để xem chi tiết đơn hàng');
        navigate('/login');
        return;
      }
      if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
        toast.error('ID đơn hàng không hợp lệ');
        navigate('/profile');
        return;
      }
      setIsLoading(true);
      try {
        const data = await getOrderById(id);
        // Chỉ cho phép admin hoặc chủ đơn hàng xem
        if (user.role === 'admin' || data.userId?.toString() === user.id?.toString()) {
          setOrder(data);
        } else {
          toast.error('Không có quyền xem đơn hàng này');
          navigate('/profile');
        }
      } catch (err) {
        console.error('Error fetching order:', err.response?.data || err.message);
        const errorMessage = err.response?.status === 404
          ? 'Không tìm thấy đơn hàng'
          : err.response?.status === 401
          ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
          : err.message || 'Không thể tải chi tiết đơn hàng';
        toast.error(errorMessage);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          navigate('/profile');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder(orderId);
  }, [orderId, user, isAuthenticated, navigate]);

  const handleReview = (productId) => {
    const pid = productId?._id || productId;
    navigate(`/product-detail/${pid}#review`);
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'pending': 'pending',
      'processing': 'processing',
      'shipped': 'shipped',
      'delivered': 'delivered',
      'cancelled': 'cancelled'
    };
    return statusMap[status] || 'pending';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'pending': 'Chờ xử lý',
      'processing': 'Đang xử lý',
      'shipped': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorContent}>
          <h1 className={styles.errorTitle}>Không tìm thấy đơn hàng</h1>
          <p className={styles.errorMessage}>
            Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/profile')}
          >
            ← Quay lại hồ sơ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.orderContainer}>
      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/profile')}
          >
            ← Quay lại hồ sơ
          </button>
          {user?.role === 'admin' && (
            <button 
              className={styles.adminBackButton}
              onClick={() => navigate('/admin/orders')}
            >
              ← Quay lại trang quản lý đơn hàng
            </button>
          )}
          <h1 className={styles.heroTitle}>Chi tiết đơn hàng</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <div className={styles.orderDetailCard}>
            
            {/* Order Header */}
            <div className={styles.orderHeader}>
              <div className={styles.orderTitleSection}>
                <h2 className={styles.orderTitle}>Đơn hàng #{order._id}</h2>
                <div className={styles.orderMeta}>
                  <p className={styles.orderId}>Mã đơn hàng: {order._id}</p>
                  <p className={styles.orderDate}>
                    Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className={`${styles.orderStatusBadge} ${styles[getStatusClass(order.status)]}`}>
                {getStatusText(order.status)}
              </div>
            </div>

            {/* Order Sections */}
            <div className={styles.orderSections}>
              
              {/* Order Summary */}
              <div className={styles.orderSection}>
                <h3 className={styles.sectionTitle}>
                  📋 Tóm tắt đơn hàng
                </h3>
                <div className={styles.orderSummary}>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Số lượng sản phẩm</span>
                    <span className={styles.summaryValue}>
                      {order.items.reduce((total, item) => total + item.quantity, 0)} sản phẩm
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Tổng giá trị</span>
                    <span className={`${styles.summaryValue} ${styles.totalPrice}`}>
                      {Number(order.totalPrice).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Trạng thái</span>
                    <span className={styles.summaryValue}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Phương thức thanh toán</span>
                    <span className={styles.summaryValue}>
                      {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product List */}
              <div className={styles.orderSection}>
                <h3 className={styles.sectionTitle}>
                  🛍️ Danh sách sản phẩm
                </h3>
                <div className={styles.productList}>
                  {order.items.map((item, index) => (
                    <div key={item.productId || index} className={styles.productItem}>
                      <div className={styles.productHeader}>
                        <div className={styles.productInfo}>
                          <h4 className={styles.productName}>{item.name}</h4>
                          <div className={styles.productDetails}>
                            <span className={styles.productPrice}>
                              Giá: {Number(item.price).toLocaleString('vi-VN')}₫
                            </span>
                            <span className={styles.productQuantity}>
                              Số lượng: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <div className={styles.productSubtotal}>
                          {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                      {order.status === 'delivered' && (
                        <button 
                          className={styles.reviewButton}
                          onClick={() => handleReview(item.productId?._id || item.productId)}
                        >
                          ⭐ Đánh giá sản phẩm
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className={styles.orderSection}>
                <h3 className={styles.sectionTitle}>
                  🚚 Thông tin giao hàng
                </h3>
                <div className={styles.addressGrid}>
                  <div className={styles.addressItem}>
                    <span className={styles.addressLabel}>Đường/Số nhà</span>
                    <span className={`${styles.addressValue} ${!order.shippingAddress.street ? styles.empty : ''}`}>
                      {order.shippingAddress.street || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className={styles.addressItem}>
                    <span className={styles.addressLabel}>Phường/Xã</span>
                    <span className={`${styles.addressValue} ${!order.shippingAddress.ward ? styles.empty : ''}`}>
                      {order.shippingAddress.ward || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className={styles.addressItem}>
                    <span className={styles.addressLabel}>Quận/Huyện</span>
                    <span className={`${styles.addressValue} ${!order.shippingAddress.district ? styles.empty : ''}`}>
                      {order.shippingAddress.district || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className={styles.addressItem}>
                    <span className={styles.addressLabel}>Tỉnh/Thành phố</span>
                    <span className={`${styles.addressValue} ${!order.shippingAddress.city ? styles.empty : ''}`}>
                      {order.shippingAddress.city || 'Chưa cung cấp'}
                    </span>
                  </div>
                  <div className={styles.addressItem}>
                    <span className={styles.addressLabel}>Mã bưu điện</span>
                    <span className={`${styles.addressValue} ${!order.shippingAddress.zipCode ? styles.empty : ''}`}>
                      {order.shippingAddress.zipCode || 'Chưa cung cấp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className={styles.orderSection}>
                <h3 className={styles.sectionTitle}>
                  💳 Phương thức thanh toán
                </h3>
                <div className={styles.paymentMethod}>
                  <div className={styles.paymentIcon}>
                    {order.paymentMethod === 'cod' ? '💰' : '🏦'}
                  </div>
                  <span className={styles.paymentText}>
                    {order.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}