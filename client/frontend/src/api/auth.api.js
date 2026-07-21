// auth.api.js
import AxiosInstance from "./axiosInstance.js";

const BASE_URL = "/auth/v1";

export const AuthAPI = {
  signup: async (data) => {
    try {
      console.log("Sending signup data:", data);
      const response = await AxiosInstance.post(`${BASE_URL}/register`, data);
      console.log("Signup response:", response.data);
      return response;
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  login: async (data) => {
    try {
      console.log("Sending login data:", data);
      const response = await AxiosInstance.post(`${BASE_URL}/login`, data);
      console.log("Login response:", response.data);
      return response;
    } catch (error) {
      console.error("Login error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  getOrganizations: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/organizations`);
      return response;
    } catch (error) {
      console.error("Get organizations error:", error.response?.data || error.message);
      throw error;
    }
  },
  
  getRoles: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/roles`);
      return response;
    } catch (error) {
      console.error("Get roles error:", error.response?.data || error.message);
      throw error;
    }
  },
};