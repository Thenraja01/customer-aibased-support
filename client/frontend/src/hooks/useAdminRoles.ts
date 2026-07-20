import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRoles, setRolePagination, setLoading } from '@/store/adminSlice';
import { AdminAPI } from '@/api/admin.api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminRoles() {
  const dispatch = useDispatch<AppDispatch>();
  const { roles, rolePagination, loading } = useSelector((state: RootState) => state.admin);

  const fetchRoles = useCallback(async (params?: Record<string, any>) => {
    dispatch(setLoading(true));
    try {
      const res = await AdminAPI.getRoles(params);
      dispatch(setRoles(res.data.data || []));
      if (res.data.pagination) {
        dispatch(setRolePagination(res.data.pagination));
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

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

  return { roles, pagination: rolePagination, loading, fetchRoles, createRole, updateRole, deleteRole };
}
