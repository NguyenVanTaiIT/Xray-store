import React, { createContext, useState, useEffect } from 'react';
import { loginUser, logoutUser, getProfile, registerUser } from '../services/userService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        try {
            const response = await loginUser(email, password);
            if (response.data.user && response.data.accessToken) {
                setUser(response.data.user);
                setIsAuthenticated(true);
                localStorage.setItem('accessToken', response.data.accessToken);
                console.log('Token saved to localStorage:', response.data.accessToken);
                console.log('Cookies after login:', document.cookie);
            }
            setError(null);
        } catch (error) {
            console.error('Error logging in:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('accessToken');
            document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            setError(null);
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    };

    const register = async (userData) => {
        try {
            const response = await registerUser(userData);
            setUser(response.user);
            setIsAuthenticated(true);
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('userData', JSON.stringify(response.user));
            setError(null);
            return response;
        } catch (error) {
            console.error('Error registering user:', error.response?.data || error.message);
            const errorMessage = error.response?.data?.message || error.message || 'Đăng ký thất bại';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            console.log('Checking auth with token:', token);
            if (token) {
                try {
                    const response = await getProfile();
                    console.log('Profile response:', response);
                    const userData = response.user || response;
                    if (userData && userData.id && userData.email) {
                        setUser(userData);
                        setIsAuthenticated(true);
                        setError(null);
                        localStorage.setItem('userData', JSON.stringify(userData));
                    } else {
                        console.error('Invalid user data in profile response:', response);
                        localStorage.removeItem('accessToken');
                        setIsAuthenticated(false);
                        setUser(null);
                        setError('Không tìm thấy thông tin người dùng hợp lệ');
                    }
                } catch (error) {
                    console.error('Error checking auth:', error.response?.data || error.message);
                    localStorage.removeItem('accessToken');
                    setIsAuthenticated(false);
                    setUser(null);
                    setError(error.message || 'Không thể xác thực người dùng');
                }
            } else {
                console.log('No token found in localStorage');
                setIsAuthenticated(false);
                setUser(null);
            }
        };
        checkAuth();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, isAuthenticated, login, logout, register, error, setError }}>
            {children}
        </UserContext.Provider>
    );
};