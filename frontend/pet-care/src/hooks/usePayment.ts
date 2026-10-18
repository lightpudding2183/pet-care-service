import { useCallback, useState } from 'react';
import { PaymentSheetError, useStripe } from '@stripe/stripe-react-native';
import { createPaymentRequest, getPaymentRequest } from '../api/payments.api';
import { MERCHANT_NAME } from '../config';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// The webhook, not the app, marks a payment paid. After the sheet succeeds, poll
// briefly until the server has caught up.
async function waitForSettled(paymentId: string) {
  let latest = null;
  for (let i = 0; i < 6; i += 1) {
    latest = await getPaymentRequest(paymentId);
    if (latest.status !== 'pending') return latest;
    await sleep(1500);
  }
  return latest;
}

// Everything Stripe-specific lives in this hook. If you change gateway, only this file changes.
// pay() resolves to { outcome: 'paid' | 'processing' | 'canceled', payment } or throws an Error.
export default function usePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [step, setStep] = useState('idle'); // 'idle' | 'creating' | 'paying' | 'confirming'

  const pay = useCallback(async (bookingId: string) => {
    try {
      setStep('creating');
      const payment = await createPaymentRequest({ bookingId });
      if (payment.status === 'paid') return { outcome: 'paid', payment }; // server says it's already settled

      setStep('paying');
      const init = await initPaymentSheet({
        paymentIntentClientSecret: payment.clientSecret,
        merchantDisplayName: MERCHANT_NAME,
      });
      if (init.error) throw new Error(init.error.message);

      const result = await presentPaymentSheet();
      if (result.error) {
        if (result.error.code === PaymentSheetError.Canceled) return { outcome: 'canceled', payment };
        throw new Error(result.error.message);
      }

      setStep('confirming');
      const settled = await waitForSettled(payment.id);
      return { outcome: settled.status === 'paid' ? 'paid' : 'processing', payment: settled };
    } finally {
      setStep('idle');
    }
  }, [initPaymentSheet, presentPaymentSheet]);

  return { pay, step };
}