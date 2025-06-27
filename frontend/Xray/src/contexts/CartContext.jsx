import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import {getCartItems, addToCart as addToCartService, updateCartItemQuantity as updateCartService, removeCartItem as removeCartService, clearCart as clearCartService } from '../services/cartService';
import { UserContext } from './UserContext';
import { toast } from 'react-toastify';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useContext(UserContext);

  const refreshCart = useCallback(async () => {
    try {
      if (!isAuthenticated) {
        console.log('User not authenticated, skipping cart fetch'); // Debug
        return;
      }
      const items = await getCartItems();
      const validItems = items.filter(
        (item) =>
          item &&
          item._id &&
          typeof item.price === 'number' &&
          item.name &&
          item.quantity > 0
      );
      setCartItems(validItems);
      setError(null);
    } catch (error) {
      console.error('Error fetching cart items:', error.response?.data || error.message);
      setError(error.message || 'Không thể tải giỏ hàng');
      toast.error(error.message || 'Không thể tải giỏ hàng');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product, quantity) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
    }
    try {
      await addToCartService({ productId: product._id, quantity });
      await refreshCart(); // Refresh cart to sync with server
      setError(null);
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError(error.message || 'Không thể thêm sản phẩm vào giỏ hàng');
      toast.error(error.message || 'Không thể thêm sản phẩm vào giỏ hàng');
      throw error;
    }
  };

  const updateCartItemQuantity = async (productId, quantity) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để cập nhật giỏ hàng');
      toast.error('Vui lòng đăng nhập để cập nhật giỏ hàng');
      throw new Error('Vui lòng đăng nhập để cập nhật giỏ hàng');
    }
    try {
      await updateCartService(productId, quantity);
      await refreshCart(); // Refresh cart to sync with server
      setError(null);
      toast.success('Đã cập nhật số lượng sản phẩm');
    } catch (error) {
      console.error('Error updating cart item:', error);
      setError(error.message || 'Không thể cập nhật số lượng sản phẩm');
      toast.error(error.message || 'Không thể cập nhật số lượng sản phẩm');
      throw error;
    }
  };

  const removeCartItem = async (productId) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
      toast.error('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
      throw new Error('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
    }
    try {
      await removeCartService(productId);
      await refreshCart(); // Refresh cart to sync with server
      setError(null);
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
      console.error('Error removing cart item:', error);
      setError(error.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
      toast.error(error.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
      throw error;
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để xóa giỏ hàng');
      toast.error('Vui lòng đăng nhập để xóa giỏ hàng');
      throw new Error('Vui lòng đăng nhập để xóa giỏ hàng');
    }
    try {
      await clearCartService();
      await refreshCart(); // Refresh cart to sync with server
      setError(null);
      toast.success('Đã xóa toàn bộ giỏ hàng');
    } catch (error) {
      console.error('Error clearing cart:', error);
      setError(error.message || 'Không thể xóa giỏ hàng');
      toast.error(error.message || 'Không thể xóa giỏ hàng');
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,
        refreshCart,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};