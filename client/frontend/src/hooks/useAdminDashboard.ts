import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdminAPI } from "@/api/admin.api";
import {
  setDashboardStats,
  setLoading,
} from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { dashboardStats, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchStats = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await AdminAPI.getDashboardStats();
      if (res.data.success) {
        dispatch(setDashboardStats(res.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { dashboardStats, loading, refetch: fetchStats };
};
