import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/userService';

const LogoutButton = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userData');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button onClick={handleLogout} disabled={isLoading}>
      {isLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}
    </button>
  );
};

export default LogoutButton;