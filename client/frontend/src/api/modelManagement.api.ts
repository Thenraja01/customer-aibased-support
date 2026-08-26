import AxiosInstance from "./axiosInstance.ts";

export const ModelManagementAPI = {
  getHealth: () => AxiosInstance.get("/agent/health"),
  switchProvider: (provider: string) => AxiosInstance.post("/agent/switch-provider", { provider }),
  testFailover: (payload?: { targetProvider?: string; scenario?: string }) => AxiosInstance.post("/agent/test-failover", payload || {}),
  testProvider: (payload: { provider: string; apiKey?: string; model?: string }) => AxiosInstance.post("/agent/test-provider", payload),
  testPipeline: (payload?: { stage?: string }) => AxiosInstance.post("/agent/test-pipeline", payload || {}),
  updateProviderConfig: (payload: any) => AxiosInstance.put("/admin/v1/settings", payload),
};
