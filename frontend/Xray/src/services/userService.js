import api from '../api/api';

export const registerUser = async (userData) => {
  try {
    const payload = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      phone: userData.phone,
    };
    console.log('Register payload:', payload);
    const response = await api.post('/users/register', payload);
    return response.data; // Add .data to return the actual response payload
  } catch (err) {
    console.error('Error registering user:', err);
    throw err;
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log('Login payload:', { email, password });
    const response = await api.post('/users/login', { email, password });
    return response; // Trả về response thay vì response.data
  } catch (err) {
    console.error('Error logging in:', err.response?.data || err.message);
    throw err;
  }
};

export const refreshToken = async () => {
  try {
    console.log('Sending refresh-token request to:', 'http://localhost:3001/api/users/refresh-token');
    const response = await api.post('/users/refresh-token', {}, {
      withCredentials: true
    });
    console.log('Refresh token response:', response.data);
    console.log('Cookies sent:', document.cookie); // Add this for debugging
    return response.data;
  } catch (err) {
    console.error('Error refreshing token:', err.response?.data || err.message);
    throw err;
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/users/logout', {}, { withCredentials: true });
    return response.data;
  } catch (err) {
    console.error('Error logging out:', err);
    if (err.response?.status === 500) {
      throw new Error('Lỗi server khi đăng xuất. Vui lòng thử lại sau.');
    }
    throw err;
  }
};

export const getProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (err) {
    console.error('Error fetching profile:', err);
    throw err;
  }
};

export const updateProfile = async (name, address) => {
  try {
    if (!name) {
      throw new Error('Tên không được để trống');
    }
    if (address && (!address.street && !address.district && !address.city && !address.zipCode)) {
      throw new Error('Vui lòng cung cấp ít nhất một thông tin địa chỉ');
    }
    const payload = address ? { name, address } : { name };
    console.log('Sending payload to API:', payload);
    const response = await api.put('/users/profile', payload);
    return response.data;
  } catch (err) {
    console.error('Error updating profile:', err);
    throw err;
  }
};