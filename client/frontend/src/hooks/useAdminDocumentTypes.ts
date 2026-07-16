import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import DocumentTypeAPI from "@/api/documentType.api";
import { setDocumentTypes, setLoading } from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminDocumentTypes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { documentTypes, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchDocumentTypes = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentTypeAPI.getAll();
      if (res.data.success) {
        dispatch(setDocumentTypes(res.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch document types", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const createDocumentType = useCallback(async (data: any) => {
    const res = await DocumentTypeAPI.create(data);
    return res.data;
  }, []);

  const updateDocumentType = useCallback(async (id: string, data: any) => {
    const res = await DocumentTypeAPI.update(id, data);
    return res.data;
  }, []);

  const deleteDocumentType = useCallback(async (id: string) => {
    const res = await DocumentTypeAPI.remove(id);
    return res.data;
  }, []);

  return {
    documentTypes,
    loading,
    fetchDocumentTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
  };
};
