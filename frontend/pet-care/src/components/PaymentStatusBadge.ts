import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../color';
import { PAYMENT_STATUS } from '@/constants/payment';

type PaymentStatus = keyof typeof PAYMENT_STATUS;

export default function PaymentStatusBadge({ status }: { status: PaymentStatus | string }) {
  const s = (status in PAYMENT_STATUS ? PAYMENT_STATUS[status as PaymentStatus] : { label: status, bg: colors.surface, fg: colors.textMuted });
  return React.createElement(
    View,
    { style: [styles.badge, { backgroundColor: s.bg }] },
    React.createElement(Text, { style: [styles.text, { color: s.fg }] }, s.label)
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  text: { fontSize: 12, fontWeight: '700' },
});