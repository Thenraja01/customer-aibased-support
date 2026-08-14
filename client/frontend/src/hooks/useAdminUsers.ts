import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminAPI } from "@/api/admin.api";

export const useAdminUsers = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<{
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    branchId?: string;
  } | undefined>(undefined);
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ["adminUsers", params],
    queryFn: async () => {
      const res = await AdminAPI.getUsers(params);
      return res.data;
    },
    enabled: shouldFetch,
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => AdminAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => AdminAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => AdminAPI.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => AdminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
  });

  const fetchUsers = useCallback(
    async (newParams?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      branchId?: string;
    }) => {
      setParams(newParams);
      setShouldFetch(true);
    },
    []
  );

  const createUser = useCallback(
    async (data: any) => {
      const res = await createUserMutation.mutateAsync(data);
      return res.data;
    },
    [createUserMutation]
  );

  const updateUser = useCallback(
    async (id: string, data: any) => {
      const res = await updateUserMutation.mutateAsync({ id, data });
      return res.data;
    },
    [updateUserMutation]
  );

  const updateUserStatus = useCallback(
    async (id: string, status: string) => {
      const res = await updateUserStatusMutation.mutateAsync({ id, status });
      return res.data;
    },
    [updateUserStatusMutation]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      const res = await deleteUserMutation.mutateAsync(id);
      return res.data;
    },
    [deleteUserMutation]
  );

  return {
    users: usersData?.success ? usersData.data : [],
    userPagination: usersData?.success ? usersData.pagination : null,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
  };
};
