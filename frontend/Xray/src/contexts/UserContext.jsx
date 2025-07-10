import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, logoutUser, getProfile, registerUser, updateProfile } from '../services/userService';
import { getDashboardStats } from '../services/adminService';
import { setLogoutCallback, setLoggingOut } from '../api/api';
import { toast } from 'react-toastify';

export const UserContext = createContext();

function logServiceError(context, err, url, method, extra = {}) {
  console.error(`${context}:`, {
    message: err.message,
    status: err.response?.status,
    data: err.response?.data,
    url,
    method,
    ...extra
  });
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const handleLogout = React.useCallback(async () => {
    try {
      try {
        await logoutUser();
      } catch (err) {
        // Nếu lỗi là 401 (đã mất phiên), chỉ clear state, không báo lỗi
        if (err.response?.status !== 401) {
          toast.error(err.message || 'Đăng xuất thất bại');
        }
      }
      setUser(null);
      setIsAuthenticated(false);
      setLoggingOut(false);
      navigate('/login');
    } catch {
      // Trường hợp lỗi khác, vẫn đảm bảo clear state và chuyển hướng
      setUser(null);
      setIsAuthenticated(false);
      setLoggingOut(false);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await getProfile();
        if (response && response.user) {
          setUser({
            ...response.user,
            id: response.user._id || response.user.id, 
            name: response.user.name || '',
            stats: response.user.stats || { totalOrders: 0, totalSpent: 0 }
          });
          setIsAuthenticated(true);
          window.__USER_LOGGED_IN__ = true;
        } else {
          setIsAuthenticated(false);
          setUser(null);
          window.__USER_LOGGED_IN__ = false;
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
          setUser(null);
        } else if (err.response?.status === 404) {
          toast.warn('Không tìm thấy thông tin người dùng. Vui lòng kiểm tra tài khoản.');
        } else {
          toast.error(err.message || 'Không thể tải thông tin người dùng');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    setLogoutCallback(() => {
      handleLogout();
    });
  }, [navigate, handleLogout]);

  const login = async (email, password, rememberMe = false) => {
    try {
      const { user } = await loginUser(email, password, rememberMe);
      setUser(user);
      setIsAuthenticated(true);
      navigate(user.role === 'admin' ? '/admin' : '/');
      return user;
    } catch (err) {
      logServiceError('UserContext - login', err, '/users/login', 'POST', { email });
      toast.error(err.message || 'Đăng nhập thất bại');
      throw err;
    }
  };

  const register = async ({ email, password, name, phone, address }) => {
    try {
      const response = await registerUser({ email, password, name, phone, address });
      return response;
    } catch (err) {
      logServiceError('UserContext - register', err, '/users/register', 'POST', { email });
      toast.error(err.message || 'Đăng ký thất bại');
      throw err;
    }
  };

  const updateUser = async (profileData) => {
    try {
      const response = await updateProfile(profileData);
      setUser(response.user);
      setIsAuthenticated(true);
      return response.user;
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        await handleLogout();
      } else if (err.response?.status === 404) {
        toast.warn('Không tìm thấy thông tin người dùng. Vui lòng thử lại.');
      } else {
        logServiceError('UserContext - updateUser', err, '/users/profile', 'PUT', { profileData });
        toast.error(err.message || 'Không thể cập nhật thông tin người dùng');
      }
      throw err;
    }
  };

  const getAdminStats = async () => {
    try {
      if (!user || user.role !== 'admin') {
        throw new Error('Chỉ admin mới có quyền truy cập thống kê');
      }
      const stats = await getDashboardStats();
      return stats;
    } catch (err) {
      if (err.response?.status === 403) {
        throw new Error('Chỉ admin mới có quyền truy cập thống kê');
      } else if (err.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        await handleLogout();
      } else {
        logServiceError('UserContext - getAdminStats', err, '/admin/stats', 'GET');
        toast.error(err.message || 'Không thể tải thống kê dashboard');
      }
      throw err;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        isLoading,
        login,
        logout: handleLogout,
        updateUser,
        register,
        getAdminStats,
        error,
        setError
      }}
    >
      {children}
    </UserContext.Provider>
  );
};