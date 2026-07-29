import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdminAPI } from "@/api/admin.api";
import {
  setRoles,
  setRolePagination,
  setLoading,
} from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminRoles = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, rolePagination, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchRoles = useCallback(
    async (params?: { page?: number; limit?: number }) => {
      dispatch(setLoading(true));
      try {
        const res = await AdminAPI.getRoles(params);
        if (res.data.success) {
          dispatch(setRoles(res.data.data));
          dispatch(setRolePagination(res.data.pagination));
        }
      } catch (error) {
        console.error("Failed to fetch roles", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const createRole = useCallback(async (data: any) => {
    const res = await AdminAPI.createRole(data);
    return res.data;
  }, []);

  const updateRole = useCallback(async (id: string, data: any) => {
    const res = await AdminAPI.updateRole(id, data);
    return res.data;
  }, []);

  const deleteRole = useCallback(async (id: string) => {
    const res = await AdminAPI.deleteRole(id);
    return res.data;
  }, []);

  return {
    roles,
    rolePagination,
    loading,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};
