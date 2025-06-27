import React, { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import styles from './Register.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserContext } from '../../contexts/UserContext';

export default function Register() {
  const { isAuthenticated, register: registerUser, error } = useContext(UserContext);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      agreeTerms: false,
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const watchPassword = watch('password');

  const onSubmit = async (data) => {
    console.log('Form data submitted:', data);
    setIsSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.fullName,
        phone: data.phone,
      });
      toast.success('Đăng ký thành công!');
      navigate('/login');
    } catch (err) {
      console.error('Error registering:', err);
      const errorMessage = err.message === 'Email hoặc số điện thoại đã tồn tại'
        ? 'Email hoặc số điện thoại đã được sử dụng. Vui lòng thử lại với thông tin khác.'
        : err.message || 'Lỗi khi đăng ký';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.registerWrapper}>
          <div className={styles.registerCard}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Đăng ký tài khoản</h1>
              <p className={styles.subtitle}>
                Tạo tài khoản để trải nghiệm mua sắm tốt nhất
              </p>
            </div>

            <form className={styles.registerForm} onSubmit={handleSubmit(onSubmit)}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fullName">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  id="fullName"
                  {...register('fullName', {
                    required: 'Vui lòng nhập họ và tên',
                    minLength: {
                      value: 2,
                      message: 'Họ tên phải có ít nhất 2 ký tự',
                    },
                    pattern: {
                      value: /^[a-zA-ZÀ-ỹ\s]+$/,
                      message: 'Họ tên chỉ được chứa chữ cái và khoảng trắng',
                    },
                  })}
                  className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
                  placeholder="Nhập họ và tên của bạn"
                />
                {errors.fullName && (
                  <span className={styles.errorMessage}>{errors.fullName.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', {
                    required: 'Vui lòng nhập email',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ',
                    },
                  })}
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <span className={styles.errorMessage}>{errors.email.message}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="phone">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  id="phone"
                  {...register('phone', {
                    required: 'Vui lòng nhập số điện thoại',
                    pattern: {
                      value: /^0\d{9}$/,
                      message: 'Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng 0',
                    },
                  })}
                  className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
                  placeholder="0123456789"
                />
                {errors.phone && (
                  <span className={styles.errorMessage}>{errors.phone.message}</span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="password">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    id="password"
                    {...register('password', {
                      required: 'Vui lòng nhập mật khẩu',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
                      },
                    })}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    placeholder="Nhập mật khẩu"
                  />
                  {errors.password && (
                    <span className={styles.errorMessage}>{errors.password.message}</span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label} htmlFor="confirmPassword">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    {...register('confirmPassword', {
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: (value) =>
                        value === watchPassword || 'Mật khẩu xác nhận không khớp',
                    })}
                    className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                    placeholder="Nhập lại mật khẩu"
                  />
                  {errors.confirmPassword && (
                    <span className={styles.errorMessage}>{errors.confirmPassword.message}</span>
                  )}
                </div>
              </div>

              <div className={styles.checkboxGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    {...register('agreeTerms', {
                      required: 'Vui lòng đồng ý với điều khoản sử dụng',
                    })}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>
                    Tôi đồng ý với{' '}
                    <a href="/terms" className={styles.link}>
                      Điều khoản sử dụng
                    </a>{' '}
                    và{' '}
                    <a href="/privacy" className={styles.link}>
                      Chính sách bảo mật
                    </a>
                  </span>
                </label>
                {errors.agreeTerms && (
                  <span className={styles.errorMessage}>{errors.agreeTerms.message}</span>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.submitBtn} ${isSubmitting ? styles.submitting : ''}`}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles.spinner}></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    Đăng ký
                    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className={styles.loginLink}>
              <p>
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className={styles.linkBtn}
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}