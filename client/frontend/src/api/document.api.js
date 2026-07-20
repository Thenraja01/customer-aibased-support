import AxiosInstance from "./axiosInstance.js";

const url = "documents";

const DocumentAPI = {
  getAll: (params) => AxiosInstance.get(`/${url}`, { params }),
  getById: (id) => AxiosInstance.get(`/${url}/${id}`),
  getByUser: (userId) => AxiosInstance.get(`/${url}/user/${userId}`),
  getByStatus: (status) => AxiosInstance.get(`/${url}/status/${status}`),
  upload: (formData) =>
    AxiosInstance.post(`/${url}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateStatus: (id, status) =>
    AxiosInstance.patch(`/${url}/${id}/status`, { status }),
  delete: (id) => AxiosInstance.delete(`/${url}/${id}`),
  remove: (id) => AxiosInstance.delete(`/${url}/${id}`),
  download: async (id) => {
    const res = await AxiosInstance.get(`/${url}/${id}/download`, {
      responseType: "blob",
    });
    return res;
  },
  getDownloadUrl: async (id) => {
    const res = await AxiosInstance.get(`/${url}/${id}/download-url`);
    return res.data.data.download_url;
  },
};

export default DocumentAPI;
