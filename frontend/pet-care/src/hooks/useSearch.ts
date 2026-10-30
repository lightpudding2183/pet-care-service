import { useState, useCallback } from 'react';
import { searchProvidersRequest } from '../api/providers.api';

export const useSearch = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(
    async (filters = {}) => {
      setLoading(true);
      setError('');
      try {
        const result = await searchProvidersRequest(filters);
        setProviders(result.providers ?? []);
      } catch (e: any) {
        setError(e.message ?? 'Error searching providers');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const triggerRefresh = useCallback((filters = {}) => {
    setRefreshing(true);
    search(filters).finally(() => setRefreshing(false));
  }, [search]);

  return {
    providers,
    loading,
    refreshing,
    error,
    searchProviders: search,
    triggerRefresh,
  };
};