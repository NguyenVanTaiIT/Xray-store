import api from '../api/api';

export const fetchProducts = async (category, brand, sort, page, limit) => {
  try {
    const response = await api.get('/api/products', {
      params: { category, brand, sort, page, limit },
      withCredentials: true
    });
    const data = response.data || {};
    if (!data.products || !Array.isArray(data.products)) {
      console.warn('Invalid products data:', data);
      return {
        products: [],
        totalCount: 0,
        totalPages: 1,
        currentPage: 1,
        categoryCounts: {}
      };
    }
    const products = data.products.map(product => ({
      ...product,
      _id: String(product._id),
      price: Number(product.price) || 0
    }));
    return {
      products,
      totalCount: data.totalCount || 0,
      totalPages: data.totalPages || 1,
      currentPage: data.currentPage || 1,
      categoryCounts: data.categoryCounts || {}
    };
  } catch (error) {
    console.error('productService - Error fetching products:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: '/products',
      method: 'GET'
    });
    return {
      products: [],
      totalCount: 0,
      totalPages: 1,
      currentPage: 1,
      categoryCounts: {}
    };
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await api.get(`/api/products/${id}`, { withCredentials: true }); 
    return response.data;
  } catch (err) {
    console.error('Error fetching product by id:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: `/products/${id}`,
      method: 'GET'
    });
    throw err;
  }
};

export const createProduct = async (productData) => {
  try {
    const payload = {
      name: productData.name,
      price: parseFloat(productData.price),
      image: productData.image,
      category: productData.category,
      brand: productData.brand,
      sku: productData.sku,
      specs: productData.specs ? productData.specs.split(',').map(s => s.trim()) : [],
      warranty: productData.warranty || '24 tháng',
      storage: productData.storage || '',
      display: productData.display || '',
      os: productData.os || '',
      battery: productData.battery || '',
      weight: productData.weight || '',
      featuresDescription: productData.featuresDescription || '',
      description: productData.description || '',
      stockQuantity: parseInt(productData.stockQuantity) || 0
    };
    console.log('Create product payload:', payload);
    const response = await api.post('/api/products', payload, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error creating product:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: '/products',
      method: 'POST'
    });
    throw new Error(err.response?.data?.message || 'Không thể thêm sản phẩm');
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const payload = {
      name: productData.name,
      price: parseFloat(productData.price),
      image: productData.image,
      category: productData.category,
      brand: productData.brand,
      sku: productData.sku,
      specs: productData.specs ? (Array.isArray(productData.specs) ? productData.specs : productData.specs.split(',').map(s => s.trim())) : [],
      warranty: productData.warranty || '24 tháng',
      storage: productData.storage || '',
      display: productData.display || '',
      os: productData.os || '',
      battery: productData.battery || '',
      weight: productData.weight || '',
      featuresDescription: productData.featuresDescription || '',
      description: productData.description || '',
      stockQuantity: parseInt(productData.stockQuantity) || 0
    };
    console.log('Update product payload:', payload);
    const response = await api.put(`/api/products/${id}`, payload, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error updating product:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: `/products/${id}`,
      method: 'PUT'
    });
    throw new Error(err.response?.data?.message || 'Không thể cập nhật sản phẩm');
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`/api/products/${id}`, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error deleting product:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: `/products/${id}`,
      method: 'DELETE'
    });
    throw new Error(err.response?.data?.message || 'Không thể xóa sản phẩm');
  }
};

export const submitReview = async (productId, reviewData) => {
  const response = await api.post(`/api/products/${productId}/review`, reviewData, {
    withCredentials: true
  });
  return response.data;
};

export const searchProducts = async (keyword) => {
  try {
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      console.warn('Invalid search keyword:', keyword);
      throw new Error('Từ khóa tìm kiếm không hợp lệ');
    }
    const encodedKeyword = encodeURIComponent(keyword.trim());
    console.log('Sending API request with keyword:', encodedKeyword);
    const response = await api.get(`/api/products/search?q=${encodedKeyword}`, {
      withCredentials: true,
    });
    console.log('API response:', response.data);
    const suggestions = (response.data || [])
      .map(product => (typeof product === 'string' ? product : product?.name))
      .filter(name => name && typeof name === 'string');
    console.log('Processed suggestions:', suggestions);
    return { data: suggestions };
  } catch (err) {
    console.error('Lỗi gợi ý sản phẩm:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: `/products/search?q=${encodeURIComponent(keyword)}`,
      method: 'GET'
    });
    throw new Error(err.response?.data?.message || 'Lỗi khi tìm kiếm sản phẩm');
  }
};

export const uploadProductImage = async (file) => {
  try {
    console.log('Uploading file:', file.name);
    console.log('Sending request to:', `${import.meta.env.VITE_API_URL}/products/upload`);
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/api/products/upload', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log('Response:', response.data);
    console.log('Image URL:', response.data.imageUrl);
    return response.data.imageUrl;
  } catch (err) {
    console.error('Error uploading product image:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      url: '/products/upload',
      method: 'POST'
    });
    throw new Error(err.response?.data?.message || 'Không thể upload ảnh sản phẩm');
  }
};