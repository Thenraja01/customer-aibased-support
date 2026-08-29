import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { NavigationProvider } from "./context/NavigationContext";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <NavigationProvider>
        <AppRoutes />
      </NavigationProvider>
    </BrowserRouter>
  );
}
