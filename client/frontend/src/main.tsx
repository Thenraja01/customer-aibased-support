import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/ui/toast";
import { SocketProvider } from "./context/SocketContext";
import App from "./App.js";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <SocketProvider>
                <App />
              </SocketProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </StrictMode>
  );
}
