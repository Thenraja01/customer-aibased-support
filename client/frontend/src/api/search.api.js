import AxiosInstance from "./axiosInstance.ts";

export const SearchAPI = {
  query: (params) => AxiosInstance.get("/search/v1/query", { params }),
};
