import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export function useAnalytics() {
  const { dashboardStats, usageStats, responseTimes, tokenUsage, sessionAnalytics, aiAnalytics, loading, error } =
    useSelector((state: RootState) => state.analytics);

  return {
    dashboardStats,
    usageStats,
    responseTimes,
    tokenUsage,
    sessionAnalytics,
    aiAnalytics,
    loading,
    error,
  };
}
