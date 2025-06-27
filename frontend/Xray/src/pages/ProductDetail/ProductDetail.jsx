import React, { useState, useEffect, useContext } from "react";
import styles from "./ProductDetail.module.css";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import { useNavigate, useParams } from "react-router-dom";
import { fetchProductById } from "../../services/productService";
import { addToCart } from "../../services/cartService";
import { toast } from "react-toastify";
import { CartContext } from '../../contexts/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const { refreshCart } = useContext(CartContext);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchProductById(id);
        setProduct(data);
      } catch (err) {
        setError("Không thể tải thông tin sản phẩm.");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleQuantityChange = (type) => {
    if (type === "increase") {
      setProduct((prev) => ({ ...prev, quantity: (prev.quantity || 1) + 1 }));
    } else if (type === "decrease" && (product?.quantity || 1) > 1) {
      setProduct((prev) => ({ ...prev, quantity: (prev.quantity || 1) - 1 }));
    }
  };

  const handleAddToCart = async () => {
  if (!product.inStock) {
    toast.error("Sản phẩm hiện đã hết hàng!");
    return;
  }

  const cartProduct = {
    _id: product._id || id,
    name: product.name,
    image: product.image || "https://via.placeholder.com/600x400",
    price: product.price,
    quantity: product.quantity || 1,
    specs: product.specs || [],
    inStock: product.inStock
  };

  try {
    await addToCart(cartProduct);
    toast.success(`${product.name} đã được thêm vào giỏ hàng!`);
    refreshCart();
  } catch (err) {
    if (err.response?.status === 401) {
      navigate('/login');
      toast.error('Vui lòng đăng nhập để thêm sản phẩm');
    } else {
      console.error('Add to cart error:', err);
      toast.error('Lỗi khi thêm sản phẩm vào giỏ hàng');
    }
  }
};

  if (loading) return <div>Đang tải...</div>;
  if (error) return <div>{error}</div>;
  if (!product) return <div>Không tìm thấy sản phẩm</div>;

  const productData = {
    ...product,
    images: [product.image || "https://via.placeholder.com/600x400"],
    quantity: product.quantity || 1,
  };

  return (
    <div className={styles.detailContainer}>
      <Header />
      <div className={styles.breadcrumb}>
        <span onClick={handleHomeClick} className={styles.clickableBreadcrumb}>
          Trang chủ
        </span>
        <span className={styles.separator}>›</span>
        <span>Laptop Gaming</span>
        <span className={styles.separator}>›</span>
        <span className={styles.current}>{productData.name}</span>
      </div>

      <div className={styles.productDetail}>
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            <img
              src={productData.images[selectedImage]}
              alt={productData.name}
              className={styles.mainImg}
              onError={(e) => {
                e.target.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23333'/%3E%3Ctext x='300' y='200' text-anchor='middle' fill='%23666' font-family='Arial' font-size='20'%3ELaptop Image%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
          <div className={styles.thumbnails}>
            {productData.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${productData.name} ${index + 1}`}
                className={`${styles.thumbnail} ${
                  selectedImage === index ? styles.activeThumbnail : ""
                }`}
                onClick={() => setSelectedImage(index)}
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='50' y='50' text-anchor='middle' fill='%23666' font-family='Arial' font-size='10'%3EImg%3C/text%3E%3C/svg%3E";
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.infoSection}>
          <h1 className={styles.productName}>{productData.name}</h1>
          <div className={styles.priceContainer}>
            <span className={styles.currentPrice}>
              {productData.price.toLocaleString("vi-VN")}₫
            </span>
          </div>

          <div className={styles.stockStatus}>
            <span
              className={
                productData.inStock ? styles.inStock : styles.outOfStock
              }
            >
              {productData.inStock ? "✓ Còn hàng" : "✗ Hết hàng"}
            </span>
            <span className={styles.warranty}>
              Bảo hành: {productData.warranty}
            </span>
          </div>

          <div className={styles.description}>
            <p>{productData.description}</p>
          </div>

          <div className={styles.quickSpecs}>
            <h3>Thông số nổi bật:</h3>
            <div className={styles.specsList}>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>CPU:</span>
                <span className={styles.specValue}>
                  {productData.specs?.[1] || "Không xác định"}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>GPU:</span>
                <span className={styles.specValue}>
                  {productData.specs?.[0] || "Không xác định"}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>RAM:</span>
                <span className={styles.specValue}>
                  {productData.specs?.[2] || "Không xác định"}
                </span>
              </div>
              <div className={styles.specItem}>
                <span className={styles.specLabel}>Ổ cứng:</span>
                <span className={styles.specValue}>
                  {productData.storage || "Không xác định"}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.purchaseSection}>
            <div className={styles.quantitySelector}>
              <label>Số lượng:</label>
              <div className={styles.quantityControls}>
                <button
                  className={styles.quantityBtn}
                  onClick={() => handleQuantityChange("decrease")}
                  disabled={productData.quantity <= 1}
                >
                  -
                </button>
                <span className={styles.quantityValue}>
                  {productData.quantity}
                </span>
                <button
                  className={styles.quantityBtn}
                  onClick={() => handleQuantityChange("increase")}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button className={styles.buyNowBtn}>
                <span>Mua ngay</span>
                <svg className={styles.btnIcon} viewBox="0 0 24 24" fill="none">
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
                className={styles.addToCartBtn} 
                onClick={handleAddToCart}
                disabled={!productData.inStock}
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

      <div className={styles.detailTabs}>
        <div className={styles.tabContent}>
          <div className={styles.specsDetail}>
            <h2>Thông số kỹ thuật chi tiết</h2>
            <div className={styles.specsGrid}>
              {Object.entries({
                processor: productData.specs?.[1] || "Không xác định",
                graphics: productData.specs?.[0] || "Không xác định",
                memory: productData.specs?.[2] || "Không xác định",
                storage: productData.storage || "Không xác định",
                display: productData.display || "Không xác định",
                os: productData.os || "Không xác định",
                battery: productData.battery || "Không xác định",
                weight: productData.weight || "Không xác định",
              }).map(([key, value]) => (
                <div key={key} className={styles.specRow}>
                  <span className={styles.specKey}>
                    {key === "processor"
                      ? "Bộ vi xử lý"
                      : key === "graphics"
                      ? "Card đồ họa"
                      : key === "memory"
                      ? "Bộ nhớ RAM"
                      : key === "storage"
                      ? "Ổ cứng"
                      : key === "display"
                      ? "Màn hình"
                      : key === "os"
                      ? "Hệ điều hành"
                      : key === "battery"
                      ? "Pin"
                      : key === "weight"
                      ? "Trọng lượng"
                      : key}
                    :
                  </span>
                  <span className={styles.specValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.features}>
            <h2>Tính năng nổi bật</h2>
            <p>{productData.featuresDescription || "Không có mô tả"}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}