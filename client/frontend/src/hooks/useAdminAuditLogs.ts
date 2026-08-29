import { useCallback, useState } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { AdminAPI, AuditLogEntry, AuditLogFilters, PaginatedResponse } from "@/api/admin.api";

export interface UseAdminAuditLogsOptions extends Partial<UseQueryOptions<PaginatedResponse<AuditLogEntry>, Error>> {
  initialParams?: AuditLogFilters;
}

export interface UseAdminAuditLogsReturn {
  auditLogs: AuditLogEntry[];
  logPagination: PaginatedResponse<AuditLogEntry>["pagination"] | null;
  loading: boolean;
  error: Error | null;
  fetchAuditLogs: (newParams?: AuditLogFilters) => void;
  setPage: (page: number) => void;
  params: AuditLogFilters;
}

export const useAdminAuditLogs = (options: UseAdminAuditLogsOptions = {}): UseAdminAuditLogsReturn => {
  const { initialParams = {} } = options;
  const [params, setParams] = useState<AuditLogFilters>({
    page: 1,
    limit: 20,
    ...initialParams,
  });
  const [shouldFetch, setShouldFetch] = useState(false);

  const query = useQuery<PaginatedResponse<AuditLogEntry>, Error>({
    queryKey: ["adminAuditLogs", params],
    queryFn: async () => {
      const res = await AdminAPI.getAuditLogs(params);
      const payload = res?.data?.success !== undefined ? res.data : res;
      if (!payload?.success) {
        throw new Error(payload?.message || "Failed to fetch audit logs");
      }
      return payload;
    },
    enabled: shouldFetch,
    ...options,
  });

  const fetchAuditLogs = useCallback(
    (newParams?: AuditLogFilters) => {
      setParams((prev) => ({
        ...prev,
        ...newParams,
        page: newParams?.page ?? 1,
      }));
      setShouldFetch(true);
    },
    []
  );

  const setPage = useCallback(
    (page: number) => {
      setParams((prev) => ({ ...prev, page }));
      setShouldFetch(true);
    },
    []
  );

  return {
    auditLogs: query.data?.success ? query.data.data : [],
    logPagination: query.data?.success ? query.data.pagination : null,
    loading: query.isLoading,
    error: query.error,
    fetchAuditLogs,
    setPage,
    params,
  };
};