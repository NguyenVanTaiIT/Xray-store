import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../../contexts/UserContext';
import { updateUserByAdmin, fetchUsers, deleteUser } from '../../../services/userService';
import { toast } from 'react-toastify';
import AdminPanel from '../../../components/AdminPanel';
import styles from './UserManagement.module.css';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = React.useContext(UserContext);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formValues, setFormValues] = useState({});

  useEffect(() => {
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

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa người dùng này?')) return;
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
    setEditingUser(userData);
    setFormValues({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role,
      street: userData.address?.street || '',
      city: userData.address?.city || '',
      district: userData.address?.district || '',
      ward: userData.address?.ward || '',
      zipCode: userData.address?.zipCode || ''
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingUser(null);
    setFormValues({});
  };

  const handleModalOk = async () => {
    try {
      const updatedData = {
        name: formValues.name,
        phone: formValues.phone,
        address: {
          street: formValues.street,
          city: formValues.city,
          district: formValues.district,
          ward: formValues.ward,
          zipCode: formValues.zipCode
        },
        role: formValues.role,
        _id: editingUser._id
      };
      const response = await updateUserByAdmin(editingUser._id, updatedData);
      setUsers(users.map(u => u._id === editingUser._id ? { ...u, ...response.user } : u));
      toast.success('Cập nhật người dùng thành công');
      handleModalCancel();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật người dùng');
    }
  };

  if (isLoading) {
    return (
      <AdminPanel title="Quản lý người dùng" subtitle="Đang tải danh sách người dùng...">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tải danh sách người dùng...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Quản lý người dùng" 
      subtitle="Quản lý thông tin và quyền hạn của người dùng trong hệ thống"
    >
      {/* Statistics */}
      <div className={styles.statsRow}>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Tổng số người dùng</span>
            <span className={styles.statValue}>{users.length}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Quản trị viên</span>
            <span className={styles.statValue}>{users.filter(u => u.role === 'admin').length}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Người dùng thường</span>
            <span className={styles.statValue}>{users.filter(u => u.role === 'user').length}</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <h3>Danh sách người dùng</h3>
          <button className={styles.addBtn}>Thêm người dùng</button>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(record => (
              <tr key={record._id}>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{record.name}</div>
                    <div className={styles.userHandle}>@{record.email?.split('@')[0]}</div>
                  </div>
                </td>
                <td>{record.email}</td>
                <td>{record.phone || 'Chưa cập nhật'}</td>
                <td>
                  <span className={`${styles.roleTag} ${record.role === 'admin' ? styles.roleAdmin : styles.roleUser}`}>
                    {record.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                  </span>
                </td>
                <td>
                  <span className={styles.statusActive}>Hoạt động</span>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button className={styles.editBtn} onClick={() => handleEditClick(record)}>
                      Sửa
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteUser(record._id)}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {isModalVisible && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Chỉnh sửa người dùng</h3>
            <form className={styles.form}>
              <input
                type="text"
                placeholder="Tên người dùng"
                value={formValues.name || ""}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Email"
                value={formValues.email || ""}
                disabled
              />
              <input
                type="text"
                placeholder="Số điện thoại"
                value={formValues.phone || ""}
                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
              />
              <select
                value={formValues.role || ""}
                onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
              >
                <option value="user">Người dùng</option>
                <option value="admin">Quản trị viên</option>
              </select>
              <input
                type="text"
                placeholder="Đường/Số nhà"
                value={formValues.street || ""}
                onChange={(e) => setFormValues({ ...formValues, street: e.target.value })}
              />
              <input
                type="text"
                placeholder="Tỉnh/Thành phố"
                value={formValues.city || ""}
                onChange={(e) => setFormValues({ ...formValues, city: e.target.value })}
              />
              <input
                type="text"
                placeholder="Quận/Huyện"
                value={formValues.district || ""}
                onChange={(e) => setFormValues({ ...formValues, district: e.target.value })}
              />
              <input
                type="text"
                placeholder="Phường/Xã"
                value={formValues.ward || ""}
                onChange={(e) => setFormValues({ ...formValues, ward: e.target.value })}
              />
              <input
                type="text"
                placeholder="Mã bưu điện"
                value={formValues.zipCode || ""}
                onChange={(e) => setFormValues({ ...formValues, zipCode: e.target.value })}
              />

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.updateBtn}
                  onClick={handleModalOk}
                >
                  Cập nhật
                </button>
                <button 
                  type="button" 
                  className={styles.cancelBtn}
                  onClick={handleModalCancel}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}