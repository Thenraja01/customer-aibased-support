import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DocumentAPI from "@/api/document.api";

export const useAdminDocuments = () => {
  const queryClient = useQueryClient();
  const [statusParam, setStatusParam] = useState<string | null>(null);
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: documentsData, isLoading: loading } = useQuery({
    queryKey: ["adminDocuments", statusParam],
    queryFn: async () => {
      if (statusParam) {
        const res = await DocumentAPI.getByStatus(statusParam);
        return res.data;
      }
      const res = await DocumentAPI.getAll();
      return res.data;
    },
    enabled: shouldFetch,
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => DocumentAPI.upload(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      DocumentAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DocumentAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocuments"] });
    },
  });

  const fetchDocuments = useCallback(async () => {
    setStatusParam(null);
    setShouldFetch(true);
  }, []);

  const fetchDocumentsByStatus = useCallback(async (status: string) => {
    setStatusParam(status);
    setShouldFetch(true);
  }, []);

  const uploadDocument = useCallback(
    async (formData: FormData) => {
      const res = await uploadMutation.mutateAsync(formData);
      return res.data;
    },
    [uploadMutation]
  );

  const updateDocumentStatus = useCallback(
    async (id: string, status: string) => {
      const res = await updateStatusMutation.mutateAsync({ id, status });
      return res.data;
    },
    [updateStatusMutation]
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const res = await deleteMutation.mutateAsync(id);
      return res.data;
    },
    [deleteMutation]
  );

  return {
    documents: documentsData?.success ? documentsData.data : [],
    loading,
    fetchDocuments,
    fetchDocumentsByStatus,
    uploadDocument,
    updateDocumentStatus,
    deleteDocument,
  };
};
