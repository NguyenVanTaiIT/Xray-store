import api from '../api/api';

export const getCartItems = async () => {
  try {
    const response = await api.get('/api/cart');
    const items = response.data.items || [];
    return items;
  } catch (error) {
    console.error('cartService - Error fetching cart:', error);
    throw error;
  }
};

export const addToCartService = async ({ productId, quantity }) => {
  try {
    const cleanedProductId = String(productId).trim();
    if (!/^[0-9a-fA-F]{24}$/.test(cleanedProductId)) {
      console.error('cartService - Invalid productId format:', productId);
      throw new Error('ID sản phẩm không hợp lệ');
    }
    console.log('cartService - Adding to cart:', { productId: cleanedProductId, quantity });
    const response = await api.post('/api/cart', { productId: cleanedProductId, quantity }, { withCredentials: true });
    console.log('cartService - Add to cart response:', response.data);
    return response.data.items || response.data;
  } catch (error) {
    console.error('cartService - Error adding to cart:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

export const updateCartItemQuantity = async (productId, quantity) => {
  try {
    const response = await api.put(`/api/cart/${String(productId)}`, { quantity });
    return response;
  } catch (err) {
    console.error('Error updating cart item quantity:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể cập nhật số lượng sản phẩm');
  }
};

export const removeCartItem = async (productId) => {
  try {
    const safeProductId = String(productId);
    console.log('Sending remove request for productId:', safeProductId);
    const response = await api.delete(`/api/cart/${safeProductId}`); // Đảm bảo đường dẫn /api/cart/
    console.log('Remove response:', response.data);
    return response;
  } catch (err) {
    console.error('Error removing cart item:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
  }
};

export const clearCart = async () => {
  try {
    const response = await api.delete('/api/cart');
    console.log('Clear cart response:', response.data);
    return response;
  } catch (err) {
    console.error('Error clearing cart:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể xóa giỏ hàng');
  }
};