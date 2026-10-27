import React, { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ publishableKey: string }>;

export default function StripeProvider({ children }: Props) {
  return <>{children}</>;
}