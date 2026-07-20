import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AnalyticsAPI } from '@/api/analytics.api';
import type { DashboardStats, UsageStats, ResponseTimeStats, TokenUsage, SessionAnalytics, AIAnalytics } from '@/types/analytics.types';

interface AnalyticsState {
  dashboardStats: DashboardStats | null;
  usageStats: UsageStats[];
  responseTimes: ResponseTimeStats[];
  tokenUsage: TokenUsage[];
  sessionAnalytics: SessionAnalytics | null;
  aiAnalytics: AIAnalytics | null;
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  dashboardStats: null,
  usageStats: [],
  responseTimes: [],
  tokenUsage: [],
  sessionAnalytics: null,
  aiAnalytics: null,
  loading: false,
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  'analytics/dashboard',
  async () => {
    const res = await AnalyticsAPI.getDashboardStats();
    return res.data.data;
  }
);

export const fetchUsageStats = createAsyncThunk(
  'analytics/usage',
  async (params?: { start?: string; end?: string }) => {
    const res = await AnalyticsAPI.getUsageStats(params);
    return res.data.data;
  }
);

export const fetchResponseTimes = createAsyncThunk(
  'analytics/responseTimes',
  async (params?: { start?: string; end?: string }) => {
    const res = await AnalyticsAPI.getResponseTimes(params);
    return res.data.data;
  }
);

export const fetchTokenUsage = createAsyncThunk(
  'analytics/tokenUsage',
  async (params?: { start?: string; end?: string }) => {
    const res = await AnalyticsAPI.getTokenUsage(params);
    return res.data.data;
  }
);

export const fetchSessionAnalytics = createAsyncThunk(
  'analytics/sessions',
  async (params?: { start?: string; end?: string }) => {
    const res = await AnalyticsAPI.getSessionAnalytics(params);
    return res.data.data;
  }
);

export const fetchAIAnalytics = createAsyncThunk(
  'analytics/ai',
  async (params?: { start?: string; end?: string }) => {
    const res = await AnalyticsAPI.getAIAnalytics(params);
    return res.data.data;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUsageStats.fulfilled, (state, action) => {
        state.usageStats = action.payload;
      })
      .addCase(fetchResponseTimes.fulfilled, (state, action) => {
        state.responseTimes = action.payload;
      })
      .addCase(fetchTokenUsage.fulfilled, (state, action) => {
        state.tokenUsage = action.payload;
      })
      .addCase(fetchSessionAnalytics.fulfilled, (state, action) => {
        state.sessionAnalytics = action.payload;
      })
      .addCase(fetchAIAnalytics.fulfilled, (state, action) => {
        state.aiAnalytics = action.payload;
      });
  },
});

export const { clearAnalyticsError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
