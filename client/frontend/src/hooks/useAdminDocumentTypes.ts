import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DocumentTypeAPI from "@/api/documentType.api";

export const useAdminDocumentTypes = () => {
  const queryClient = useQueryClient();
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data: documentTypesData, isLoading: loading } = useQuery({
    queryKey: ["adminDocumentTypes"],
    queryFn: async () => {
      const res = await DocumentTypeAPI.getAll();
      return res.data;
    },
    enabled: shouldFetch,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => DocumentTypeAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocumentTypes"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => DocumentTypeAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocumentTypes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => DocumentTypeAPI.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDocumentTypes"] });
    },
  });

  const fetchDocumentTypes = useCallback(async () => {
    setShouldFetch(true);
  }, []);

  const createDocumentType = useCallback(
    async (data: any) => {
      const res = await createMutation.mutateAsync(data);
      return res.data;
    },
    [createMutation]
  );

  const updateDocumentType = useCallback(
    async (id: string, data: any) => {
      const res = await updateMutation.mutateAsync({ id, data });
      return res.data;
    },
    [updateMutation]
  );

  const deleteDocumentType = useCallback(
    async (id: string) => {
      const res = await deleteMutation.mutateAsync(id);
      return res.data;
    },
    [deleteMutation]
  );

  return {
    documentTypes: documentTypesData?.success ? documentTypesData.data : [],
    loading,
    fetchDocumentTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
  };
};
