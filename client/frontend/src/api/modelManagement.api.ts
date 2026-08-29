import AxiosInstance from "./axiosInstance";

export const ModelManagementAPI = {
  getHealth: () => AxiosInstance.get("/agent/health"),
  switchProvider: (provider: string) => AxiosInstance.post("/agent/switch-provider", { provider }),
  testFailover: (payload?: { targetProvider?: string; scenario?: string }) => AxiosInstance.post("/agent/test-failover", payload || {}),
  testProvider: (payload: { provider: string; apiKey?: string; model?: string }) => AxiosInstance.post("/agent/test-provider", payload),
  testPipeline: (payload?: { stage?: string }) => AxiosInstance.post("/agent/test-pipeline", payload || {}),
  updateProviderConfig: (payload: any) => AxiosInstance.put("/admin/v1/settings", payload),

  // ── Multi-Tenant Priority Model Management & Failover ──
  getAIConfigs: () => AxiosInstance.get("/admin/v1/ai-configs"),
  createAIConfig: (data: any) => AxiosInstance.post("/admin/v1/ai-configs", data),
  updateAIConfig: (id: string, data: any) => AxiosInstance.put(`/admin/v1/ai-configs/${id}`, data),
  setDefaultModel: (id: string) => AxiosInstance.patch(`/admin/v1/ai-configs/${id}/set-default`),
  reorderPriorities: (order: { id: string; priority: number }[]) => AxiosInstance.patch("/admin/v1/ai-configs/reorder", { order }),
  testAIConfig: (id: string) => AxiosInstance.post(`/admin/v1/ai-configs/${id}/test`),
  resetCircuit: (id: string) => AxiosInstance.post(`/admin/v1/ai-configs/${id}/reset-circuit`),
  deleteAIConfig: (id: string) => AxiosInstance.delete(`/admin/v1/ai-configs/${id}`),
};
