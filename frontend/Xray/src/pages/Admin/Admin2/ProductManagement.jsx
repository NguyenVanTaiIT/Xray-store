import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../../../services/productService';
import { UserContext } from '../../../contexts/UserContext';
import { toast } from 'react-toastify';
import AdminPanel from '../../../components/AdminPanel';
import placeholderImage from '../../../assets/Placeholder.jpg';
import styles from './ProductManagement.module.css';

export default function ProductManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = React.useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const data = await fetchProducts();
        setProducts(data.products);
      } catch (err) {
        toast.error(err.message || 'Không thể tải sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [isAuthenticated, user, navigate]);

  const handleImageUpload = async (file) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Chỉ hỗ trợ định dạng JPG hoặc PNG');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File quá lớn (tối đa 5MB)');
      return;
    }

    setImageUploading(true);
    try {
      const imageUrl = await uploadProductImage(file);
      setFormValues(prev => ({ ...prev, image: imageUrl }));
      toast.success('Tải ảnh lên thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể tải ảnh lên');
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const product = await createProduct(formValues);
      setProducts([...products, product]);
      toast.success('Thêm sản phẩm thành công');
      handleModalCancel();
    } catch (err) {
      toast.error(err.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleEditProduct = async () => {
    try {
      const response = await updateProduct(editingProduct._id, {
        ...formValues,
        stockQuantity: parseInt(formValues.stockQuantity) || 0,
      });
      setProducts(products.map(p => p._id === editingProduct._id ? response : p));
      toast.success('Cập nhật sản phẩm thành công');
      handleModalCancel();
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật sản phẩm');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await deleteProduct(id);
      setProducts(products.filter(p => p._id !== id));
      toast.success('Xóa sản phẩm thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể xóa sản phẩm');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormValues({
      ...product,
      specs: Array.isArray(product.specs) ? product.specs.join(', ') : product.specs
    });
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    setFormValues({});
  };

  const handleSubmit = () => {
    if (editingProduct) {
      handleEditProduct();
    } else {
      handleAddProduct();
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Hết hàng', class: styles.outOfStock };
    if (quantity <= 10) return { text: 'Sắp hết', class: styles.lowStock };
    return { text: 'Còn hàng', class: styles.inStock };
  };

  if (isLoading) {
    return (
      <AdminPanel title="Quản lý sản phẩm" subtitle="Đang tải danh sách sản phẩm...">
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tải danh sách sản phẩm...</div>
        </div>
      </AdminPanel>
    );
  }

  return (
    <AdminPanel 
      title="Quản lý sản phẩm" 
      subtitle="Thêm, sửa, xóa và quản lý danh sách sản phẩm"
    >
      {/* Statistics */}
      <div className={styles.statsRow}>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Tổng sản phẩm</span>
            <span className={styles.statValue}>{products.length}</span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Còn hàng</span>
            <span className={`${styles.statValue} ${styles.statInStock}`}>
              {products.filter(p => p.stockQuantity > 0).length}
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Sắp hết hàng</span>
            <span className={`${styles.statValue} ${styles.statLowStock}`}>
              {products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 10).length}
            </span>
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.statItem}>
            <span className={styles.statTitle}>Hết hàng</span>
            <span className={`${styles.statValue} ${styles.statOutOfStock}`}>
              {products.filter(p => p.stockQuantity === 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <h3 className={styles.tableTitle}>Danh sách sản phẩm</h3>
          <button 
            className={styles.addButton}
            onClick={() => { setEditingProduct(null); setFormValues({}); setIsModalVisible(true); }}
          >
            Thêm sản phẩm
          </button>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Danh mục</th>
                <th>Thương hiệu</th>
                <th>Tồn kho</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map(record => {
                const stockStatus = getStockStatus(record.stockQuantity);
                return (
                  <tr key={record._id}>
                    <td>
                      <div className={styles.productInfo}>
                        <img
                          src={record.image || placeholderImage}
                          alt={record.name}
                          className={styles.productImage}
                          onError={(e) => { e.target.src = placeholderImage; }}
                        />
                        <div className={styles.productDetails}>
                          <div className={styles.productName}>{record.name}</div>
                          <div className={styles.productSku}>{record.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.productPrice}>
                        {Number(record.price).toLocaleString('vi-VN')}₫
                      </span>
                    </td>
                    <td className={styles.productCategory}>{record.category}</td>
                    <td className={styles.productBrand}>{record.brand}</td>
                    <td>
                      <div className={styles.stockInfo}>
                        <span className={styles.stockQuantity}>{record.stockQuantity}</span>
                        <span className={`${styles.stockStatus} ${stockStatus.class}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.editBtn}
                          onClick={() => handleEditClick(record)}
                        >
                          Sửa
                        </button>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDeleteProduct(record._id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {isModalVisible && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingProduct ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
              </h3>
              <button className={styles.closeButton} onClick={handleModalCancel}>×</button>
            </div>
            <form className={styles.form}>
              <div className={styles.formGrid}>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Tên sản phẩm"
                  value={formValues.name || ""}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="number"
                  placeholder="Giá (VNĐ)"
                  value={formValues.price || ""}
                  onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Danh mục"
                  value={formValues.category || ""}
                  onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Thương hiệu"
                  value={formValues.brand || ""}
                  onChange={(e) => setFormValues({ ...formValues, brand: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="SKU"
                  value={formValues.sku || ""}
                  onChange={(e) => setFormValues({ ...formValues, sku: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="number"
                  placeholder="Số lượng tồn kho"
                  value={formValues.stockQuantity || ""}
                  onChange={(e) => setFormValues({ ...formValues, stockQuantity: e.target.value })}
                />
              </div>

              <div className={styles.formGrid}>
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Bảo hành"
                  value={formValues.warranty || ""}
                  onChange={(e) => setFormValues({ ...formValues, warranty: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Bộ nhớ"
                  value={formValues.storage || ""}
                  onChange={(e) => setFormValues({ ...formValues, storage: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Màn hình"
                  value={formValues.display || ""}
                  onChange={(e) => setFormValues({ ...formValues, display: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Hệ điều hành"
                  value={formValues.os || ""}
                  onChange={(e) => setFormValues({ ...formValues, os: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Pin"
                  value={formValues.battery || ""}
                  onChange={(e) => setFormValues({ ...formValues, battery: e.target.value })}
                />
                <input
                  className={styles.formInput}
                  type="text"
                  placeholder="Trọng lượng"
                  value={formValues.weight || ""}
                  onChange={(e) => setFormValues({ ...formValues, weight: e.target.value })}
                />
              </div>

              <input
                className={styles.formInput}
                type="text"
                placeholder="Thông số kỹ thuật (phân cách bằng dấu phẩy)"
                value={formValues.specs || ""}
                onChange={(e) => setFormValues({ ...formValues, specs: e.target.value })}
              />
              
              <textarea
                className={styles.formTextarea}
                placeholder="Mô tả tính năng"
                value={formValues.featuresDescription || ""}
                onChange={(e) => setFormValues({ ...formValues, featuresDescription: e.target.value })}
              />
              
              <textarea
                className={styles.formTextarea}
                placeholder="Mô tả sản phẩm"
                value={formValues.description || ""}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
              />

              <div className={styles.imageUpload}>
                <input
                  className={styles.fileInput}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                  disabled={imageUploading}
                />
                {imageUploading && <div className={styles.uploadingText}>Đang tải...</div>}
                {formValues.image && (
                  <img
                    src={formValues.image}
                    alt="Preview"
                    className={styles.previewImage}
                    onError={(e) => { e.target.src = placeholderImage; }}
                  />
                )}
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.submitButton}
                  onClick={handleSubmit}
                >
                  {editingProduct ? "Cập nhật" : "Thêm sản phẩm"}
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={handleModalCancel}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminPanel>
  );
}