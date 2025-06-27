import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, logoutUser } from '../../services/userService';
import { toast } from 'react-toastify';
import { UserContext } from '../../contexts/UserContext';

const statusMap = {
  processing: { text: 'Đang xử lý', color: '#FFA500' },
  shipping: { text: 'Đang giao', color: '#1E90FF' },
  delivered: { text: 'Đã giao', color: '#32CD32' },
  cancelled: { text: 'Đã hủy', color: '#FF6347' }
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setError, setUser } = React.useContext(UserContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Kiểm tra trạng thái xác thực
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem('userData');
      navigate('/login');
      toast.error('Vui lòng đăng nhập để xem hồ sơ.');
    }
  }, [isAuthenticated, navigate]);

  // Khởi tạo editForm khi user thay đổi
  useEffect(() => {
    if (user) {
      const initialForm = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        district: user.address?.district || '',
        city: user.address?.city || '',
        zipCode: user.address?.zipCode || ''
      };
      console.log('Initialized editForm:', JSON.stringify(initialForm, null, 2));
      setEditForm(initialForm);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value });
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      const updatedData = {
        name: editForm.name,
        address: (editForm.street || editForm.district || editForm.city || editForm.zipCode) ? {
          street: editForm.street || '',
          district: editForm.district || '',
          city: editForm.city || '',
          zipCode: editForm.zipCode || ''
        } : undefined
      };
      console.log('Payload to update:', JSON.stringify(updatedData, null, 2));
      await updateProfile(updatedData.name, updatedData.address);
      const updatedUser = await getProfile();
      console.log('Updated user from API:', JSON.stringify(updatedUser, null, 2));
      setUser(updatedUser.user); // Add this line to update UserContext
      localStorage.setItem('userData', JSON.stringify(updatedUser.user));
      setIsEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Lỗi cập nhật thông tin');
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      }
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      street: user?.address?.street || '',
      district: user?.address?.district || '',
      city: user?.address?.city || '',
      zipCode: user?.address?.zipCode || ''
    });
    setIsEditing(false);
  };

  const renderProfileContent = () => (
    user ? (
      <div className={styles.profileContent}>
        <div className={styles.profileHeader}>
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{user.name || 'Người dùng'}</h2>
            <p className={styles.userEmail}>{user.email || 'email@example.com'}</p>
            <p className={styles.joinDate}>Tham gia từ {user.joinDate || 'N/A'}</p>
          </div>
          <div className={styles.profileActions}>
            {!isEditing ? (
              <button
                className={styles.editBtn}
                onClick={() => setIsEditing(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Chỉnh sửa
              </button>
            ) : (
              <div className={styles.editActions}>
                <button className={styles.saveBtn} onClick={handleSave}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  Lưu
                </button>
                <button className={styles.cancelBtn} onClick={handleCancel}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.profileDetails}>
          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>Thông tin cá nhân</h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editForm?.name || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.name || 'N/A'}</span>
                )}
              </div>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm?.email || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.email || 'N/A'}</span>
                )}
              </div>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Số điện thoại</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm?.phone || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.phone || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h3 className={styles.sectionTitle}>Địa chỉ</h3>
            <div className={styles.detailCub}>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Đường/Số nhà</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="street"
                    value={editForm?.street || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.address?.street || 'N/A'}</span>
                )}
              </div>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Quận/Huyện</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="district"
                    value={editForm?.district || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.address?.district || 'N/A'}</span>
                )}
              </div>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Tỉnh/Thành phố</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="city"
                    value={editForm?.city || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.address?.city || 'N/A'}</span>
                )}
              </div>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Mã bưu điện</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="zipCode"
                    value={editForm?.zipCode || ''}
                    onChange={handleInputChange}
                    className={styles.detailInput}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.address?.zipCode || 'N/A'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={styles.loading}>Đang tải thông tin...</div>
    )
  );

  const renderOrdersContent = () => (
    user ? (
      <div className={styles.ordersContent}>
        <div className={styles.ordersHeader}>
          <h3 className={styles.sectionTitle}>Lịch sử đơn hàng</h3>
          <p className={styles.ordersSummary}>Tổng cộng {user.orders?.length || 0} đơn hàng</p>
        </div>
        <div className={styles.ordersList}>
          {user.orders?.map(order => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <span className={styles.orderId}>{order.id}</span>
                  <span className={styles.orderDate}>{order.date}</span>
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
                  <span className={styles.orderItems}>{order.items} sản phẩm</span>
                  <span className={styles.orderTotal}>{order.total}</span>
                </div>
                <div className={styles.orderActions}>
                  <button className={styles.orderViewBtn}>Xem chi tiết</button>
                  {order.status === 'delivered' && (
                    <button className={styles.orderReviewBtn}>Đánh giá</button>
                  )}
                </div>
              </div>
            </div>
          )) || <p>Chưa có đơn hàng nào.</p>}
        </div>
      </div>
    ) : (
      <div className={styles.loading}>Đang tải đơn hàng...</div>
    )
  );

  const renderStatsContent = () => (
    user ? (
      <div className={styles.statsContent}>
        <h3 className={styles.sectionTitle}>Thống kê tài khoản</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                <circle cx="17" cy="20" r="1" />
                <circle cx="9" cy="20" r="1" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{user.stats?.totalOrders || 0}</span>
              <span className={styles.statLabel}>Tổng đơn hàng</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{user.stats?.totalSpent || '0₫'}</span>
              <span className={styles.statLabel}>Tổng chi tiêu</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}>{user.stats?.loyaltyPoints || 0}</span>
              <span className={styles.statLabel}>Điểm tích lũy</span>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={styles.loading}>Đang tải thống kê...</div>
    )
  );

  return (
    <div className={styles.accountContainer}>
      <Header />

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Tài khoản của tôi</h1>
          <p className={styles.heroSubtitle}>Quản lý thông tin cá nhân và đơn hàng</p>
          <div className={styles.breadcrumb}>
            <span onClick={() => navigate('/')} className={styles.breadcrumbLink}>Trang chủ</span>
            <svg className={styles.breadcrumbArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className={styles.breadcrumbCurrent}>Tài khoản</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.mainContent}>
        <div className={styles.contentContainer}>
          {/* Sidebar Navigation */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarContent}>
              <div className={styles.userPreview}>
                {user ? (
                  <>
                    <div className={styles.userDetails}>
                      <h3 className={styles.sidebarUserName}>{user.name || 'Người dùng'}</h3>
                      <p className={styles.sidebarUserEmail}>{user.email || 'email@example.com'}</p>
                    </div>
                  </>
                ) : (
                  <div className={styles.loading}>Đang tải...</div>
                )}
              </div>

              <nav className={styles.sidebarNav}>
                <button
                  className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Thông tin cá nhân
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17" />
                    <circle cx="17" cy="20" r="1" />
                    <circle cx="9" cy="20" r="1" />
                  </svg>
                  Đơn hàng
                </button>
                <button
                  className={`${styles.navItem} ${activeTab === 'stats' ? styles.active : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Thống kê
                </button>
                <button
                  className={styles.navItem}
                  onClick={async () => {
                    try {
                      await logout();
                      navigate('/login');
                      toast.success('Đã đăng xuất');
                    } catch (err) {
                      console.error('Logout error:', err);
                      toast.error('Lỗi khi đăng xuất');
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Đăng xuất
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className={styles.contentArea}>
            {activeTab === 'profile' && renderProfileContent()}
            {activeTab === 'orders' && renderOrdersContent()}
            {activeTab === 'stats' && renderStatsContent()}
          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}