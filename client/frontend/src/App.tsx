import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layout/layout";
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/features" element={<Features />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
           <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register />}/>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}