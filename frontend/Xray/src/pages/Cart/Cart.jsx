import React, { useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../contexts/CartContext';
import { UserContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import styles from './Cart.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

export default function Cart() {
  const navigate = useNavigate();
  const { cartItems, updateCartItemQuantity, removeCartItem, clearCart, error, refreshCart } = useContext(CartContext);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useContext(UserContext);

  // Handle errors from CartContext
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Load cart and check authentication
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (!isAuthenticated) {
          toast.error('Vui lòng đăng nhập để xem giỏ hàng');
          navigate('/login');
          return;
        }
        await refreshCart();
      } catch (err) {
        if (err.response?.status === 401) {
          toast.error('Vui lòng đăng nhập để xem giỏ hàng');
          navigate('/login');
        } else {
          toast.error(err.response?.data?.message || 'Không thể tải giỏ hàng');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, [navigate, refreshCart]);

  // Handle increase/decrease quantity
  const updateQuantity = async (productId, change) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để cập nhật giỏ hàng');
      navigate('/login');
      return;
    }
    const currentItem = cartItems.find((item) => String(item.productId) === String(productId));
    if (!currentItem) {
      console.error('Item not found in cart for productId:', productId, 'Cart items:', cartItems);
      toast.error('Sản phẩm không tồn tại trong giỏ hàng');
      return;
    }
    const newQuantity = Math.max(1, currentItem.quantity + change);
    try {
      const safeProductId = String(productId);
      await updateCartItemQuantity(safeProductId, newQuantity);
    } catch (err) {
      console.error('Update quantity error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Không thể cập nhật số lượng sản phẩm');
    }
  };

  const removeItem = async (productId) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng');
      navigate('/login');
      return;
    }
    try {
      console.log('Removing item with productId:', String(productId)); // Kiểm tra productId
      await removeCartItem(String(productId)); // Ép thành chuỗi
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (err) {
      console.error('Remove item error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Không thể xóa sản phẩm khỏi giỏ hàng');
    }
  };

  const clearCartHandler = async () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để xóa giỏ hàng');
      navigate('/login');
      return;
    }
    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await clearCart();
    } catch (err) {
      console.error('Clear cart error:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Không thể xóa giỏ hàng');
    }
  };

  // Calculate subtotal
  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + (typeof item.price === 'number' ? item.price * item.quantity : 0),
      0
    );
  }, [cartItems]);

  const handleProductClick = (product) => {
    navigate(`/product-detail/${product._id}`);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      navigate('/login');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống, vui lòng thêm sản phẩm');
      return;
    }
    if (cartItems.some((item) => !item.inStock)) {
      toast.error('Không thể thanh toán vì có sản phẩm hết hàng');
      return;
    }
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  if (isLoading) {
    return (
      <div className={styles.cartContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Đang tải giỏ hàng...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <Header />
      <main className={styles.cartMain}>
        <div className={styles.cartContent}>
          <div className={styles.cartHeader}>
            <h1 className={styles.pageTitle}>Giỏ hàng của bạn</h1>
            <div className={styles.cartStats}>
              <span className={styles.itemCount}>{cartItems.length} sản phẩm</span>
              {cartItems.length > 0 && (
                <button className={styles.clearBtn} onClick={clearCartHandler}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Xóa tất cả
                </button>
              )}
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyCartIcon}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h2>Giỏ hàng trống</h2>
              <p>Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
              <button className={styles.continueBtn} onClick={handleContinueShopping}>
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className={styles.cartLayout}>
              <div className={styles.cartItems}>
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className={`${styles.cartItem} ${!item.inStock || item.stockQuantity <= 0 ? styles.outOfStock : ''}`}
                  >
                    <div className={styles.itemImage} onClick={() => handleProductClick(item)}>
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.target.src =
                            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="150" height="120" viewBox="0 0 150 120"%3E%3Crect width="150" height="120" fill="%23333"/%3E%3Ctext x="75" y="60" text-anchor="middle" fill="%23666" font-family="Arial" font-size="12"%3ELaptop%3C/text%3E%3C/svg%3E';
                        }}
                      />
                      {!item.inStock && (
                        <div className={styles.outOfStockOverlay}>
                          <span>Hết hàng</span>
                        </div>
                      )}
                      {item.inStock && item.stockQuantity <= 0 && (
                        <div className={styles.outOfStockOverlay}>
                          <span>Hết hàng (Cập nhật kho)</span>
                        </div>
                      )}
                    </div>

                    <div className={styles.itemDetails}>
                      <div className={styles.itemInfo}>
                        <h3 className={styles.itemName} onClick={() => handleProductClick(item)}>
                          {item.name}
                        </h3>
                        <div className={styles.itemSpecs}>
                          {(item.specs || []).map((spec, index) => (
                            <span key={`${item._id}-spec-${index}`} className={styles.specTag}>
                              {spec}
                            </span>
                          ))}
                        </div>
                        {!item.inStock && (
                          <div className={styles.stockStatus}>
                            <span className={styles.outOfStockText}>Sản phẩm tạm hết hàng</span>
                          </div>
                        )}
                      </div>

                      <div className={styles.itemActions}>
                        <div className={styles.quantityControls}>
                          <button
                            className={styles.quantityBtn}
                            onClick={() => updateQuantity(String(item.productId), -1)}
                            disabled={item.quantity <= 1 || !item.inStock}
                            title={item.inStock ? (item.quantity <= 1 ? 'Số lượng tối thiểu là 1' : '') : 'Sản phẩm hết hàng'}
                          >
                            -
                          </button>
                          <span className={styles.quantity}>{item.quantity}</span> {/* Đảm bảo hiển thị quantity */}
                          <button
                            className={styles.quantityBtn}
                            onClick={() => updateQuantity(String(item.productId), 1)}
                            disabled={!item.inStock || item.stockQuantity <= item.quantity}
                          >
                            +
                          </button>
                        </div>

                        <div className={styles.itemPrice}>
                          <span className={styles.unitPrice}>
                            {typeof item.price === 'number'
                              ? (item.price * item.quantity).toLocaleString('vi-VN')
                              : 'N/A'}
                            ₫
                          </span>
                        </div>

                        <button className={styles.removeBtn} onClick={() => removeItem(String(item.productId))}>
                          <svg viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.cartSummary}>
                <div className={styles.summaryCard}>
                  <h3 className={styles.summaryTitle}>Tóm tắt đơn hàng</h3>
                  <div className={styles.summaryRow}>
                    <span>Tạm tính ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm)</span>
                    <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className={styles.summaryDivider}></div>
                  <div className={styles.summaryTotal}>
                    <span>Tổng cộng</span>
                    <span>{subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div className={styles.checkoutActions}>
                    <button
                      className={styles.checkoutBtn}
                      onClick={handleCheckout}
                      disabled={cartItems.some((item) => !item.inStock)}
                    >
                      <span>Thanh toán</span>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 12h14M12 5l7 7-7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button className={styles.continueBtnSecondary} onClick={handleContinueShopping}>
                      Tiếp tục mua sắm
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}