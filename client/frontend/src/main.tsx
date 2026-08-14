import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { FontSettingsProvider } from "./context/FontSettingsContext";
import { ToastProvider } from "./components/ui/toast";
import { TooltipProvider } from "./components/ui/tooltip";
import { SocketProvider } from "./context/SocketContext";
import { ChatProvider } from "./context/ChatContext";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Provider as ReduxProvider } from "react-redux";
import { store } from "./store/store";
import App from "./App.js";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <FontSettingsProvider>
                <ToastProvider>
                  <TooltipProvider>
                    <SocketProvider>
                      <ChatProvider>
                        <App />
                      </ChatProvider>
                    </SocketProvider>
                  </TooltipProvider>
                </ToastProvider>
              </FontSettingsProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </StrictMode>
  );
}
