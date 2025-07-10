import axios from 'axios';
import { refreshToken } from '../services/userService';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Cờ trạng thái đang logout
let isLoggingOut = false;
let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

export const setLoggingOut = (value) => {
  isLoggingOut = value;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/users/refresh-token'
    ) {
      if (isLoggingOut) {
        return Promise.reject(error);
      }
      // Nếu chưa đăng nhập (user null), không refresh token
      if (!window.__USER_LOGGED_IN__) {
        return Promise.reject(error);
      }
      originalRequest._retry = true;
      try {
        await refreshToken();
        return api(originalRequest);
      } catch {
        if (logoutCallback && !isLoggingOut) {
          setLoggingOut(true);
          logoutCallback();
        }
        return Promise.reject(new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;