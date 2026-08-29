import { apiClient } from "@/services/api";

export const analyticsApi = {
  getOverview: (params?: any) => apiClient.get("/admin/v1/analytics/overview", { params }),
  getAiPerformance: (params?: any) => apiClient.get("/admin/v1/analytics/ai-performance", { params }),
  getSlaMetrics: (params?: any) => apiClient.get("/admin/v1/analytics/sla", { params }),
  getTicketStats: () => apiClient.get("/tickets/stats"),
};

export default analyticsApi;
