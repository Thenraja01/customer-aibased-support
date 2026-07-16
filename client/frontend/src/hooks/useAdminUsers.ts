import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdminAPI } from "@/api/admin.api";
import {
  setUsers,
  setUserPagination,
  setLoading,
} from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminUsers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, userPagination, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchUsers = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }) => {
      dispatch(setLoading(true));
      try {
        const res = await AdminAPI.getUsers(params);
        if (res.data.success) {
          dispatch(setUsers(res.data.data));
          dispatch(setUserPagination(res.data.pagination));
        }
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const createUser = useCallback(async (data: any) => {
    const res = await AdminAPI.createUser(data);
    return res.data;
  }, []);

  const updateUser = useCallback(async (id: string, data: any) => {
    const res = await AdminAPI.updateUser(id, data);
    return res.data;
  }, []);

  const updateUserStatus = useCallback(async (id: string, status: string) => {
    const res = await AdminAPI.updateUserStatus(id, status);
    return res.data;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    const res = await AdminAPI.deleteUser(id);
    return res.data;
  }, []);

  return {
    users,
    userPagination,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    updateUserStatus,
    deleteUser,
  };
};
