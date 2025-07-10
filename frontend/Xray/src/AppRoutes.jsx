import React, { useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import Home from './pages/Home/Home';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Register from './pages/Account/Register';
import Login from './pages/Account/Login';
import Products from './pages/Products/Products';
import Profile from './pages/Profile/Profile';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import OrderDetail from './pages/Orders/OrderDetail';
import AdminOrders from './pages/Admin/AdminOrders';
import AdminDashboard from './pages/Admin/AdminDashboard';
import ProductManagement from './pages/Admin/ProductManagement';
import UserManagement from './pages/Admin/UserManagement';
import ErrorBoundary from './components/ErrorBoundary';
import SearchResults from './components/SearchResults';
import AboutUs from './pages/AboutUs/AboutUs';

export default function AppRoutes() {
  const { isLoading } = useContext(UserContext);

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>🔄 Đang kiểm tra phiên đăng nhập...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/product-detail/:id" element={<ProductDetail />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/products" element={<Products />} />
      <Route
        path="/cart"
        element={
          <ErrorBoundary>
            <Cart />
          </ErrorBoundary>
        }
      />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/orders/:orderId" element={<OrderDetail />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/products" element={<ProductManagement />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path='/about-us' element={<AboutUs />} />
    </Routes>
  );
}
