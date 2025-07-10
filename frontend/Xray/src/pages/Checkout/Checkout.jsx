import React, { useState, useEffect } from 'react';
import { useNavigate} from 'react-router-dom';
import { createOrder } from '../../services/orderService';
import { getCartItems } from '../../services/cartService';
import { toast } from 'react-toastify'; // Thêm import
import styles from './Checkout.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useContext } from 'react';
import { CartContext } from '../../contexts/CartContext';
import { UserContext } from '../../contexts/UserContext';
import LocationSelector from '../../components/LocationSelector';


export default function Checkout() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [orderStep, setOrderStep] = useState(1);
  const { cartItems, clearCart } = useContext(CartContext);
  const { user, isAuthenticated } = useContext(UserContext);
  const [apiError, setApiError] = useState(null);
  const buyNowProduct = location.state?.buyNowProduct;

  const [formData, setFormData] = useState({
    email: '',
    fullName: '', // Gộp họ và tên thành fullName
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    zipCode: '',
    paymentMethod: 'cod',
    notes: ''
  });

  const [errors, setErrors] = useState({});
  const [orderTotal, setOrderTotal] = useState(null); // ✏️ Bước 1: Khai báo state

  const calculateSubtotal = () => {
  if (buyNowProduct) {
    return buyNowProduct.price * buyNowProduct.quantity;
  }
  return cartItems?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0;
};

