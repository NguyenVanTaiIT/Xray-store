import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import { CartProvider } from './contexts/CartContext';
import { ToastContainer } from 'react-toastify';
import { ConfigProvider, theme } from 'antd';

import 'react-toastify/dist/ReactToastify.css';
import 'antd/dist/reset.css';
import './styles/admin/adminTheme.css';   // import file tổng

import AppRoutes from './AppRoutes';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <UserProvider>
          <CartProvider>
            <ConfigProvider
              theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                  colorPrimary: '#1E90FF',
                  colorBgBase: '#0f172a',
                  colorTextBase: '#ffffff',
                  borderRadius: 8,
                },
              }}
            >
              <AppRoutes />
            </ConfigProvider>
          </CartProvider>
        </UserProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
