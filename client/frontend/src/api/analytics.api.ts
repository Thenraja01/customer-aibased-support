import api from './axiosInstance';

const url = 'analytics/v1';

export const AnalyticsAPI = {
  getDashboardStats: () =>
    api.get(`/${url}/dashboard`),

  getUsageStats: (params?: { start?: string; end?: string }) =>
    api.get(`/${url}/usage`, { params }),

  getResponseTimes: (params?: { start?: string; end?: string }) =>
    api.get(`/${url}/response-times`, { params }),

  getTokenUsage: (params?: { start?: string; end?: string }) =>
    api.get(`/${url}/token-usage`, { params }),

  getSessionAnalytics: (params?: { start?: string; end?: string }) =>
    api.get(`/${url}/sessions`, { params }),

  getAIAnalytics: (params?: { start?: string; end?: string }) =>
    api.get(`/${url}/ai`, { params }),

  exportReport: (params: { type: string; format: string; start?: string; end?: string }) =>
    api.get(`/${url}/export`, { params, responseType: 'blob' }),
};
