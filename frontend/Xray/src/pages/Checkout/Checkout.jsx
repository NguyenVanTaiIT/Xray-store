import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Checkout.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

export default function Checkout() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [orderStep, setOrderStep] = useState(1); // 1: Form, 2: Confirmation, 3: Success
  
  // Cart items (mock data)
  const [cartItems] = useState([
    {
      _id: '1',
      name: 'MacBook Pro 14" M3 Pro',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      price: 52990000,
      quantity: 1,
      specs: ['M3 Pro', '16GB RAM', '512GB SSD']
    },
    {
      _id: '2',
      name: 'Dell XPS 13 Plus',
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
      price: 35990000,
      quantity: 2,
      specs: ['Intel i7', '16GB RAM', '1TB SSD']
    }
  ]);

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
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

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 50000000 ? 0 : 500000;
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
    
    // Clear error when user starts typing
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
    
    if (!formData.firstName) newErrors.firstName = 'Họ là bắt buộc';
    if (!formData.lastName) newErrors.lastName = 'Tên là bắt buộc';
    if (!formData.phone) newErrors.phone = 'Số điện thoại là bắt buộc';
    else if (!/^[0-9]{10,11}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';
    
    if (!formData.address) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.city) newErrors.city = 'Tỉnh/Thành phố là bắt buộc';
    if (!formData.district) newErrors.district = 'Quận/Huyện là bắt buộc';
    if (!formData.ward) newErrors.ward = 'Phường/Xã là bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOrderStep(3);
    } catch (error) {
      console.error('Order submission failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className={styles.successTitle}>Đặt hàng thành công!</h1>
            <p className={styles.successMessage}>
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.
            </p>
            <div className={styles.orderInfo}>
              <p><strong>Mã đơn hàng:</strong> #DH{Date.now().toString().slice(-6)}</p>
              <p><strong>Tổng tiền:</strong> {formatPrice(calculateTotal())}</p>
              <p><strong>Phương thức thanh toán:</strong> {formData.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}</p>
            </div>
            <div className={styles.successActions}>
              <button className={styles.primaryBtn} onClick={handleContinueShopping}>
                Tiếp tục mua sắm
              </button>
              <button className={styles.secondaryBtn} onClick={() => navigate('/orders')}>
                Theo dõi đơn hàng
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
      
      <main className={styles.checkoutMain}>
        <div className={styles.checkoutContent}>
          <div className={styles.checkoutHeader}>
            <h1 className={styles.pageTitle}>Thanh toán</h1>
            <button className={styles.backBtn} onClick={handleBackToCart}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="Họ *"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${errors.firstName ? styles.inputError : ''}`}
                      />
                      {errors.firstName && <span className={styles.errorText}>{errors.firstName}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Tên *"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${errors.lastName ? styles.inputError : ''}`}
                      />
                      {errors.lastName && <span className={styles.errorText}>{errors.lastName}</span>}
                    </div>
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
                    <div className={styles.formGroup}>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${errors.city ? styles.inputError : ''}`}
                      >
                        <option value="">Chọn Tỉnh/Thành phố *</option>
                        <option value="ho-chi-minh">TP. Hồ Chí Minh</option>
                        <option value="ha-noi">Hà Nội</option>
                        <option value="da-nang">Đà Nẵng</option>
                        <option value="can-tho">Cần Thơ</option>
                      </select>
                      {errors.city && <span className={styles.errorText}>{errors.city}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${errors.district ? styles.inputError : ''}`}
                      >
                        <option value="">Chọn Quận/Huyện *</option>
                        <option value="quan-1">Quận 1</option>
                        <option value="quan-2">Quận 2</option>
                        <option value="quan-3">Quận 3</option>
                        <option value="quan-7">Quận 7</option>
                      </select>
                      {errors.district && <span className={styles.errorText}>{errors.district}</span>}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <select
                        name="ward"
                        value={formData.ward}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${errors.ward ? styles.inputError : ''}`}
                      >
                        <option value="">Chọn Phường/Xã *</option>
                        <option value="phuong-ben-nghe">Phường Bến Nghé</option>
                        <option value="phuong-ben-thanh">Phường Bến Thành</option>
                        <option value="phuong-nguyen-thai-binh">Phường Nguyễn Thái Bình</option>
                      </select>
                      {errors.ward && <span className={styles.errorText}>{errors.ward}</span>}
                    </div>
                    <div className={styles.formGroup}>
                      <input
                        type="text"
                        name="zipCode"
                        placeholder="Mã bưu điện"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className={styles.formInput}
                      />
                    </div>
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
                  {cartItems.map((item) => (
                    <div key={item._id} className={styles.orderItem}>
                      <div className={styles.itemImageSmall}>
                        <img src={item.image} alt={item.name} />
                        <span className={styles.itemQuantity}>{item.quantity}</span>
                      </div>
                      <div className={styles.itemDetailsSmall}>
                        <h4>{item.name}</h4>
                        <div className={styles.itemSpecsSmall}>
                          {item.specs.map((spec, index) => (
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
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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