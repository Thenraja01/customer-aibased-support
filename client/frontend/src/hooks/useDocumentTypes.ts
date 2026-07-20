import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export function useDocumentTypes() {
  const { documentTypes } = useSelector((state: RootState) => state.documents);
  return { documentTypes };
}
