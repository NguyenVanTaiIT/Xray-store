// CartContext.jsx
import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { getCartItems, addToCartService as addToCartService, updateCartItemQuantity as updateCartService, removeCartItem as removeCartService, clearCart as clearCartService } from '../services/cartService';
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
        setCartItems([]);
        return;
      }
      const items = await getCartItems();
      const validItems = Array.isArray(items) ? items.map(item => ({
        ...item,
        productId: String(item.productId?._id || item.productId || ''),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 0,
        name: String(item.name || item.productId?.name || ''),
        image: item.image || '',
        inStock: item.inStock !== undefined ? item.inStock : false,
        stockQuantity: item.stockQuantity || 0
      })).filter(item => item && item.productId && typeof item.name === 'string' && item.name !== '' && typeof item.price === 'number' && item.price > 0 && typeof item.quantity === 'number' && item.quantity > 0) : [];
      setCartItems(validItems);
      setError(null);
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể tải giỏ hàng');
      toast.error(error.response?.data?.message || 'Không thể tải giỏ hàng');
      setCartItems([]);
    }
  }, [isAuthenticated]);

  const addToCart = async (product, quantity) => {
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      throw new Error('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
    }
    try {
      await addToCartService({ productId: product._id, quantity }); 
      await refreshCart();
      setError(null);
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      setError(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
      toast.error(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
      throw error;
    }
  };

  useEffect(() => {
    refreshCart();
  }, [isAuthenticated, refreshCart]);

  const updateCartItemQuantity = async (productId, quantity) => {
    try {
      await updateCartService(productId, quantity);
      await refreshCart(); // Đảm bảo đồng bộ sau khi cập nhật
      toast.success('Đã cập nhật số lượng sản phẩm');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Không thể cập nhật số lượng sản phẩm';
      setError(message);
      toast.error(message);
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
      await removeCartService(String(productId)); 
      await refreshCart();
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Không thể xóa sản phẩm khỏi giỏ hàng';
      setError(message);
      toast.error(message);
      throw err;
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
      await refreshCart();
      setError(null);
    } catch (error) {
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