import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Orders from '../Orders/Orders';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfile, updateProfile } from '../../services/userService';
import { getMyOrders } from '../../services/orderService';
import { toast } from 'react-toastify';
import { UserContext } from '../../contexts/UserContext';
import LocationSelector from '../../components/LocationSelector';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, setUser } = React.useContext(UserContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'orders') {
      setActiveTab('orders');
    }
  }, [location]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) return;
      try {
        console.log('Profile - Fetching orders for current user');
        const data = await getMyOrders();
        setOrders(data.orders); // ✅ Đúng: lấy mảng orders từ response
      } catch (err) {
        console.error('Profile - Fetch orders error:', err.message);
        toast.error(err.response?.data?.message || err.message || 'Không thể tải danh sách đơn hàng');
      }
    };
    fetchOrders();
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } 
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (user) {
      const initialForm = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        district: user.address?.district || '',
        city: user.address?.city || '',
        zipCode: user.address?.zipCode || '',
        ward: user.address?.ward || ''
      };
      setEditForm(initialForm);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setErrors({});

    const validationErrors = {};
    if (!editForm?.name?.trim()) {
      validationErrors.name = 'Tên là bắt buộc';
    }
    if (!editForm?.email?.trim()) {
      validationErrors.email = 'Email là bắt buộc';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      const updatedData = {
        name: editForm.name.trim().replace(/[^\w\sÀ-ÿ]/g, ''),
        phone: editForm.phone?.trim() || '',
        address: {
          street: editForm.street?.trim() || '',
          ward: editForm.ward?.trim() || '',
          district: editForm.district?.trim() || '',
          city: editForm.city?.trim() || '',
          zipCode: editForm.zipCode?.trim() || ''
        }
      };
      console.log('Profile - Sending update profile data:', JSON.stringify(updatedData));
      await updateProfile(updatedData);
      console.log('Profile - Profile updated successfully');
      toast.success('Cập nhật thông tin thành công');
      const updatedUser = await getProfile();
      console.log('Profile - Fetched updated user:', updatedUser.user);
      setUser(updatedUser.user);
      setIsEditing(false);
      setEditForm({ ...updatedUser.user, street: updatedUser.user.address?.street || '' });
    } catch (err) {
      console.error('Profile - Error updating profile:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi cập nhật thông tin';
      toast.error(errorMessage);
      if (err.response?.status === 401) {
        console.error('Profile - Unauthorized, redirecting to login');
        await logout();
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
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
      zipCode: user?.address?.zipCode || '',
      ward: user?.address?.ward || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  const renderProfileContent = () => (
    user ? (
      <div className={styles.profileContent}>
        {user?.role === 'admin' && (
          <div style={{ marginBottom: 24, textAlign: 'right' }}>
            <button
              style={{
                background: 'linear-gradient(90deg, #1E90FF, #4169E1)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(30,144,255,0.15)'
              }}
              onClick={() => navigate('/admin')}
            >
              Vào trang admin
            </button>
          </div>
        )}
        <div className={styles.profileHeader}>
          <div className={styles.userInfo}>
            <h2 className={styles.userName}>{user.name || 'Người dùng'}</h2>
            <p className={styles.userEmail}>{user.email || 'email@example.com'}</p>
            <p className={styles.joinDate}>Tham gia từ {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className={styles.profileActions}>
            {!isEditing ? (
              <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Chỉnh sửa
              </button>
            ) : (
              <div className={styles.editActions}>
                <button className={styles.saveBtn} onClick={handleSave} disabled={isLoading}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  {isLoading ? 'Đang lưu...' : 'Lưu'}
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
                    className={`${styles.detailInput} ${errors.name ? styles.inputError : ''}`}
                  />
                ) : (
                  <span className={styles.detailValue}>{user.name || 'N/A'}</span>
                )}
                {errors.name && <span className={styles.errorText}>{errors.name}</span>}
              </div>
              <div className={styles.detailItem}>
                <label className={styles.detailLabel}>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editForm?.email || ''}
                    onChange={handleInputChange}
                    className={`${styles.detailInput} ${styles.detailInputDisabled} ${errors.email ? styles.inputError : ''}`}
                    disabled 
                  />
                ) : (
                  <span className={styles.detailValue}>{user.email || 'N/A'}</span>
                )}
                {errors.email && <span className={styles.errorText}>{errors.email}</span>}
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

              {isEditing ? (
                <LocationSelector
                  formData={{
                    city: editForm?.city || '',
                    district: editForm?.district || '',
                    ward: editForm?.ward || '',
                    zipCode: editForm?.zipCode || ''
                  }}
                  setFormData={(newAddress) =>
                    setEditForm(prev => ({
                      ...prev,
                      ...newAddress
                    }))
                  }
                  styles={styles}
                  errors={errors}
                />
              ) : (
                <>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Phường/Xã</label>
                    <span className={styles.detailValue}>{user.address?.ward || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Quận/Huyện</label>
                    <span className={styles.detailValue}>{user.address?.district || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Tỉnh/Thành phố</label>
                    <span className={styles.detailValue}>{user.address?.city || 'N/A'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <label className={styles.detailLabel}>Mã bưu điện</label>
                    <span className={styles.detailValue}>{user.address?.zipCode || 'N/A'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={styles.loading}>Đang tải thông tin...</div>
    )
  );

  const renderStatsContent = () => {
    // Thêm log để kiểm tra dữ liệu thống kê user
    console.log('📊 Thống kê user:', user?.stats);

    return user ? (
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
              <span className={styles.statValue}>
                {user.stats && typeof user.stats.totalOrders === 'number'
                  ? user.stats.totalOrders
                  : 0}
              </span>
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
              <span className={styles.statValue}>
                {user.stats && typeof user.stats.totalSpent === 'number'
                  ? `${Number(user.stats.totalSpent).toLocaleString('vi-VN')}₫`
                  : '0₫'}
              </span>
              <span className={styles.statLabel}>Tổng chi tiêu</span>
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className={styles.loading}>Đang tải thống kê...</div>
    );
  };

  return (
    <div className={styles.accountContainer}>
      <Header />
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

      <section className={styles.mainContent}>
        <div className={styles.contentContainer}>
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
                    } catch (err) {
                      console.error('Profile - Error logging out:', err);
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

          <main className={styles.contentArea}>
            {activeTab === 'profile' && renderProfileContent()}
            {activeTab === 'orders' && <Orders user={user} orders={orders} />}
            {activeTab === 'stats' && renderStatsContent()}
          </main>
        </div>
      </section>

      <Footer />
    </div>
  );
}