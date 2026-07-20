import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/slices';
import type { RootState, AppDispatch } from '@/store/store';
import { UsersAPI } from '@/api/user.api';

export function useUser() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.user);

  const updateProfile = useCallback(async (data: any) => {
    const res = await UsersAPI.updateProfile(data);
    dispatch(updateUser(res.data.data));
    return res.data;
  }, [dispatch]);

  const uploadAvatar = useCallback(async (formData: FormData) => {
    const res = await UsersAPI.uploadAvatar(formData);
    dispatch(updateUser({ avatar_url: res.data.data.avatar_url } as any) as any);
    return res.data;
  }, [dispatch]);

  const getActivityLogs = useCallback(async () => {
    const res = await UsersAPI.getActivityLogs();
    return res.data;
  }, []);

  return { user, updateProfile, uploadAvatar, getActivityLogs };
}
