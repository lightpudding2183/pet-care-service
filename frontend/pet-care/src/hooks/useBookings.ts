import { useCallback, useState } from 'react';
import { getProviderBookingsRequest, getUserBookingsRequest } from '../api/bookings.api';
import useAuth from './useAuth';

interface Booking {
  id: string | number;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  [key: string]: any;
}

// Loads the logged-in user's bookings: as owner via /users/:userId, as provider via /providers/:providerId
export default function useBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true); // first load only
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchBookings = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      if (!user) return;

      const list = user.role === 'provider'
        ? await getProviderBookingsRequest(user.providerId)
        : await getUserBookingsRequest(user.id);
      setBookings(list);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  return { bookings, loading, refreshing, error, fetchBookings };
}