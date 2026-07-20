import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOrganizations, setOrgPagination, setOrgUsers, setLoading } from '@/store/adminSlice';
import { AdminAPI } from '@/api/admin.api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminOrganizations() {
  const dispatch = useDispatch<AppDispatch>();
  const { organizations, orgPagination, orgUsers, loading } = useSelector((state: RootState) => state.admin);

  const fetchOrganizations = useCallback(async (params?: Record<string, any>) => {
    dispatch(setLoading(true));
    try {
      const res = await AdminAPI.getOrganizations(params);
      dispatch(setOrganizations(res.data.data || []));
      if (res.data.pagination) {
        dispatch(setOrgPagination(res.data.pagination));
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const createOrganization = useCallback(async (data: any) => {
    const res = await AdminAPI.createOrganization(data);
    return res.data;
  }, []);

  const updateOrganization = useCallback(async (id: string, data: any) => {
    const res = await AdminAPI.updateOrganization(id, data);
    return res.data;
  }, []);

  const deleteOrganization = useCallback(async (id: string) => {
    const res = await AdminAPI.deleteOrganization(id);
    return res.data;
  }, []);

  const fetchOrgUsers = useCallback(async (id: string, params?: Record<string, any>) => {
    const res = await AdminAPI.getOrgUsers(id, params);
    dispatch(setOrgUsers(res.data.data || []));
    return res.data;
  }, [dispatch]);

  return { organizations, orgPagination, pagination: orgPagination, loading, fetchOrganizations, createOrganization, updateOrganization, deleteOrganization, fetchOrgUsers, orgUsers };
}
