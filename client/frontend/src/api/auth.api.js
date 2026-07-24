import AxiosInstance from "./axiosInstance.js";

const BASE_URL = "/auth/v1";

export const AuthAPI = {
  signup: async (data) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/register`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  login: async (data) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/login`, data);
      return response;
    } catch (error) {
      throw error;
    }
  },

  loginWithOrg: async (email, password, organizationId) => {
    try {
      const response = await AxiosInstance.post(`${BASE_URL}/login`, {
        email,
        password,
        organization_id: organizationId,
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getOrganizations: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/organizations`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getOrgByDomain: async (domain) => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/organizations/by-domain`, { params: { domain } });
      return response;
    } catch (error) {
      throw error;
    }
  },

  getRoles: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/roles`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  getAppSettings: async () => {
    try {
      const response = await AxiosInstance.get(`${BASE_URL}/app-settings`);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
