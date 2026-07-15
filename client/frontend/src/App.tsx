import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/layout";
import ProtectedRoute from "@/components/ProdectedRoute";

import Home from "@/pages/Marketing/Home";
import About from "@/pages/Marketing/About";
import Services from "@/pages/Marketing/Services";
import Features from "@/pages/Marketing/Feature";
import Industries from "@/pages/Marketing/Industries";
import Pricing from "@/pages/Marketing/Pricing";
import Contact from "@/pages/Marketing/Contact";
import Privacy from "@/pages/Marketing/Privacy";

import Login from "./pages/AuthPage/Login";
import Register from "./pages/AuthPage/Register";

import AdminDashboard from "@/pages/Admin/AdminDashboard";
import CustomerDashboard from "./pages/Customer/CustomerDashboard";
import DashboardLayout from "./layout/DashboardLayout";

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/features" element={<Features />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Admin */}
        <Route element={<DashboardLayout />}>

          <Route>
            <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<AdminDashboard />} />  
            <Route element={<ProtectedRoute allowedRoles={["admin", "super_admin"]} />}>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["user", "admin", "super_admin"]} />}>
              <Route path="/dashboard" element={<CustomerDashboard />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}