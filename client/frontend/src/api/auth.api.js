import AxiosInstance from "./axiosInstance.js";

const url = "auth/v1";

export const AuthAPI = {
  signup: (data) => AxiosInstance.post(`/${url}/register`, data),
  login: (data) => AxiosInstance.post(`/${url}/login`, data),
  getOrganizations: () => AxiosInstance.get(`/${url}/organizations`),
  getRoles: () => AxiosInstance.get(`/${url}/roles`),
};