const calculateShipping = () => {
  const subtotal = calculateSubtotal();
  return subtotal > 50000000 ? 0 : 500000; // Đảm bảo giá trị hợp lệ
};

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email không hợp lệ';

    if (!formData.fullName) newErrors.fullName = 'Họ và tên là bắt buộc';
    if (!formData.phone) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';

    if (!formData.address) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.city) newErrors.city = 'Tỉnh/Thành phố là bắt buộc';
    if (!formData.district) newErrors.district = 'Quận/Huyện là bắt buộc';
    if (!formData.ward) newErrors.ward = 'Phường/Xã là bắt buộc';

    // Thêm kiểm tra mã bưu điện
    if (formData.zipCode && !/^\d{5,6}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'Mã bưu điện phải là 5-6 chữ số';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt hàng');
      navigate('/login');
      return;
    }

    console.log('Checkout - User context:', { user, isAuthenticated });
    if (!user?.id) {
      toast.error('Không thể xác định thông tin người dùng');
      return;
    }

    let backendCartItems = [];
    try {
      backendCartItems = await getCartItems();
      console.log('Checkout - Backend cart items:', backendCartItems);
    } catch (error) {
      console.error('Checkout - Error fetching backend cart:', error);
      toast.error('Không thể tải giỏ hàng từ server');
      return;
    }

    if (!buyNowProduct && (!backendCartItems || backendCartItems.length === 0)) {
      toast.error('Giỏ hàng của bạn đang trống');
      navigate('/cart');
      return;
    }

    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ thông tin hợp lệ');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    // Sửa đoạn validItems như yêu cầu
    const validItems = (buyNowProduct
      ? [buyNowProduct]
      : backendCartItems
    ).map(item => ({
      productId: String(item.productId._id || item.productId),
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
      image: item.image,
      specs: Array.isArray(item.specs)
        ? item.specs.map(spec => String(spec).trim())
        : []
    })).filter(item =>
      item && item.productId &&
      item.name && typeof item.name === 'string' &&
      typeof item.price === 'number' && item.price > 0 &&
      typeof item.quantity === 'number' && item.quantity > 0 &&
      item.image && Array.isArray(item.specs)
    );

    if (validItems.length === 0) {
      toast.error('Không có sản phẩm hợp lệ trong giỏ hàng');
      navigate('/cart');
      return;
    }
    const subtotal = calculateSubtotal();
    const shippingFee = calculateShipping();
    try {
      const orderData = {
        userId: user.id,
        name: formData.fullName,
        items: validItems,
        totalPrice: subtotal,
        shippingAddress: {
          street: formData.address,
          district: formData.district,
          city: formData.city,
          zipCode: formData.zipCode,
          ward: formData.ward
        },
        paymentMethod: formData.paymentMethod,
        shippingFee
      };
      console.log('Checkout - Sending order data:', orderData);
      await createOrder(orderData);
      console.log('Checkout - Order created successfully');
      setOrderTotal(calculateTotal()); // ✏️ Bước 2: Lưu lại tổng tiền trước khi clearCart
      if (!buyNowProduct) {
        await clearCart();
      }
      setOrderStep(3);
    } catch (error) {
      console.error('Checkout - Error creating order:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      const errorMessage = error.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại.';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        fullName: user.name || '', // Gán fullName từ user.name
        phone: user.phone || '',
        address: user.address?.street || '',
        city: user.address?.city || '',
        district: user.address?.district || '',
        zipCode: user.address?.zipCode || '',
        ward: user.address?.ward || ''
      }));
    }
  }, [user]);

  const handleBackToCart = () => {
    navigate('/cart');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const formatPrice = (price) => {
    return price.toLocaleString('vi-VN') + '₫';
  };

  if (orderStep === 3) {
    return (
      <div className={styles.checkoutContainer}>
        <Header />
        <main className={styles.checkoutMain}>
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className={styles.successTitle}>Đặt hàng thành công!</h1>
            <p className={styles.successMessage}>
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
            <div className={styles.orderInfo}>
              <p><strong>Mã đơn hàng:</strong> #DH{Date.now().toString().slice(-6)}</p>
              <p><strong>Tổng tiền:</strong> {formatPrice(orderTotal || calculateTotal())}</p> {/* ✏️ Bước 3 */}
              <p><strong>Phương thức thanh toán:</strong> {formData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
            </div>
            <div className={styles.successActions}>
              <button className={styles.primaryBtn} onClick={handleContinueShopping}>
                Tiếp tục mua sắm
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/profile?tab=orders')}>
                Theo dõi đơn
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <Header />
      {apiError && <div className={styles.errorText}>{apiError}</div>}
      <main className={styles.checkoutMain}>
        <div className={styles.checkoutContent}>
          <div className={styles.checkoutHeader}>
            <h1 className={styles.pageTitle}>Thanh toán</h1>
            <button className={styles.backBtn} onClick={handleBackToCart}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Quay lại giỏ hàng
            </button>
          </div>

          <div className={styles.checkoutLayout}>
            <div className={styles.checkoutForm}>
              <form onSubmit={handleSubmit}>
                {/* Contact Information */}
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Thông tin liên hệ</h2>
                  <div className={styles.formGroup}>
                    <input
                      type="email"
                      name="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.email ? styles.inputError : ''}`}
                    />
                    {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                  </div>
                </div>

                {/* Shipping Information */}
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Thông tin giao hàng</h2>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Họ và tên *"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.fullName ? styles.inputError : ''}`}
                    />
                    {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Số điện thoại *"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.phone ? styles.inputError : ''}`}
                    />
                    {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      name="address"
                      placeholder="Địa chỉ cụ thể *"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.address ? styles.inputError : ''}`}
                    />
                    {errors.address && <span className={styles.errorText}>{errors.address}</span>}
                  </div>
                  <div className={styles.formRow}>
                    <LocationSelector
                      formData={formData}
                      setFormData={setFormData}
                      styles={styles}
                      errors={errors}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Phương thức thanh toán</h2>
                  <div className={styles.paymentOptions}>
                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleInputChange}
                      />
                      <div className={styles.paymentContent}>
                        <div className={styles.paymentIcon}>💰</div>
                        <div>
                          <strong>Thanh toán khi nhận hàng (COD)</strong>
                          <p>Thanh toán bằng tiền mặt khi nhận hàng</p>
                        </div>
                      </div>
                    </label>

                    <label className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="bank"
                        checked={formData.paymentMethod === 'bank'}
                        onChange={handleInputChange}
                      />
                      <div className={styles.paymentContent}>
                        <div className={styles.paymentIcon}>🏦</div>
                        <div>
                          <strong>Chuyển khoản ngân hàng</strong>
                          <p>Chuyển khoản trước khi giao hàng</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div className={styles.formSection}>
                  <h2 className={styles.sectionTitle}>Ghi chú đơn hàng</h2>
                  <div className={styles.formGroup}>
                    <textarea
                      name="notes"
                      placeholder="Ghi chú thêm về đơn hàng (không bắt buộc)"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className={styles.formTextarea}
                      rows="3"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Order Summary */}
            <div className={styles.orderSummary}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Đơn hàng của bạn</h3>

                <div className={styles.orderItems}>
                  {(buyNowProduct ? [buyNowProduct] : cartItems).map((item) => (
                    <div key={item.productId} className={styles.orderItem}>
                      <div className={styles.itemImageSmall}>
                        <img src={item.image} alt={item.name} />
                        <span className={styles.itemQuantity}>{item.quantity}</span>
                      </div>
                      <div className={styles.itemDetailsSmall}>
                        <h4>{item.name}</h4>
                        <div className={styles.itemSpecsSmall}>
                          {item.specs?.map((spec, index) => (
                            <span key={index}>{spec}</span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.itemPriceSmall}>
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.summaryCalculations}>
                  <div className={styles.summaryRow}>
                    <span>Tạm tính</span>
                    <span>{formatPrice(calculateSubtotal())}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Phí vận chuyển</span>
                    <span className={calculateShipping() === 0 ? styles.freeShipping : ''}>
                      {calculateShipping() === 0 ? 'Miễn phí' : formatPrice(calculateShipping())}
                    </span>
                  </div>
                  <div className={styles.summaryDivider}></div>
                  <div className={styles.summaryTotal}>
                    <span>Tổng cộng</span>
                    <span>{formatPrice(calculateTotal())}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={styles.placeOrderBtn}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className={styles.spinner}></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Đặt hàng
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}