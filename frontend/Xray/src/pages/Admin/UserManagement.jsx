import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';
import { updateUserByAdmin, fetchUsers, deleteUser } from '../../services/userService';
import { toast } from 'react-toastify';
import LocationSelector from '../../components/LocationSelector';
import { Users, Edit, Trash2, X, Save, ArrowLeft, UserPlus } from 'lucide-react';
import styles from './UserManagement.module.css';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = React.useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    // if (!isAuthenticated || user?.role !== 'admin') {
    //   navigate('/login');
    //   toast.error('Bạn cần quyền admin để truy cập');
    //   return;
    // }

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(data.users);
      } catch (err) {
        toast.error(err.message || 'Không thể tải danh sách người dùng');
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditingUser(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else {
      setEditingUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updatedData = {
        name: editingUser.name,
        phone: editingUser.phone,
        address: {
          street: editingUser.address?.street || '',
          city: editingUser.address?.city || '',
          district: editingUser.address?.district || '',
          ward: editingUser.address?.ward || '',
          zipCode: editingUser.address?.zipCode || ''
        },
        role: editingUser.role,
        _id: editingUser._id
      };
      console.log('UserManagement - Sending update data:', JSON.stringify(updatedData));
      const response = await updateUserByAdmin(editingUser._id, updatedData);
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...response.user } : u));
      setEditingUser(null);
      toast.success('Cập nhật người dùng thành công');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      if (id === user._id) {
        toast.error('Không thể xóa tài khoản của chính bạn');
        return;
      }
      await deleteUser(id);
      setUsers(users.filter(u => u._id !== id));
      toast.success('Xóa người dùng thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể xóa người dùng');
    }
  };

  const handleEditClick = (userData) => {
    // Khởi tạo address nếu chưa có
    setEditingUser({
      ...userData,
      address: {
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        district: userData.address?.district || '',
        ward: userData.address?.ward || '',
        zipCode: userData.address?.zipCode || ''
      }
    });
  };

  if (isLoading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <Users className={styles.titleIcon} />
            Quản lý người dùng
          </h1>
          <p className={styles.subtitle}>
            Quản lý thông tin và quyền hạn của người dùng trong hệ thống
          </p>
        </div>
        <button 
          className={styles.backBtn}
          onClick={() => navigate('/admin')}
        >
          <ArrowLeft />
          Quay lại
        </button>
      </div>

      <div className={styles.mainContent}>
        {/* Edit User Form */}
        {editingUser && (
          <div className={styles.formSection}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  <Edit className={styles.formIcon} />
                  Chỉnh sửa người dùng
                </h2>
                <button 
                  className={styles.closeFormBtn}
                  onClick={() => setEditingUser(null)}
                >
                  <X />
                </button>
              </div>
              
              <form className={styles.form} onSubmit={handleEditUser}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tên người dùng</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="name"
                      value={editingUser.name || ''}
                      onChange={handleInputChange}
                      placeholder="Tên người dùng"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input
                      className={styles.formInput}
                      type="email"
                      name="email"
                      value={editingUser.email || ''}
                      onChange={handleInputChange}
                      placeholder="Email"
                      disabled
                      title="Không thể chỉnh sửa email"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số điện thoại</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="phone"
                      value={editingUser.phone || ''}
                      onChange={handleInputChange}
                      placeholder="Số điện thoại"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Vai trò</label>
                    <select
                      className={styles.formSelect}
                      name="role"
                      value={editingUser.role || 'user'}
                      onChange={handleInputChange}
                    >
                      <option value="user">Người dùng</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Địa chỉ</label>
                    <div className={styles.addressContainer}>
                      <input
                        className={styles.formInput}
                        type="text"
                        name="address.street"
                        value={editingUser.address?.street || ''}
                        onChange={handleInputChange}
                        placeholder="Đường/Số nhà"
                      />
                      <LocationSelector
                        formData={editingUser.address || { city: '', district: '', ward: '', zipCode: '' }}
                        setFormData={(newAddress) =>
                          setEditingUser(prev => ({
                            ...prev,
                            address: { ...prev.address, ...newAddress }
                          }))
                        }
                        styles={{ 
                          formInput: styles.formInput, 
                          formSelect: styles.formSelect,
                          inputError: styles.inputError, 
                          errorText: styles.errorText,
                          formRow: styles.formRow,
                          formGroup: styles.formGroup
                        }}
                        errors={{}}
                      />
                    </div>
                  </div>
                </div>
                
                <div className={styles.formButtons}>
                  <button type="submit" className={styles.submitBtn}>
                    <Save />
                    Cập nhật
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelBtn}
                    onClick={() => setEditingUser(null)}
                  >
                    <X />
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* User List */}
        <div className={styles.usersSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Danh sách người dùng</h2>
            <div className={styles.userStats}>
              <span className={styles.statsText}>
                Tổng số: {users.length} người dùng
              </span>
            </div>
          </div>
          
          {users.length > 0 ? (
            <div className={styles.tableContainer}>
              <table className={styles.usersTable}>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th className={styles.actionsCell}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(userData => (
                    <tr key={userData._id} className={styles.userRow}>
                      <td>
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            <Users />
                          </div>
                          <div>
                            <div className={styles.userName}>{userData.name}</div>
                            <div className={styles.userUsername}>@{userData.email?.split('@')[0]}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.emailCell}>{userData.email}</td>
                      <td className={styles.phoneCell}>{userData.phone || 'Chưa cập nhật'}</td>
                      <td>
                        <span className={userData.role === 'admin' ? styles.adminBadge : styles.userBadge}>
                          {userData.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>
                      <td>
                        <span className={styles.statusActive}>Hoạt động</span>
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={styles.editBtn}
                            onClick={() => handleEditClick(userData)}
                          >
                            <Edit />
                            Sửa
                          </button>
                          <button 
                            className={styles.deleteBtn}
                            onClick={() => handleDeleteUser(userData._id)}
                          >
                            <Trash2 />
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <UserPlus className={styles.emptyIcon} />
              <h3>Chưa có người dùng nào</h3>
              <p>Hệ thống chưa có người dùng nào được đăng ký.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}