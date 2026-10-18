import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getPaymentsRequest } from '../api/payments.api';

interface Payment {
  id: string;
  bookingId: string | number;
  status: string;
  createdAt: string;
}
// Finds the payment for one booking by filtering the payment history, so it doesn't
// depend on the booking object carrying payment info. Prefers a paid payment, else the latest.
export default function usePaymentForBooking(bookingId: string | number, enabled = true) {
  const [payment, setPayment] = useState<Payment | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      let active = true;
      getPaymentsRequest()
        .then((list) => {
          if (!active) return;
          const mine = list
            .filter((p: { bookingId: string | number }) => String(p.bookingId) === String(bookingId))
            .sort((a: { createdAt: string }, b: { createdAt: string }) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          setPayment(mine.find((p: { status: string }) => p.status === 'paid') ?? mine[0] ?? null);
        })
        .catch(() => {}); // payment info is secondary on the booking screen
      return () => { active = false; };
    }, [bookingId, enabled])
  );

  return payment;
}