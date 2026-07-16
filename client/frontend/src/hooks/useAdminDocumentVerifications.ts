import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import DocumentVerificationAPI from "@/api/documentVerification.api";
import { setDocumentVerifications, setLoading } from "@/store/adminSlice";
import type { RootState, AppDispatch } from "@/store/store";

export const useAdminDocumentVerifications = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { documentVerifications, loading } = useSelector(
    (state: RootState) => state.admin
  );

  const fetchVerifications = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const res = await DocumentVerificationAPI.getAll();
      if (res.data.success) {
        dispatch(setDocumentVerifications(res.data.data));
      }
    } catch (error) {
      console.error("Failed to fetch verifications", error);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const fetchVerificationsByStatus = useCallback(
    async (status: string) => {
      dispatch(setLoading(true));
      try {
        const res = await DocumentVerificationAPI.getByStatus(status);
        if (res.data.success) {
          dispatch(setDocumentVerifications(res.data.data));
        }
      } catch (error) {
        console.error("Failed to fetch verifications by status", error);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const approveVerification = useCallback(async (id: string) => {
    const res = await DocumentVerificationAPI.approve(id);
    return res.data;
  }, []);

  const rejectVerification = useCallback(
    async (id: string, remarks: string) => {
      const res = await DocumentVerificationAPI.reject(id, remarks);
      return res.data;
    },
    []
  );

  const deleteVerification = useCallback(async (id: string) => {
    const res = await DocumentVerificationAPI.remove(id);
    return res.data;
  }, []);

  return {
    documentVerifications,
    loading,
    fetchVerifications,
    fetchVerificationsByStatus,
    approveVerification,
    rejectVerification,
    deleteVerification,
  };
};
