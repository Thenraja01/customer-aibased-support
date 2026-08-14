import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAPI } from "@/api/admin.api";

export const useAdminRoles = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<{ page?: number; limit?: number } | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: rolesData, isLoading: loading } = useQuery({
    queryKey: ["adminRoles", params],
    queryFn: async () => {
      const res = await AdminAPI.getRoles(params);
      return res.data;
    },
    enabled: shouldFetch,
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: any) => AdminAPI.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminRoles"] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => AdminAPI.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminRoles"] });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => AdminAPI.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminRoles"] });
    },
  });

  const fetchRoles = useCallback(
    async (newParams?: { page?: number; limit?: number }) => {
      setParams(newParams);
      setShouldFetch(true);
    },
    []
  );

  const createRole = useCallback(
    async (data: any) => {
      const res = await createRoleMutation.mutateAsync(data);
      return res.data;
    },
    [createRoleMutation]
  );

  const updateRole = useCallback(
    async (id: string, data: any) => {
      const res = await updateRoleMutation.mutateAsync({ id, data });
      return res.data;
    },
    [updateRoleMutation]
  );

  const deleteRole = useCallback(
    async (id: string) => {
      const res = await deleteRoleMutation.mutateAsync(id);
      return res.data;
    },
    [deleteRoleMutation]
  );

  return {
    roles: rolesData?.success ? rolesData.data : [],
    rolePagination: rolesData?.success ? rolesData.pagination : null,
    loading,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};
