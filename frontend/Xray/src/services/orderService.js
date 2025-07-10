import api from '../api/api';

// Thống nhất cách ghi log lỗi chi tiết cho tất cả các hàm:
const logOrderServiceError = (context, err) => {
  console.error(`orderService - ${context}:`, {
    message: err.message,
    status: err.response?.status,
    data: err.response?.data
  });
};

export const createOrder = async (orderData) => {
  if (
    !orderData ||
    !Array.isArray(orderData.items) || orderData.items.length === 0 ||
    typeof orderData.totalPrice !== 'number' ||
    !orderData.shippingAddress ||
    !orderData.paymentMethod
  ) {
    const error = new Error('Thiếu thông tin đơn hàng: Vui lòng kiểm tra sản phẩm, địa chỉ giao hàng, phương thức thanh toán và tổng tiền.');
    error.status = 400;
    throw error;
  }

  try {
    console.log('orderService - Creating order with data:', orderData);
    const response = await api.post('/api/orders', orderData, { withCredentials: true });
    console.log('orderService - Order created:', response.data);
    return response.data;
  } catch (err) {
    logOrderServiceError('Error creating order', err);
    const error = new Error(err.response?.data?.message || 'Không thể tạo đơn hàng');
    error.status = err.response?.status || 500;
    error.data = err.response?.data || {};
    throw error;
  }
};

export const getOrders = async (page = 1, limit = 10) => {
  try {
    const res = await api.get(`/api/orders?page=${page}&limit=${limit}`, { withCredentials: true });
    console.log('Orders fetched:', res.data);
    return res.data;
  } catch (err) {
    logOrderServiceError('Error fetching orders', err);
    throw err;
  }
};

export const getUserOrders = async (userId, page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/orders/user/${userId}?page=${page}&limit=${limit}`, { withCredentials: true });
    return response.data;
  } catch (err) {
    logOrderServiceError('Error fetching user orders', err);
    throw new Error(err.response?.data?.message || 'Lỗi khi lấy danh sách đơn hàng');
  }
};

export const getMyOrders = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/api/orders/my-orders?page=${page}&limit=${limit}`, { withCredentials: true });
    return response.data;
  } catch (err) {
    logOrderServiceError('Error fetching user orders', err);
    throw new Error(err.response?.data?.message || 'Lỗi khi lấy danh sách đơn hàng');
  }
};

export const getOrderById = async (orderId) => {
  try {
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      throw new Error('ID đơn hàng không hợp lệ');
    }
    console.log('Sending request for orderId:', orderId);
    const res = await api.get(`/api/orders/${orderId}`, { withCredentials: true });
    console.log('Order fetched:', res.data);
    return res.data;
  } catch (err) {
    logOrderServiceError('Error fetching order by ID', err);
    throw err;
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      throw new Error('ID đơn hàng không hợp lệ');
    }
    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }
    // Sửa endpoint admin -> thường
    const res = await api.put(`/api/orders/${orderId}`, { status }, {
      withCredentials: true
    });
    console.log('Order status updated:', res.data);
    return res.data.order;
  } catch (err) {
    logOrderServiceError('Error updating order status', err);
    throw err;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    if (!orderId || !/^[0-9a-fA-F]{24}$/.test(orderId)) {
      throw new Error('ID đơn hàng không hợp lệ');
    }
    // Sửa endpoint admin -> thường
    const res = await api.delete(`/api/orders/${orderId}`, {
      withCredentials: true
    });
    console.log('Order deleted:', orderId);
    return res.data;
  } catch (err) {
    logOrderServiceError('Error deleting order', err);
    throw err;
  }
};