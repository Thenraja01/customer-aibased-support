import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminAPI } from "@/api/admin.api";

export const useAdminDashboard = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const res = await AdminAPI.getDashboardStats();
      return res.data;
    },
  });

  const fetchStats = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
  }, [queryClient]);

  return { 
    dashboardStats: data?.success ? data.data : null, 
    loading: isLoading, 
    refetch: fetchStats 
  };
};
