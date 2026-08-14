import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAPI } from "@/api/admin.api";

export const useAdminOrganizations = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<{ page?: number; limit?: number; search?: string } | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);

  const [orgUsersParams, setOrgUsersParams] = useState<{ orgId: string; page?: number; limit?: number } | null>(null);

  const { data: orgsData, isLoading: orgsLoading } = useQuery({
    queryKey: ["adminOrganizations", params],
    queryFn: async () => {
      const res = await AdminAPI.getOrganizations(params);
      return res.data;
    },
    enabled: shouldFetch,
  });

  const { data: orgUsersData, isLoading: orgUsersLoading } = useQuery({
    queryKey: ["adminOrgUsers", orgUsersParams],
    queryFn: async () => {
      if (!orgUsersParams) return null;
      const { orgId, ...rest } = orgUsersParams;
      const res = await AdminAPI.getOrgUsers(orgId, rest);
      return res.data;
    },
    enabled: orgUsersParams !== null,
  });

  const createOrgMutation = useMutation({
    mutationFn: (data: any) => AdminAPI.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => AdminAPI.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id: string) => AdminAPI.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrganizations"] });
    },
  });

  const fetchOrganizations = useCallback(
    async (newParams?: { page?: number; limit?: number; search?: string }) => {
      setParams(newParams);
      setShouldFetch(true);
    },
    []
  );

  const fetchOrgUsers = useCallback(
    async (orgId: string, params?: { page?: number; limit?: number }) => {
      setOrgUsersParams({ orgId, ...params });
    },
    []
  );

  const createOrganization = useCallback(
    async (data: any) => {
      const res = await createOrgMutation.mutateAsync(data);
      return res.data;
    },
    [createOrgMutation]
  );

  const updateOrganization = useCallback(
    async (id: string, data: any) => {
      const res = await updateOrgMutation.mutateAsync({ id, data });
      return res.data;
    },
    [updateOrgMutation]
  );

  const deleteOrganization = useCallback(
    async (id: string) => {
      const res = await deleteOrgMutation.mutateAsync(id);
      return res.data;
    },
    [deleteOrgMutation]
  );

  return {
    organizations: orgsData?.success ? orgsData.data : [],
    orgPagination: orgsData?.success ? orgsData.pagination : null,
    orgUsers: orgUsersData?.success ? orgUsersData.data : [],
    orgUserPagination: orgUsersData?.success ? orgUsersData.pagination : null,
    loading: orgsLoading || orgUsersLoading,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchOrgUsers,
  };
};
