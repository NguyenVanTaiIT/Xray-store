import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext'; // Thêm import UserProvider
import { CartProvider } from './contexts/CartContext';
import Home from './pages/Home/Home';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import Register from './pages/Account/Register';
import Login from './pages/Account/Login';
import Products from './pages/Products/Products';
import Profile from './pages/Profile/Profile';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <UserProvider> {/* Thêm UserProvider */}
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product-detail/:id" element={<ProductDetail />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/Products" element={<Products />} />
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
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </UserProvider>
    </>
  );
}

export default App;