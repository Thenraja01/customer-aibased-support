import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuditLogs, setLogPagination, setLoading } from '@/store/adminSlice';
import { AdminAPI } from '@/api/admin.api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminAuditLogs() {
  const dispatch = useDispatch<AppDispatch>();
  const { auditLogs, logPagination, loading } = useSelector((state: RootState) => state.admin);

  const fetchLogs = useCallback(async (params?: Record<string, any>) => {
    dispatch(setLoading(true));
    try {
      const res = await AdminAPI.getAuditLogs(params);
      dispatch(setAuditLogs(res.data.data || []));
      if (res.data.pagination) {
        dispatch(setLogPagination(res.data.pagination));
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchAuditLogs = fetchLogs;

  return { auditLogs, logPagination, logs: auditLogs, pagination: logPagination, loading, fetchLogs, fetchAuditLogs };
}
