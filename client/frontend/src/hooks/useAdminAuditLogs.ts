import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdminAPI } from "@/api/admin.api";
import {
  setAuditLogs,
  setLogPagination,
  setLoading,
} from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminAuditLogs = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { auditLogs, logPagination, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchAuditLogs = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      userId?: string;
      action?: string;
      tableName?: string;
      from?: string;
      to?: string;
    }) => {
      dispatch(setLoading(true));
      try {
        const res = await AdminAPI.getAuditLogs(params);
        if (res.data.success) {
          dispatch(setAuditLogs(res.data.data));
          dispatch(setLogPagination(res.data.pagination));
        }
      } catch (error) {
        console.error("Failed to fetch audit logs", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return {
    auditLogs,
    logPagination,
    loading,
    fetchAuditLogs,
  };
};
