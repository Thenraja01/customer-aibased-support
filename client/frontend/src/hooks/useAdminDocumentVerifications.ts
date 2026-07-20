import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDocumentVerifications, setLoading } from '@/store/adminSlice';
import { DocumentVerificationAPI } from '@/api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminDocumentVerifications() {
  const dispatch = useDispatch<AppDispatch>();
  const { documentVerifications, loading } = useSelector((state: RootState) => state.admin);

  const fetchVerifications = useCallback(async (params?: Record<string, any>) => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentVerificationAPI.getAll(params);
      dispatch(setDocumentVerifications(res.data.data || []));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchVerificationsByStatus = useCallback(async (status: string) => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentVerificationAPI.getByStatus(status);
      dispatch(setDocumentVerifications(res.data.data || []));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const approveVerification = useCallback(async (id: string) => {
    const res = await DocumentVerificationAPI.approve(id);
    return res.data;
  }, []);

  const rejectVerification = useCallback(async (id: string, remarks: string) => {
    const res = await DocumentVerificationAPI.reject(id, remarks);
    return res.data;
  }, []);

  const deleteVerification = useCallback(async (id: string) => {
    const res = await DocumentVerificationAPI.delete(id);
    return res.data;
  }, []);

  return { documentVerifications, verifications: documentVerifications, loading, fetchVerifications, fetchVerificationsByStatus, approveVerification, rejectVerification, deleteVerification };
}
