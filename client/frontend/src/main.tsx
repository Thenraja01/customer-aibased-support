import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toaster } from "sonner";
import BrandingInjector from "@/components/common/BrandingInjector";
import App from "./App.js";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            {/* BrandingInjector reads ui_config from Redux and applies dynamic CSS vars */}
            <BrandingInjector />
            <App />
          </AuthProvider>
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </Provider>
    </StrictMode>
  );
}
