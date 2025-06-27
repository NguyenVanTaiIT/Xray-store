import React, { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import styles from './Login.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserContext } from '../../contexts/UserContext';

export default function Login() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const { isAuthenticated, login, error } = useContext(UserContext);

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

  // Thay thế onSubmit
  const onSubmit = async (data) => {
  console.log('Login data submitted:', data); // Thêm log để debug
  setIsSubmitting(true);
  try {
    await login(data.email, data.password);
    toast.success('Đăng nhập thành công!');
    navigate('/');
  } catch (err) {
    console.error('Login error:', err.response?.data || err.message); // Log lỗi chi tiết
  } finally {
    setIsSubmitting(false);
  }
};

  const handleForgotPassword = () => {
    console.log('Forgot password clicked');
    // navigate('/forgot-password');
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    // Implement social login logic
  };

  return (
    <div className={styles.loginContainer}>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.loginWrapper}>
          <div className={styles.loginCard}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Đăng nhập</h1>
              <p className={styles.subtitle}>
                Chào mừng bạn trở lại! Vui lòng đăng nhập vào tài khoản của bạn
              </p>
            </div>
            <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
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
                  <span className={styles.errorMessage}>
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">
                  Mật khẩu *
                </label>
                <div className={styles.passwordContainer}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    {...register('password', {
                      required: 'Vui lòng nhập mật khẩu',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự',
                      },
                    })}
                    className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                    placeholder="Nhập mật khẩu"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errorMessage}>
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className={styles.formOptions}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className={styles.checkbox}
                  />
                  <span className={styles.checkboxText}>Ghi nhớ đăng nhập</span>
                </label>

                <button
                  type="button"
                  className={styles.forgotPassword}
                  onClick={handleForgotPassword}
                >
                  Quên mật khẩu?
                </button>
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
                    Đăng nhập
                    <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H3"
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

            <div className={styles.socialLogin}>
              <div className={styles.divider}>
                <span>Hoặc đăng nhập với</span>
              </div>
              <div className={styles.socialButtons}>
                <button
                  className={styles.socialBtn}
                  onClick={() => handleSocialLogin('google')}
                >
                  <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  className={styles.socialBtn}
                  onClick={() => handleSocialLogin('facebook')}
                >
                  <svg viewBox="0 0 24 24" className={styles.socialIcon}>
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            <div className={styles.registerLink}>
              <p>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className={styles.linkBtn}
                >
                  Đăng ký ngay
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