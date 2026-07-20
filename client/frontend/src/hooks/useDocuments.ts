import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export function useDocuments() {
  const { documents, documentTypes, documentVerifications, loading, uploading, error, pagination } =
    useSelector((state: RootState) => state.documents);

  return {
    documents,
    documentTypes,
    documentVerifications,
    loading,
    uploading,
    error,
    pagination,
  };
}
