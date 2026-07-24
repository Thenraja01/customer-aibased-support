import AxiosInstance from "./axiosInstance.js";

export const SearchAPI = {
  query: (params) => AxiosInstance.get("/search/v1/query", { params }),
};
