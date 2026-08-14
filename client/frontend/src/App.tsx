import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { NavigationProvider } from "./context/NavigationContext";

export default function App() {
  return (
    <BrowserRouter>
      <NavigationProvider>
        <AppRoutes />
      </NavigationProvider>
    </BrowserRouter>
  );
}
