import axios from 'axios';
import { refreshToken } from '../services/userService';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true
});

api.interceptors.request.use(config => {
    const accessToken = localStorage.getItem('accessToken');
    // console.log('Using localStorage token:', accessToken);
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
        console.log('No token available for request:', config.url);
    }
    return config;
});

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const response = await refreshToken();
                const newAccessToken = response.accessToken;
                localStorage.setItem('accessToken', newAccessToken);
                document.cookie = `accessToken=${newAccessToken}; path=/; max-age=3600; SameSite=Lax`;
                console.log('New token obtained:', newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Error refreshing token:', refreshError);
                localStorage.removeItem('accessToken');
                document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;