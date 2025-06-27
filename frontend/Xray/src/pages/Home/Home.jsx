import React, { useState, useEffect } from 'react';
import styles from './Home.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import HeroSection from '../HeroSection/HeroSection';
import { useNavigate } from 'react-router-dom';
import Intro from '../Introduction/Intro';
import BrandSlideshow from "../../components/BrandSlideshow.jsx";
import { fetchProducts } from '../../services/productService.js';


export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);

  useEffect(() => {
  const fetchFeaturedProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data.slice(0, 4));
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };
  fetchFeaturedProducts();
}, []);

  const handleProductClick = (product) => {
    navigate(`/product-detail/${product._id}`);
  };

  return (
    <div className={styles.homeContainer}>
      <Header />
      <Intro />
      <HeroSection />
      <BrandSlideshow />
      <section className={styles.products}>
        <h2 className={styles.sectionTitle}>Sản phẩm nổi bật</h2>
        <div className={styles.productGrid}>
          {products.map((laptop, idx) => (
            <div
              className={styles.card}
              key={laptop._id || idx}
              onClick={() => handleProductClick(laptop)}
            >
              <div className={styles.cardInner}>
                <div className={styles.imageContainer}>
                  <img
                    src={laptop.image}
                    alt={laptop.name}
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
                    <h3 className={styles.name}>{laptop.name}</h3>
                    <div className={styles.specs}>
                      {laptop.specs.map((spec, specIdx) => (
                        <span key={specIdx} className={styles.specTag}>
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.bottomContent}>
                    <div className={styles.priceSection}>
                      <span className={styles.price}>{laptop.price.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <div className={styles.buttonGroup}>
                      <button className={styles.buyBtn} aria-label="Mua ngay">
                        <span>Mua ngay</span>
                        <svg
                          className={styles.btnIcon}
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button
                        className={styles.cartBtnCard}
                        aria-label="Thêm vào giỏ hàng"
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