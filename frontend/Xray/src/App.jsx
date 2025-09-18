import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastContainer } from "react-toastify";
import { DarkModeProvider } from "./contexts/DarkModeContext";

import "react-toastify/dist/ReactToastify.css";
import "./styles/DarkTheme.css"; // global theme file

import AppRoutes from "./AppRoutes";

function App() {
  return (
    <DarkModeProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <BrowserRouter>
        <UserProvider>
          <CartProvider>
            <AppRoutes />
          </CartProvider>
        </UserProvider>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;
