import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDashboardStats, setLoading } from '@/store/adminSlice';
import { AdminAPI } from '@/api/admin.api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardStats: stats, loading } = useSelector((state: RootState) => state.admin);

  const fetchDashboardData = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await AdminAPI.getDashboardStats();
      dispatch(setDashboardStats(res.data.data));
    } catch {
      // fail silently
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { stats, dashboardStats: stats, loading, fetchDashboardData };
}
