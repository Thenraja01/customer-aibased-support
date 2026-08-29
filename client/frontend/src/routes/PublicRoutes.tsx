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
import RegistrationPending from "@/pages/AuthPage/RegistrationPending";
import OtpPage from "@/pages/AuthPage/optpage";
import Forgotpassword from "@/pages/AuthPage/Forgotpassword";
import ResetPassword from "@/pages/AuthPage/ResetPassword";
import OAuthCallback from "@/pages/AuthPage/OAuthCallback";
import OAuthCompletion from "@/pages/AuthPage/OAuthCompletion";
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
  <Route key="registration-pending" path="/registration-pending" element={<RegistrationPending />} />,
  <Route key="registration-status" path="/registration-status" element={<RegistrationPending />} />,
  <Route key="verify-otp" path="/verify-otp" element={<OtpPage />} />,
  <Route key="forgot-password" path="/forgot-password" element={<Forgotpassword />} />,
  <Route key="reset-password" path="/reset-password" element={<ResetPassword />} />,
  <Route key="oauth-callback" path="/oauth/:provider/callback" element={<OAuthCallback />} />,
  <Route key="oauth-complete" path="/oauth/complete" element={<OAuthCompletion />} />,
];
