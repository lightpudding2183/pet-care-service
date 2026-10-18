import { useCallback, useState } from 'react';
import { getPaymentsRequest } from '../api/payments.api';

interface Payment {
  id: string | number;
  amount: string | number;
  currency: string;
  status: string;
  createdAt: string;
  [key: string]: any;
}

export default function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true); // first load only
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPayments = useCallback(async ({ refresh = false } = {}) => {
    if (refresh) setRefreshing(true);
    try {
      setPayments(await getPaymentsRequest());
      setError('');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  return { payments, loading, refreshing, error, fetchPayments };
}