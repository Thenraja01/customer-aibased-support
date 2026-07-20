import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDocuments, setDocumentTypes, setDocumentVerifications, setLoading } from '@/store/adminSlice';
import { DocumentAPI, DocumentTypeAPI, DocumentVerificationAPI } from '@/api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminDocuments() {
  const dispatch = useDispatch<AppDispatch>();
  const { documents, loading } = useSelector((state: RootState) => state.admin);

  const fetchDocuments = useCallback(async (params?: Record<string, any>) => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentAPI.getAll(params);
      dispatch(setDocuments(res.data.data || []));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const res = await DocumentTypeAPI.getAll();
      dispatch(setDocumentTypes(res.data.data || []));
    } catch {
      // fail silently
    }
  }, [dispatch]);

  const fetchVerifications = useCallback(async (params?: Record<string, any>) => {
    try {
      const res = await DocumentVerificationAPI.getAll(params);
      dispatch(setDocumentVerifications(res.data.data || []));
    } catch {
      // fail silently
    }
  }, [dispatch]);

  const fetchDocumentsByStatus = useCallback(async (status: string) => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentAPI.getByStatus(status);
      dispatch(setDocuments(res.data.data || []));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const uploadDocument = useCallback(async (formData: FormData) => {
    const res = await DocumentAPI.upload(formData);
    return res.data;
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    const res = await DocumentAPI.delete(id);
    return res.data;
  }, []);

  return { documents, loading, fetchDocuments, fetchDocumentTypes, fetchVerifications, fetchDocumentsByStatus, uploadDocument, deleteDocument };
}
