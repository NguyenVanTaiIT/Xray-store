import React, { useState, useEffect, useContext } from 'react';
import styles from './Home.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import HeroSection from '../HeroSection/HeroSection';
import { useNavigate } from 'react-router-dom';
import Intro from '../Introduction/Intro';
import BrandSlideshow from "../../components/BrandSlideshow.jsx";
import { fetchProducts } from '../../services/productService.js';
import { CartContext } from '../../contexts/CartContext';
import { addToCartService as addToCart } from '../../services/cartService';
import { toast } from 'react-toastify';

export default function Home() {
  const navigate = useNavigate();
  const { refreshCart } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchFeaturedProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      console.log('Home - Fetched products:', data);
      setProducts(Array.isArray(data.products) ? data.products.slice(0, 4) : []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Không thể tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };
  fetchFeaturedProducts();
}, []);

  const handleProductClick = (productId) => {
    navigate(`/product-detail/${productId}`);
  };

  const handleAddToCart = async (product, event) => {
    event.stopPropagation();
    try {
      const productId = String(product._id).trim();
      console.log('Home - Adding product to cart:', {
        productId,
        name: product.name,
        price: product.price,
        quantity: 1,
        originalId: product._id,
        idType: typeof product._id
      });
      if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        throw new Error('Invalid product ID format');
      }
      await addToCart({ productId, quantity: 1 });
      console.log('Home - Successfully added to cart:', productId);
      await refreshCart();
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (error) {
      console.error('Home - Add to cart error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error(error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className={styles.star} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className={styles.star} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77V2z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className={`${styles.star} ${styles.emptyStar}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    }

    return stars;
  };

  if (loading) {
    return (
      <div className={styles.homeContainer}>
        <Header />
        <div className={styles.loadingState}>Đang tải sản phẩm...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.homeContainer}>
        <Header />
        <div className={styles.errorState}>{error}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      <Header />
      <Intro />
      <HeroSection />
      <BrandSlideshow />
      <section className={styles.products}>
        <h2 className={styles.sectionTitle}>Sản phẩm nổi bật</h2>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <div
              className={styles.card}
              key={product._id}
              onClick={() => handleProductClick(product._id)}
            >
              <div className={styles.cardInner}>
                <div className={styles.imageContainer}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className={styles.image}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%23333"/%3E%3Ctext x="100" y="75" text-anchor="middle" fill="%23666" font-family="Arial" font-size="14"%3ELaptop Image%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <div className={styles.imageOverlay}>
                    <span className={styles.viewDetails}>Xem chi tiết</span>
                  </div>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.topContent}>
                    <h3 className={styles.name}>{product.name}</h3>
                    <div className={styles.rating}>
                      <div className={styles.stars}>
                        {renderStars(product.rating || 0)}
                      </div>
                      <span className={styles.ratingText}>
                        {product.rating || 0} ({product.reviews || 0} đánh giá)
                      </span>
                    </div>
                    <div className={styles.specs}>
                      {product.specs.map((spec, specIdx) => (
                        <span key={specIdx} className={styles.specTag}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.bottomContent}>
                    <div className={styles.priceSection}>
                      <div className={styles.priceGroup}>
                        <span className={styles.price}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button
                        className={styles.cartBtnCard}
                        aria-label="Thêm vào giỏ hàng"
                        onClick={(e) => handleAddToCart(product, e)}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span>Thêm vào giỏ</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}