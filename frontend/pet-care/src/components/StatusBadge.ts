import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { STATUS } from '../constants/booking';
import { colors } from '../color';

type BookingStatus = keyof typeof STATUS;

export default function StatusBadge({ status }: { status: BookingStatus | string }) {
  const s = (status in STATUS ? STATUS[status as BookingStatus] : { label: status, bg: colors.surface, fg: colors.textMuted });
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
