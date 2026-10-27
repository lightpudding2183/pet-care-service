import React, { ReactElement } from 'react';
import { StripeProvider as NativeStripeProvider } from '@stripe/stripe-react-native';

type Props = { publishableKey: string; children: ReactElement | ReactElement[] };

export default function StripeProvider({ children, publishableKey }: Props) {
  return <NativeStripeProvider publishableKey={publishableKey}>{children}</NativeStripeProvider>;
}