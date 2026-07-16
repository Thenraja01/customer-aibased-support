import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import DocumentAPI from "@/api/document.api";
import { setDocuments, setLoading } from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminDocuments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { documents, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchDocuments = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentAPI.getAll();
      if (res.data.success) {
        dispatch(setDocuments(res.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchDocumentsByStatus = useCallback(
    async (status: string) => {
      dispatch(setLoading(true));
      try {
        const res = await DocumentAPI.getByStatus(status);
        if (res.data.success) {
          dispatch(setDocuments(res.data.data));
        }
      } catch (error) {
        console.error("Failed to fetch documents by status", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const uploadDocument = useCallback(async (formData: FormData) => {
    const res = await DocumentAPI.upload(formData);
    return res.data;
  }, []);

  const updateDocumentStatus = useCallback(
    async (id: string, status: string) => {
      const res = await DocumentAPI.updateStatus(id, status);
      return res.data;
    },
    []
  );

  const deleteDocument = useCallback(async (id: string) => {
    const res = await DocumentAPI.remove(id);
    return res.data;
  }, []);

  return {
    documents,
    loading,
    fetchDocuments,
    fetchDocumentsByStatus,
    uploadDocument,
    updateDocumentStatus,
    deleteDocument,
  };
};
