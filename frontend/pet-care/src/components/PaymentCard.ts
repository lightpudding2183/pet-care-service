import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../color';
import { formatDateTime } from '../utils/dateFormat';
import { formatMoney } from '../utils/money';
import { bookingService } from '../utils/bookingDisplay';
import PaymentStatusBadge from './PaymentStatusBadge';

export default function PaymentCard({ payment, onPress }: { payment: any; onPress: () => void }) {
  const title = payment.booking ? bookingService(payment.booking) : `Booking #${payment.bookingId}`;
  const amount = formatMoney(payment.amount, payment.currency);
  return React.createElement(
    Pressable,
    {
      onPress: onPress,
      style: ({ pressed }) => [styles.card, pressed && styles.pressed],
      accessibilityRole: "button",
      accessibilityLabel: `${title}, ${amount}, ${payment.status}`,
    },
    React.createElement(
      View,
      { style: styles.info },
      React.createElement(
        Text,
        { style: styles.title, numberOfLines: 1 },
        title
      ),
      React.createElement(
        Text,
        { style: styles.date },
        formatDateTime(payment.createdAt)
      )
    ),
    React.createElement(
      View,
      { style: styles.right },
      React.createElement(
        Text,
        { style: styles.amount },
        amount
      ),
      React.createElement(
        PaymentStatusBadge,
        { status: payment.status }
      )
    )
  );

}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  info: { flex: 1, marginRight: 12 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 16, fontWeight: '700', color: colors.text },
});