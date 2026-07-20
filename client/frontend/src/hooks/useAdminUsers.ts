import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUsers, setUserPagination, setLoading } from '@/store/adminSlice';
import { AdminAPI } from '@/api/admin.api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminUsers() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, userPagination, loading } = useSelector((state: RootState) => state.admin);

  const fetchUsers = useCallback(async (params?: Record<string, any>) => {
    dispatch(setLoading(true));
    try {
      const res = await AdminAPI.getUsers(params);
      dispatch(setUsers(res.data.data || []));
      if (res.data.pagination) {
        dispatch(setUserPagination(res.data.pagination));
      }
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

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

  return { users, userPagination, pagination: userPagination, loading, fetchUsers, createUser, updateUser, updateUserStatus, deleteUser };
}
