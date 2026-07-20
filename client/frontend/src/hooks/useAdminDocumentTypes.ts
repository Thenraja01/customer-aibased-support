import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setDocumentTypes, setLoading } from '@/store/adminSlice';
import { DocumentTypeAPI } from '@/api';
import type { RootState, AppDispatch } from '@/store/store';

export function useAdminDocumentTypes() {
  const dispatch = useDispatch<AppDispatch>();
  const { documentTypes, loading } = useSelector((state: RootState) => state.admin);

  const fetchDocumentTypes = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentTypeAPI.getAll();
      dispatch(setDocumentTypes(res.data.data || []));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const createDocumentType = useCallback(async (data: any) => {
    await DocumentTypeAPI.create(data);
  }, []);

  const updateDocumentType = useCallback(async (id: string, data: any) => {
    await DocumentTypeAPI.update(id, data);
  }, []);

  const deleteDocumentType = useCallback(async (id: string) => {
    await DocumentTypeAPI.remove(id);
  }, []);

  return { documentTypes, loading, fetchDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType };
}
