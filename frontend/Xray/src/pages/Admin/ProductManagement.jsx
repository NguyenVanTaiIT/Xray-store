import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../services/productService';
import { uploadProductImage } from '../../services/productService'; // Import hàm upload
import { UserContext } from '../../contexts/UserContext';
import { toast } from 'react-toastify';
import styles from './ProductManagement.module.css';

export default function ProductManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = React.useContext(UserContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    image: '',
    category: '',
    brand: '',
    sku: '',
    specs: '',
    warranty: '24 tháng',
    storage: '',
    display: '',
    os: '',
    battery: '',
    weight: '',
    featuresDescription: '',
    description: '',
    stockQuantity: ''
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageUploading, setImageUploading] = useState(false); // Thêm state cho trạng thái upload
  const [imageError, setImageError] = useState(null); // Thêm state cho lỗi upload

  useEffect(() => {
    // if (!isAuthenticated || user?.role !== 'admin') {
    //   navigate('/login');
    //   toast.error('Bạn cần quyền admin để truy cập');
    //   return;
    // }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, [name]: value }));
    } else {
      setNewProduct(prev => ({ ...prev, [name]: value }));
    }
  };

  // Thêm hàm xử lý upload ảnh
  const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    setImageError('Chỉ hỗ trợ định dạng JPG hoặc PNG');
    toast.error('Chỉ hỗ trợ định dạng JPG hoặc PNG');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    setImageError('File quá lớn (tối đa 5MB)');
    toast.error('File quá lớn (tối đa 5MB)');
    return;
  }

  setImageUploading(true);
  setImageError(null);
  try {
    console.log('Uploading to:', `${import.meta.env.VITE_API_URL}/products/upload`);
    const imageUrl = await uploadProductImage(file);
    if (editingProduct) {
      setEditingProduct(prev => ({ ...prev, image: imageUrl }));
    } else {
      setNewProduct(prev => ({ ...prev, image: imageUrl }));
    }
    toast.success('Tải ảnh lên thành công');
  } catch (err) {
    console.error('Upload error:', err);
    setImageError(err.message);
    toast.error(err.message || 'Không thể tải ảnh lên');
  } finally {
    setImageUploading(false);
  }
};

  const isProductValid = (product) => {
    const requiredFields = [
      'name',
      'price',
      'image',
      'category',
      'brand',
      'sku',
      'specs',
      'stockQuantity',
      'display'
    ];
    return requiredFields.every(field => product[field] && product[field].toString().trim() !== '');
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    if (!isProductValid(newProduct)) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc');
      return;
    }

    try {
      const product = await createProduct(newProduct);
      setProducts([...products, product]);
      resetForm();
      setShowAddForm(false);
      toast.success('Thêm sản phẩm thành công');
    } catch (err) {
      toast.error(err.message || 'Không thể thêm sản phẩm');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      console.log('ProductManagement - Editing product with ID:', editingProduct._id);
      console.log('ProductManagement - Form data:', editingProduct);
      const response = await updateProduct(editingProduct._id, {
        name: editingProduct.name,
        price: editingProduct.price,
        specs: editingProduct.specs,
        image: editingProduct.image,
        category: editingProduct.category,
        brand: editingProduct.brand,
        rating: editingProduct.rating,
        reviews: editingProduct.reviews,
        stockQuantity: parseInt(editingProduct.stockQuantity) || 0,
        sku: editingProduct.sku,
        warranty: editingProduct.warranty,
        storage: editingProduct.storage,
        display: editingProduct.display,
        os: editingProduct.os,
        battery: editingProduct.battery,
        weight: editingProduct.weight,
        featuresDescription: editingProduct.featuresDescription,
        description: editingProduct.description
      });
      setProducts(products.map(p => p._id === editingProduct._id ? response : p));
      setEditingProduct(null);
      toast.success('Cập nhật sản phẩm thành công');
    } catch (err) {
      console.error('ProductManagement - Error updating product:', err);
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

  const resetForm = () => {
    setNewProduct({
      name: '',
      price: '',
      image: '',
      category: '',
      brand: '',
      sku: '',
      specs: '',
      warranty: '24 tháng',
      storage: '',
      display: '',
      os: '',
      battery: '',
      weight: '',
      featuresDescription: '',
      description: '',
      stockQuantity: ''
    });
    setShowAddForm(false);
    setEditingProduct(null);
    setImageError(null); // Reset lỗi ảnh
  };

  if (isLoading) {
    return (
      <div className={styles.adminContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Đang tải danh sách sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
  <div className={styles.adminContainer}>
    {isLoading ? (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner}></div>
        <p>Đang tải dữ liệu...</p>
      </div>
    ) : (
      <>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <svg className={styles.titleIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Quản lý sản phẩm
            </h1>
            <p className={styles.subtitle}>Thêm, sửa, xóa và quản lý danh sách sản phẩm</p>
          </div>
          <button className={styles.backBtn} onClick={() => navigate('/admin')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại
          </button>
        </div>

        <div className={styles.mainContent}>
          {/* Form Section */}
          <div className={styles.formSection}>
            <div className={styles.formContainer}>
              <div className={styles.formHeader}>
                <h2 className={styles.formTitle}>
                  <svg className={styles.formIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={editingProduct ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
                  </svg>
                  {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                </h2>
                {editingProduct && (
                  <button className={styles.closeFormBtn} onClick={() => setEditingProduct(null)}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              <form className={styles.form} onSubmit={editingProduct ? handleEditProduct : handleAddProduct}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Tên sản phẩm</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="name"
                      value={editingProduct ? editingProduct.name : newProduct.name}
                      onChange={handleInputChange}
                      placeholder="Nhập tên sản phẩm"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Giá (VNĐ)</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      name="price"
                      value={editingProduct ? editingProduct.price : newProduct.price}
                      onChange={handleInputChange}
                      placeholder="Nhập giá sản phẩm"
                      required
                      min="0"
                    />
                  </div>

                  {/* Thay thế input URL ảnh bằng input file và preview */}
                  <div className={styles.formGroup}>
  <label className={styles.formLabel}>Ảnh sản phẩm</label>
  <input
    className={styles.formInput}
    type="file"
    accept="image/jpeg,image/png"
    onChange={handleImageUpload}
    disabled={imageUploading}
  />
  {imageUploading && (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner}></div>
      <p>Đang tải ảnh...</p>
    </div>
  )}
  {imageError && (
    <p className={styles.errorText}>{imageError}</p>
  )}
</div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Danh mục</label>
                    <select
                      className={styles.formSelect}
                      name="category"
                      value={editingProduct ? editingProduct.category : newProduct.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn danh mục</option>
                      <option value="gaming">Gaming</option>
                      <option value="office">Office</option>
                      <option value="ultrabook">Ultrabook</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Thương hiệu</label>
                    <select
                      className={styles.formSelect}
                      name="brand"
                      value={editingProduct ? editingProduct.brand : newProduct.brand}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Chọn thương hiệu</option>
                      <option value="asus">Asus</option>
                      <option value="msi">MSI</option>
                      <option value="acer">Acer</option>
                      <option value="lenovo">Lenovo</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>SKU</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="sku"
                      value={editingProduct ? editingProduct.sku : newProduct.sku}
                      onChange={handleInputChange}
                      placeholder="BRAND-CATEGORY-XXXX"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bảo hành</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="warranty"
                      value={editingProduct ? editingProduct.warranty : newProduct.warranty}
                      onChange={handleInputChange}
                      placeholder="VD: 24 tháng"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Bộ nhớ</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="storage"
                      value={editingProduct ? editingProduct.storage : newProduct.storage}
                      onChange={handleInputChange}
                      placeholder="VD: 512GB SSD"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Màn hình</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="display"
                      value={editingProduct ? editingProduct.display : newProduct.display}
                      onChange={handleInputChange}
                      placeholder="VD: 15.6 inch FHD"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Hệ điều hành</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="os"
                      value={editingProduct ? editingProduct.os : newProduct.os}
                      onChange={handleInputChange}
                      placeholder="VD: Windows 11"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Pin</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="battery"
                      value={editingProduct ? editingProduct.battery : newProduct.battery}
                      onChange={handleInputChange}
                      placeholder="VD: 3-cell, 45Wh"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Trọng lượng</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="weight"
                      value={editingProduct ? editingProduct.weight : newProduct.weight}
                      onChange={handleInputChange}
                      placeholder="VD: 1.8kg"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Số lượng tồn kho</label>
                    <input
                      className={styles.formInput}
                      type="number"
                      name="stockQuantity"
                      value={editingProduct ? editingProduct.stockQuantity : newProduct.stockQuantity}
                      onChange={handleInputChange}
                      placeholder="Nhập số lượng"
                      required
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Thông số kỹ thuật</label>
                    <input
                      className={styles.formInput}
                      type="text"
                      name="specs"
                      value={editingProduct ? (Array.isArray(editingProduct.specs) ? editingProduct.specs.join(', ') : editingProduct.specs) : newProduct.specs}
                      onChange={handleInputChange}
                      placeholder="Thông số kỹ thuật (phân cách bằng dấu phẩy)"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Mô tả tính năng</label>
                    <textarea
                      className={styles.formTextarea}
                      name="featuresDescription"
                      value={editingProduct ? editingProduct.featuresDescription : newProduct.featuresDescription}
                      onChange={handleInputChange}
                      placeholder="Mô tả các tính năng nổi bật của sản phẩm"
                      rows="3"
                    />
                  </div>

                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Mô tả sản phẩm</label>
                    <textarea
                      className={styles.formTextarea}
                      name="description"
                      value={editingProduct ? editingProduct.description : newProduct.description}
                      onChange={handleInputChange}
                      placeholder="Mô tả chi tiết về sản phẩm"
                      rows="4"
                    />
                  </div>
                </div>

                <div className={styles.formButtons}>
                  <button type="submit" className={styles.submitBtn} disabled={imageUploading}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => {
                      if (editingProduct) {
                        setEditingProduct(null);
                      } else {
                        resetForm();
                      }
                    }}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Products Section */}
          <div className={styles.productsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Danh sách sản phẩm</h2>
              <div className={styles.productStats}>
                <span className={styles.statsText}>
                  Tổng: {products.length} sản phẩm
                </span>
              </div>
            </div>

            {products.length > 0 ? (
              <div className={styles.tableContainer}>
                <table className={styles.productsTable}>
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
                    {products.map(product => (
                      <tr key={product._id} className={styles.productRow}>
                        <td>
                          <div className={styles.productInfo}>
                            <img
                              src={product.image}
                              alt={product.name}
                              className={styles.productImage}
                            />
                            <div>
                              <div className={styles.productName}>{product.name}</div>
                              <div className={styles.productSku}>{product.sku}</div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.priceCell}>
                          <span className={styles.price}>
                            {Number(product.price).toLocaleString('vi-VN')}₫
                          </span>
                        </td>
                        <td>
                          <span className={styles.categoryBadge}>
                            {product.category}
                          </span>
                        </td>
                        <td>
                          <span className={styles.brandBadge}>
                            {product.brand}
                          </span>
                        </td>
                        <td className={styles.stockCell}>
                          <span
                            className={
                              product.stockQuantity > 10
                                ? styles.stockInStock
                                : product.stockQuantity > 0
                                ? styles.stockLowStock
                                : styles.stockOutOfStock
                            }
                          >
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td className={styles.actionsCell}>
                          <div className={styles.actionButtons}>
                            <button
                              className={styles.editBtn}
                              onClick={() => setEditingProduct(product)}
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Sửa
                            </button>
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <svg
                  className={styles.emptyIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3>Chưa có sản phẩm nào</h3>
                <p>Hãy thêm sản phẩm đầu tiên để bắt đầu quản lý cửa hàng của bạn</p>
              </div>
            )}
          </div>
        </div>
      </>
    )}
  </div>
);
}