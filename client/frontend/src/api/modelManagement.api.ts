import AxiosInstance from "./axiosInstance.ts";

export const ModelManagementAPI = {
  getHealth: () => AxiosInstance.get("/agent/health"),
};
