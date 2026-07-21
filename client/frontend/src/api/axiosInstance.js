import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  timeout: 20000,
});

// Request interceptor with logging
AxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log(`📤 ${config.method?.toUpperCase()} request to: ${config.url}`);
    console.log("🔑 Token present:", !!token);
    
    if (token) {
      // Log first 20 chars of token for debugging
      console.log("🔑 Token (first 20 chars):", token.substring(0, 20) + "...");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("⚠️ No token found in localStorage");
    }
    
    // Log request data if it's a POST/PUT
    if (config.data) {
      console.log("📦 Request data:", config.data);
    }
    
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor with logging
AxiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (error.code === "ECONNABORTED") {
      error.message = "Server is waking up, please wait...";
    }

    if (error.response?.status === 401) {
      console.warn("⚠️ 401 Unauthorized - Redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }

    // Handle 403 Forbidden with more detail
    if (error.response?.status === 403) {
      console.error("⛔ 403 Forbidden - Insufficient permissions");
      console.error("Response data:", error.response.data);
      // You might want to show a user-friendly message here
    }

    return Promise.reject(error);
  }
);

export default AxiosInstance;