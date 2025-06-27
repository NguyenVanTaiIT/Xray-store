import React, { useState, useEffect, useContext, useMemo } from 'react';
import styles from './Products.module.css';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../../services/productService';
import { CartContext } from '../../contexts/CartContext';
import { addToCart } from '../../services/cartService';
import { toast } from 'react-toastify';

const categories = [
  { id: 'all', name: 'Tất cả', count: 0 },
  { id: 'gaming', name: 'Gaming', count: 0 },
  { id: 'office', name: 'Văn phòng', count: 0 },
  { id: 'ultrabook', name: 'Ultrabook', count: 0 }
];

const brands = [
  { id: 'all', name: 'Tất cả thương hiệu' },
  { id: 'asus', name: 'ASUS' },
  { id: 'msi', name: 'MSI' },
  { id: 'acer', name: 'Acer' },
  { id: 'lenovo', name: 'Lenovo' }
];

const sortOptions = [
  { id: 'default', name: 'Mặc định' },
  { id: 'price-low', name: 'Giá thấp đến cao' },
  { id: 'price-high', name: 'Giá cao đến thấp' },
  { id: 'rating', name: 'Đánh giá cao nhất' },
];

export default function Products() {
  const navigate = useNavigate();
  const { refreshCart, setCartItems } = useContext(CartContext);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedSort, setSelectedSort] = useState('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
  const debounceFetch = setTimeout(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching with params:', { selectedCategory, selectedBrand, selectedSort, page, limit }); // Debug
      const data = await fetchProducts(selectedCategory, selectedBrand, selectedSort, page, limit);
      console.log('getProducts received:', JSON.stringify(data, null, 2));
      setProducts(Array.isArray(data.products) ? data.products : []);
      setTotalPages(Math.ceil((data.totalCount || 0) / limit));
      if (data.products.length === 0) {
        setError('Không tìm thấy sản phẩm phù hợp với bộ lọc.');
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err.response?.data || err.message);
      setError(err.message || 'Không thể tải sản phẩm. Vui lòng thử lại sau.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  return () => clearTimeout(debounceFetch);
}, [selectedCategory, selectedBrand, selectedSort, page]);

  const filteredProducts = useMemo(() => {
    let sortedProducts = Array.isArray(products) ? [...products] : [];
    switch (selectedSort) {
      case 'price-low':
        return sortedProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case 'price-high':
        return sortedProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case 'rating':
        return sortedProducts.sort((a, b) => b.rating - a.rating);
      default:
        return sortedProducts;
    }
  }, [products, selectedSort]);

  useEffect(() => {
    const counts = {};
    categories.forEach(cat => {
      if (cat.id !== 'all') {
        counts[cat.id] = products.filter(p => p.category.toLowerCase() === cat.id).length;
      }
    });
    counts.all = products.length;
    setCategoryCounts(counts);
  }, [products]);

  const handleProductClick = (productId) => {
    navigate(`/product-detail/${productId}`);
  };

  const handleAddToCart = async (e, productId) => {
  e.stopPropagation();
  try {
    const product = products.find(p => p._id === productId);
    if (!product) throw new Error('Sản phẩm không tồn tại');
    if (!product.inStock) throw new Error('Sản phẩm hiện đã hết hàng');

    await addToCart({ productId: product._id, quantity: 1 });
    await refreshCart();
    toast.success('Đã thêm sản phẩm vào giỏ hàng!');
  } catch (err) {
    if (err.response?.status === 401) {
      navigate('/login');
      toast.error('Vui lòng đăng nhập để thêm sản phẩm');
    } else if (err.response?.status === 404) {
      toast.error('Không tìm thấy dịch vụ giỏ hàng. Vui lòng liên hệ quản trị viên.');
    } else {
      console.error('Add to cart error:', err.response?.data || err.message);
      toast.error(err.message || 'Lỗi khi thêm sản phẩm vào giỏ hàng');
    }
  }
};

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className={styles.productsContainer}>
        <Header />
        <div className={styles.loadingState}>Đang tải sản phẩm...</div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsContainer}>
        <Header />
        <div className={styles.errorState}>{error}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.productsContainer}>
      <Header />
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Sản phẩm</h1>
          <p className={styles.heroSubtitle}>Khám phá bộ sưu tập laptop gaming và văn phòng</p>
          <div className={styles.breadcrumb}>
            <span onClick={() => navigate('/')} className={styles.breadcrumbLink}>Trang chủ</span>
            <svg className={styles.breadcrumbArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className={styles.breadcrumbContent}>Sản phẩm</span>
          </div>
        </div>
      </section>

      <section className={styles.mainContent}>
        <div className={styles.contentContainer}>
          <aside className={`${styles.sidebar} ${isFilterOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.filterHeader}>
              <h3>Bộ lọc</h3>
              <button className={styles.closeFilter} onClick={() => setIsFilterOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Danh mục</h4>
              <div className={styles.filterOptions}>
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`${styles.filterOption} ${selectedCategory === category.id ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <span>{category.name}</span>
                    <span className={styles.count}>({categoryCounts[category.id] || 0})</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Thương hiệu</h4>
              <div className={styles.filterOptions}>
                {brands.map(item => (
                  <button
                    key={item.id}
                    className={`${styles.filterOption} ${selectedBrand === item.id ? styles.active : ''}`}
                    onClick={() => setSelectedBrand(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className={styles.productsArea}>
            <div className={styles.toolbar}>
              <div className={styles.resultsInfo}>
                <span>Hiển thị {filteredProducts.length} sản phẩm</span>
              </div>
              <div className={styles.toolbarActions}>
                <button
                  className={styles.filterToggle}
                  onClick={() => setIsFilterOpen(true)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="1" y1="14" x2="7" y2="14"></line>
                    <line x1="9" y1="8" x2="15" y2="8"></line>
                    <line x1="17" y1="16" x2="23" y2="16"></line>
                  </svg>
                  Bộ lọc
                </button>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className={styles.sortSelect}
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.productGrid}>
              {filteredProducts.map(product => (
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
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%23333"/%3E%3Ctext x="100" y="75" text-anchor="middle" fill="%23666" font-family="Arial" font-size="14"%3ELaptop Image%3C/text%3E%3C/svg%3E';
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
                            {renderStars(product.rating)}
                          </div>
                          <span className={styles.ratingText}>
                            {product.rating} ({product.reviews} đánh giá)
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
                            <span className={styles.price}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</span>
                          </div>
                        </div>
                        <div className={styles.buttonGroup}>
                          <button className={styles.buyBtn} aria-label="Mua ngay">
                            <span>Mua ngay</span>
                            <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
                              <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button
                            className={styles.cartBtnCard}
                            aria-label="Thêm vào giỏ hàng"
                            onClick={(e) => handleAddToCart(e, product._id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length > 0 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={styles.pageBtn}
                >
                  Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`${styles.pageBtn} ${page === pageNum ? styles.activePage : ''}`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={styles.pageBtn}
                >
                  Sau
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && (
              <div className={styles.emptyState}>
                <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                <h3>Không tìm thấy sản phẩm</h3>
                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button
                  className={styles.resetFilters}
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedBrand('all');
                    setSelectedSort('default');
                    setPage(1);
                  }}
                >
                  Đặt lại bộ lọc
                </button>
              </div>
            )}
          </main>
        </div>
      </section>

      {isFilterOpen && (
        <div
          className={styles.filterOverlay}
          onClick={() => setIsFilterOpen(false)}
        ></div>
      )}

      <Footer />
    </div>
  );
}