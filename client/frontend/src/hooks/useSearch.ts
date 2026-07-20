import { useState, useCallback } from 'react';
import { SearchAPI } from '@/api/search.api';

export function useSearch() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async (query: string, type?: string) => {
    setLoading(true);
    setError('');
    try {
      if (type && type !== 'all') {
        const res = await SearchAPI.globalSearch(query);
        setResults(res.data.data || {});
      } else {
        const res = await SearchAPI.globalSearch(query);
        setResults(res.data.data || {});
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setResults({});
    setError('');
  }, []);

  return { results, loading, error, search, clearSearch };
}
