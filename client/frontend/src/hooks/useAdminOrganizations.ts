import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AdminAPI } from "@/api/admin.api";
import {
  setOrganizations,
  setOrgPagination,
  setOrgUsers,
  setOrgUserPagination,
  setLoading,
} from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminOrganizations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { organizations, orgPagination, orgUsers, orgUserPagination, loading } =
    useSelector((state: RootState) => state.admin);

  const fetchOrganizations = useCallback(
    async (params?: { page?: number; limit?: number; search?: string }) => {
      dispatch(setLoading(true));
      try {
        const res = await AdminAPI.getOrganizations(params);
        if (res.data.success) {
          dispatch(setOrganizations(res.data.data));
          dispatch(setOrgPagination(res.data.pagination));
        }
      } catch (error) {
        console.error("Failed to fetch organizations", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const createOrganization = useCallback(
    async (data: any) => {
      const res = await AdminAPI.createOrganization(data);
      return res.data;
    },
    []
  );

  const updateOrganization = useCallback(
    async (id: string, data: any) => {
      const res = await AdminAPI.updateOrganization(id, data);
      return res.data;
    },
    []
  );

  const deleteOrganization = useCallback(async (id: string) => {
    const res = await AdminAPI.deleteOrganization(id);
    return res.data;
  }, []);

  const fetchOrgUsers = useCallback(
    async (
      orgId: string,
      params?: { page?: number; limit?: number }
    ) => {
      dispatch(setLoading(true));
      try {
        const res = await AdminAPI.getOrgUsers(orgId, params);
        if (res.data.success) {
          dispatch(setOrgUsers(res.data.data));
          dispatch(setOrgUserPagination(res.data.pagination));
        }
      } catch (error) {
        console.error("Failed to fetch org users", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return {
    organizations,
    orgPagination,
    orgUsers,
    orgUserPagination,
    loading,
    fetchOrganizations,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    fetchOrgUsers,
  };
};
