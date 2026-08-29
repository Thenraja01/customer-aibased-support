import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DocumentVerificationAPI from "@/api/documentVerification.api";

export const useAdminDocumentVerifications = () => {
  const queryClient = useQueryClient();
  const [statusParam, setStatusParam] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: verificationsData, isLoading: loading } = useQuery({
    queryKey: ["adminDocumentVerifications", statusParam],
    queryFn: async () => {
      if (statusParam) {
        const res = await DocumentVerificationAPI.getByStatus(statusParam);
        return res.data;
      }
      const res = await DocumentVerificationAPI.getAll();
      return res.data;
    },
    enabled: shouldFetch,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => DocumentVerificationAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocumentVerifications"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks: string }) =>
      DocumentVerificationAPI.reject(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocumentVerifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DocumentVerificationAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocumentVerifications"] });
    },
  });

  const fetchVerifications = useCallback(async () => {
    setStatusParam(null);
    setShouldFetch(true);
  }, []);

  const fetchVerificationsByStatus = useCallback(async (status: string) => {
    setStatusParam(status);
    setShouldFetch(true);
  }, []);

  const approveVerification = useCallback(
    async (id: string) => {
      const res = await approveMutation.mutateAsync(id);
      return res.data;
    },
    [approveMutation]
  );

  const rejectVerification = useCallback(
    async (id: string, remarks: string) => {
      const res = await rejectMutation.mutateAsync({ id, remarks });
      return res.data;
    },
    [rejectMutation]
  );

  const deleteVerification = useCallback(
    async (id: string) => {
      const res = await deleteMutation.mutateAsync(id);
      return res.data;
    },
    [deleteMutation]
  );

  return {
    documentVerifications: verificationsData?.success ? verificationsData.data : [],
    loading,
    fetchVerifications,
    fetchVerificationsByStatus,
    approveVerification,
    rejectVerification,
    deleteVerification,
  };
};
