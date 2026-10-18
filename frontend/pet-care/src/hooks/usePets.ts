import { useCallback, useState } from 'react';
import { deletePetRequest, listPetsRequest } from '../api/pets.api';

type Pet = {
  id: number | string;
  [key: string]: unknown;
};

export default function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true); // first load only
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPets = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      setPets(await listPetsRequest());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const removePet = useCallback(async (id = null) => {
    if (!id) return;
    await deletePetRequest(id);
    setPets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { pets, loading, refreshing, error, fetchPets, removePet };
}