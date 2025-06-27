import api from '../api/api';

export const getCartItems = async () => {
  try {
    const response = await api.get('/cart');
    return response.data;
  } catch (err) {
    console.error('Error fetching cart items:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể tải giỏ hàng');
  }
};

export const addToCart = async ({ productId, quantity }) => {
  try {
    const response = await api.post('/cart', { productId, quantity });
    return response;
  } catch (err) {
    console.error('Error adding to cart:', err.response?.data || err.message);
    if (err.response?.status === 404) {
      throw new Error('Không tìm thấy dịch vụ giỏ hàng. Vui lòng kiểm tra server.');
    }
    throw new Error(err.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
  }
};

export const updateCartItemQuantity = async (productId, quantity) => {
  try {
    const response = await api.put(`/cart/${productId}`, { quantity });
    return response;
  } catch (err) {
    console.error('Error updating cart item quantity:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể cập nhật số lượng sản phẩm');
  }
};

export const removeCartItem = async (productId) => {
  try {
    const response = await api.delete(`/cart/${productId}`);
    return response;
  } catch (err) {
    console.error('Error removing cart item:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
  }
};

export const clearCart = async () => {
  try {
    const response = await api.delete('/cart');
    return response;
  } catch (err) {
    console.error('Error clearing cart:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể xóa giỏ hàng');
  }
};