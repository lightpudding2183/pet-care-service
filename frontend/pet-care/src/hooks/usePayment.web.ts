import { useCallback } from 'react';

export default function usePayment() {
  const pay = useCallback(async (_bookingId: string) => {
    throw new Error('Payments are not available on web. Please use the iOS or Android app.');
  }, []);

  return { pay, step: 'idle' as const };
}