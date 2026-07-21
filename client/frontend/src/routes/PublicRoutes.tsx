import { Route } from "react-router-dom";
import Home from "@/pages/Marketing/Home";
import About from "@/pages/Marketing/About";
import Services from "@/pages/Marketing/Services";
import Features from "@/pages/Marketing/Feature";
import Industries from "@/pages/Marketing/Industries";
import Pricing from "@/pages/Marketing/Pricing";
import Contact from "@/pages/Marketing/Contact";
import Privacy from "@/pages/Marketing/Privacy";
import Login from "@/pages/AuthPage/Login";
import Register from "@/pages/AuthPage/Register";

export const publicRoutes = [
  <Route key="home" path="/" element={<Home />} />,
  <Route key="about" path="/about" element={<About />} />,
  <Route key="services" path="/services" element={<Services />} />,
  <Route key="features" path="/features" element={<Features />} />,
  <Route key="industries" path="/industries" element={<Industries />} />,
  <Route key="pricing" path="/pricing" element={<Pricing />} />,
  <Route key="contact" path="/contact" element={<Contact />} />,
  <Route key="privacy" path="/privacy" element={<Privacy />} />,
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="register" path="/register" element={<Register />} />,
];
