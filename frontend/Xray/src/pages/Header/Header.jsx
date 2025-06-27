import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "./Header.module.css";
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../../contexts/CartContext';
import { UserContext } from '../../contexts/UserContext'; // Thêm import
import { removeCartItem } from '../../services/cartService';
import { logoutUser } from '../../services/userService'; // Bỏ getProfile
import { toast } from 'react-toastify';

export default function Header() {
    const navigate = useNavigate();
    const { cartItems, refreshCart } = useContext(CartContext);
    const { isAuthenticated, user, logout } = useContext(UserContext); // Sử dụng UserContext

    // States
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showCartPreview, setShowCartPreview] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchHistory, setSearchHistory] = useState(["iPhone 15", "MacBook Pro", "AirPods"]);

    // Refs
    const searchRef = useRef(null);
    const userMenuRef = useRef(null);
    const cartPreviewRef = useRef(null);

    // Mock search suggestions
    const searchSuggestions = [
        "iPhone 15 Pro Max", "MacBook Pro M3", "iPad Air", "Apple Watch",
        "AirPods Max", "iMac 24inch", "Mac Studio", "HomePod mini"
    ];

    const handleRemoveItem = async (id) => {
        try {
            await removeCartItem(id);
            await refreshCart();
            toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        } catch (err) {
            if (err.response?.status === 401) {
                navigate('/login');
                toast.error('Vui lòng đăng nhập để xóa sản phẩm');
            } else {
                toast.error('Lỗi khi xóa sản phẩm');
            }
        }
    };

    // Lấy lịch sử tìm kiếm từ localStorage
    useEffect(() => {
        const savedHistory = JSON.parse(localStorage.getItem('searchHistory')) || ["iPhone 15", "MacBook Pro", "AirPods"];
        setSearchHistory(savedHistory);
    }, []);

    // Kiểm tra giỏ hàng
    useEffect(() => {
        const loadCart = async () => {
            try {
                if (isAuthenticated) {
                    await refreshCart();
                }
            } catch (err) {
                if (err.response?.status === 401) {
                    navigate('/login');
                    toast.error('Vui lòng đăng nhập để xem giỏ hàng');
                }
            }
        };
        loadCart();
    }, [isAuthenticated, navigate, refreshCart]);

    // Scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (cartPreviewRef.current && !cartPreviewRef.current.contains(event.target)) {
                setShowCartPreview(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Mobile menu body class
    useEffect(() => {
        if (showMobileMenu) {
            document.body.classList.add('mobile-menu-open');
        } else {
            document.body.classList.remove('mobile-menu-open');
        }
        return () => {
            document.body.classList.remove('mobile-menu-open');
        };
    }, [showMobileMenu]);

    // Search functions
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            if (!searchHistory.includes(searchQuery)) {
                const newHistory = [searchQuery, ...searchHistory.slice(0, 4)];
                setSearchHistory(newHistory);
                localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            }
            console.log('Searching for:', searchQuery);
            setShowSearch(false);
            setSearchQuery("");
        }
    };

    const filteredSuggestions = searchSuggestions.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    // Cart calculations
    const cartItemCount = useMemo(() => cartItems.reduce((total, item) => total + item.quantity, 0), [cartItems]);
    const cartTotal = useMemo(() => cartItems.reduce((total, item) => total + (item.price * item.quantity), 0), [cartItems]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Hàm đăng xuất
    const handleLogout = async () => {
        try {
            await logout();
            setShowUserMenu(false);
            setShowMobileMenu(false);
            navigate('/login');
            toast.success('Đã đăng xuất');
        } catch (err) {
            console.error('Logout error:', err);
            toast.error('Lỗi khi đăng xuất');
        }
    };

    return (
        // Giữ nguyên phần JSX, chỉ thay thế isLoggedIn bằng isAuthenticated và userData bằng user
        <>
            <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
                <div className={styles.navContainer}>
                    {/* Logo */}
                    <div className={styles.navLogo} onClick={() => navigate('/')}>
                        <img
                            src="./1.png"
                            alt="Logo"
                            className={`${styles.headerLogo} ${scrolled ? styles.logoSmall : ''}`}
                        />
                    </div>

                    {/* Desktop Navigation */}
                    <div className={styles.navMenu}>
                        <button
                            className={styles.navLink}
                            onClick={() => navigate('/')}
                        >
                            Trang chủ
                        </button>
                        <button
                            className={styles.navLink}
                            onClick={() => navigate('/Products')}
                        >
                            Sản phẩm
                        </button>
                        <a href="#" className={styles.navLink}>Giới thiệu</a>
                        <a href="#" className={styles.navLink}>Liên hệ</a>
                    </div>

                    {/* Actions */}
                    <div className={styles.navActions}>
                        {/* Search */}
                        <div className={styles.searchContainer} ref={searchRef}>
                            <button
                                className={`${styles.searchBtn} ${showSearch ? styles.active : ''}`}
                                onClick={() => setShowSearch(!showSearch)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                            </button>

                            {showSearch && (
                                <div className={styles.searchExpanded}>
                                    <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm sản phẩm..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className={styles.searchInput}
                                            autoFocus
                                        />
                                        <button type="submit" className={styles.searchSubmit}>
                                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                <circle cx="11" cy="11" r="8" />
                                                <path d="m21 21-4.35-4.35" />
                                            </svg>
                                        </button>
                                    </form>

                                    <div className={styles.searchDropdown}>
                                        {searchQuery ? (
                                            <div className={styles.searchSection}>
                                                <h4>Gợi ý sản phẩm</h4>
                                                {filteredSuggestions.map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        className={styles.searchItem}
                                                        onClick={() => {
                                                            setSearchQuery(suggestion);
                                                            handleSearchSubmit({ preventDefault: () => { } });
                                                        }}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                            <circle cx="11" cy="11" r="8" />
                                                            <path d="m21 21-4.35-4.35" />
                                                        </svg>
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.searchSection}>
                                                <h4>Tìm kiếm gần đây</h4>
                                                {searchHistory.map((item) => (
                                                    <button
                                                        key={item}
                                                        className={styles.searchItem}
                                                        onClick={() => {
                                                            setSearchQuery(item);
                                                            handleSearchSubmit({ preventDefault: () => { } });
                                                        }}
                                                    >
                                                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                            <path d="M12 8v4l3 3" />
                                                            <circle cx="12" cy="12" r="10" />
                                                        </svg>
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className={styles.userContainer} ref={userMenuRef}>
                            <button
                                className={`${styles.userBtn} ${showUserMenu ? styles.active : ''}`}
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                {isAuthenticated && user ? (
                                    <img
                                        src={user.avatar || './default-avatar.jpg'}
                                        alt={user.name || 'User'}
                                        className={styles.userAvatar}
                                    />
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                )}
                            </button>

                            {showUserMenu && (
                                <div className={styles.userDropdown}>
                                    {isAuthenticated && user ? (
                                        <>
                                            <div className={styles.userInfo}>
                                                <img
                                                    src={user.avatar || './default-avatar.jpg'}
                                                    alt={user.name || 'User'}
                                                    className={styles.userAvatarLarge}
                                                />
                                                <div>
                                                    <h4>{user.name || 'Người dùng'}</h4>
                                                    <p>{user.email || 'email@example.com'}</p>
                                                </div>
                                            </div>
                                            <div className={styles.menuDivider}></div>
                                            <button
                                                className={styles.menuItem}
                                                onClick={() => navigate('/profile')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                Thông tin cá nhân
                                            </button>
                                            <a href="#" className={styles.menuItem}>
                                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                                </svg>
                                                Đơn hàng của tôi
                                            </a>
                                            <div className={styles.menuDivider}></div>
                                            <button
                                                className={styles.menuItem}
                                                onClick={handleLogout}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                    <polyline points="16,17 21,12 16,7" />
                                                    <line x1="21" y1="12" x2="9" y2="12" />
                                                </svg>
                                                Đăng xuất
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className={styles.menuItem}
                                                onClick={() => navigate('/login')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                                    <polyline points="10,17 15,12 10,7" />
                                                    <line x1="15" y1="12" x2="3" y2="12" />
                                                </svg>
                                                Đăng nhập
                                            </button>
                                            <button
                                                className={styles.menuItem}
                                                onClick={() => navigate('/register')}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <line x1="19" y1="8" x2="19" y2="14" />
                                                    <line x1="22" y1="11" x2="16" y2="11" />
                                                </svg>
                                                Đăng ký
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Shopping Cart */}
                        <div
                            className={styles.cartContainer}
                            ref={cartPreviewRef}
                            onMouseEnter={() => setShowCartPreview(true)}
                            onMouseLeave={() => setShowCartPreview(false)}
                        >
                            <button className={styles.cartBtn} onClick={() => navigate('/cart')}>
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                                    <line x1="3" y1="6" x2="21" y2="6" />
                                    <path d="M16 10a4 4 0 0 1-8 0" />
                                </svg>
                                {cartItemCount > 0 && (
                                    <span className={styles.cartBadge}>{cartItemCount}</span>
                                )}
                            </button>

                            {showCartPreview && cartItems.length > 0 && (
                                <div className={styles.cartPreview}>
                                    <div className={styles.cartHeader}>
                                        <h4>Giỏ hàng ({cartItemCount} sản phẩm)</h4>
                                    </div>
                                    <div className={styles.cartItems}>
                                        {cartItems.slice(0, 3).map(item => (
                                            <div key={item._id} className={styles.cartItem}>
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className={styles.cartItemImage}
                                                    onError={(e) => {
                                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Crect width="50" height="50" fill="%23333"/%3E%3Ctext x="25" y="25" text-anchor="middle" fill="%23666" font-family="Arial" font-size="8"%3EImage%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                                <div className={styles.cartItemInfo}>
                                                    <h5>{item.name}</h5>
                                                    <p>{formatPrice(item.price)} x {item.quantity}</p>
                                                </div>
                                                <button className={styles.cartItemRemove} onClick={() => handleRemoveItem(item._id)}>×</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.cartFooter}>
                                        <div className={styles.cartTotal}>
                                            <strong>Tổng: {formatPrice(cartTotal)}</strong>
                                        </div>
                                        <button
                                            className={styles.viewCartBtn}
                                            onClick={() => navigate('/cart')}
                                        >
                                            Xem giỏ hàng
                                        </button>
                                        <button
                                            className={styles.checkoutBtn}
                                            onClick={() => navigate('/checkout')}
                                        >
                                            Thanh toán
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            className={styles.mobileMenuBtn}
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                        >
                            <div className={`${styles.hamburger} ${showMobileMenu ? styles.active : ''}`}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <>
                    <div
                        className={styles.mobileMenuOverlay}
                        onClick={() => setShowMobileMenu(false)}
                    ></div>

                    <div className={styles.mobileMenu}>
                        <div className={styles.mobileMenuContent}>
                            <div className={styles.mobileMenuHeader}>
                                {isAuthenticated && user ? (
                                    <div className={styles.mobileUserInfo}>
                                        <img
                                            src={user.avatar || './default-avatar.jpg'}
                                            alt={user.name || 'User'}
                                        />
                                        <div>
                                            <h4>{user.name || 'Người dùng'}</h4>
                                            <p>{user.email || 'email@example.com'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.mobileAuth}>
                                        <button onClick={() => navigate('/login')}>Đăng nhập</button>
                                        <button onClick={() => navigate('/register')}>Đăng ký</button>
                                    </div>
                                )}
                            </div>
                            <nav className={styles.mobileNav}>
                                <button
                                    className={styles.mobileNavLink}
                                    onClick={() => {
                                        navigate('/');
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    Trang chủ
                                </button>
                                <button
                                    className={styles.mobileNavLink}
                                    onClick={() => {
                                        navigate('/Products');
                                        setShowMobileMenu(false);
                                    }}
                                >
                                    Sản phẩm
                                </button>
                                <a href="#" className={styles.mobileNavLink}>Giới thiệu</a>
                                <a href="#" className={styles.mobileNavLink}>Liên hệ</a>
                            </nav>
                            {isAuthenticated && user && (
                                <div className={styles.mobileUserActions}>
                                    <button
                                        className={styles.mobileActionLink}
                                        onClick={() => {
                                            navigate('/profile');
                                            setShowMobileMenu(false);
                                        }}
                                    >
                                        Thông tin cá nhân
                                    </button>
                                    <a href="#" className={styles.mobileActionLink}>Đơn hàng của tôi</a>
                                    <button
                                        className={styles.mobileActionLink}
                                        onClick={handleLogout}
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Background Elements */}
            <div className={styles.bgElements}>
                <div className={styles.circle1}></div>
                <div className={styles.circle2}></div>
                <div className={styles.circle3}></div>
            </div>

            {showMobileMenu && (
                <div
                    className={styles.mobileMenuOverlay}
                    onClick={() => setShowMobileMenu(false)}
                ></div>
            )}
        </>
    );
}