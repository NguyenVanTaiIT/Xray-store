import api, { setLoggingOut } from '../api/api';
import { toast } from 'react-toastify';

export const loginUser = async (email, password, rememberMe = false) => {
  try {
    const response = await api.post('/api/users/login', { email, password, rememberMe }, { withCredentials: true });
    if (!response.data.user) {
      throw new Error('Phản hồi API không chứa user');
    }
    window.__USER_LOGGED_IN__ = true; 
    toast.success('Đăng nhập thành công');
    return { user: response.data.user };
  } catch (err) {
    console.error('Error logging in:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Đăng nhập thất bại');
  }
};

export const refreshToken = async () => {
  try {
    const response = await api.post('/api/users/refresh-token', {}, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error refreshing token:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể làm mới token');
  }
};

export const logoutUser = async () => {
  try {
    setLoggingOut(true); 
    const response = await api.post('/api/users/logout', {}, { withCredentials: true });
    window.__USER_LOGGED_IN__ = false; 
    return response.data;
  } catch (err) {
    window.__USER_LOGGED_IN__ = false; 
    console.error('Error logging out:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Đăng xuất thất bại');
  }
};

export const updateProfile = async (profileData) => {
  try {
    const payload = {
      name: profileData.name,
      phone: profileData.phone,
      address: profileData.address || { street: '', ward: '', district: '', city: '', zipCode: '' }
    };
    console.log('userService - Sending update profile data:', payload);
    const response = await api.put('/api/users/profile', payload, { withCredentials: true });
    toast.success('Cập nhật hồ sơ thành công');
    return response.data;
  } catch (err) {
    console.error('userService - Error updating profile:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data
    });
    if (err.response?.status === 401) {
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
    throw new Error(err.response?.data?.message || 'Lỗi khi cập nhật hồ sơ');
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/api/users/profile');
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection.');
    }
    
    if (!err.response) {
      throw new Error('Cannot connect to server. Please try again later.');
    }

    if (err.response.status === 401) {
      return null; // Chưa đăng nhập
    }

    throw new Error(err.response.data?.message || 'Failed to fetch profile');
  }
};

export const registerUser = async (userData) => {
  try {
    console.log('Register data sent:', userData);
    const response = await api.post('/api/users/register', userData, { withCredentials: true });
    console.log('Register response:', response.data);
    return response.data;
  } catch (err) {
    console.error('Error registering user:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: '/api/users/register',
      method: 'POST'
    });
    throw new Error(err.response?.data?.message || 'Đăng ký thất bại');
  }
};

export const fetchUsers = async () => {
  try {
    const response = await api.get('/api/users', { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error fetching users:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Lỗi khi lấy danh sách người dùng');
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/users/${userId}`, { withCredentials: true });
    toast.success('Xóa người dùng thành công');
    return response.data;
  } catch (err) {
    console.error('Error deleting user:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Lỗi khi xóa người dùng');
  }
};

export const updateUserByAdmin = async (userId, userData) => {
  try {
    const response = await api.put(`/api/users/${userId}`, userData, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error updating user by admin:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Lỗi khi cập nhật người dùng');
  }
};