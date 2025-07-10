import api from '../api/api';
import { toast } from 'react-toastify';

export const getDashboardStats = async () => {
  try {
    console.log('adminService - Fetching dashboard stats');
    const response = await api.get('/api/admin/stats', { withCredentials: true });
    if (!response.data) {
      throw new Error('Không tìm thấy dữ liệu thống kê');
    }
    console.log('adminService - Dashboard stats fetched:', response.data);
    return response.data;
  } catch (err) {
    console.error('adminService - Error fetching dashboard stats:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    if (err.response?.status === 403) {
      throw new Error('Chỉ admin mới có quyền truy cập thống kê');
    }
    if (err.response?.status === 401) {
      toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
    toast.error(err.response?.data?.message || 'Lỗi khi lấy thống kê dashboard');
    throw new Error(err.response?.data?.message || 'Lỗi khi lấy thống kê dashboard');
  }
};