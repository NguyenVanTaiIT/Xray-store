import api from '../api/api';

export const fetchProducts = async (category, brand, sort, page = 1, limit = 10) => {
  try {
    const query = `?category=${category || ''}&brand=${brand || ''}&sort=${sort || ''}&page=${page}&limit=${limit}`;
    const response = await api.get(`/products${query}`);
    console.log('Raw API response:', JSON.stringify(response.data, null, 2)); // Debug raw response
    const data = Array.isArray(response.data)
      ? { products: response.data, totalCount: response.data.length }
      : {
          products: Array.isArray(response.data.products) ? response.data.products : [],
          totalCount: response.data.totalCount || 0
        };
    console.log('Processed fetchProducts response:', JSON.stringify(data, null, 2)); // Debug processed response
    return data;
  } catch (err) {
    console.error('Error fetching products:', err.response?.data || err.message);
    throw new Error(err.response?.data?.message || 'Không thể tải sản phẩm');
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (err) {
    console.error('Error fetching product by id:', err);
    throw err;
  }
};