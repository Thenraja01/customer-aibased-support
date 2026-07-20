import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';

export function useDocumentVerifications() {
  const { documentVerifications } = useSelector((state: RootState) => state.documents);
  return { documentVerifications };
}
