import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { colors } from '../color';
import { formatRange } from '../utils/dateFormat';
import { bookingService, counterpartAvatar, counterpartName, petName } from '../utils/bookingDisplay';
import StatusBadge from './StatusBadge';

export default function BookingCard({ booking, role, onPress }: { booking: any; role: string; onPress: () => void }) {
  const who = counterpartName(booking, role);
  return React.createElement(
    Pressable,
    {
      onPress: onPress,
      style: ({ pressed }) => [styles.card, pressed && styles.pressed],
      accessibilityRole: "button",
      accessibilityLabel: `${bookingService(booking)} with ${who}, ${booking.status}`,
    },
    React.createElement(Avatar, {
      uri: counterpartAvatar(booking, role),
      name: who,
      size: 48,
    }),
    React.createElement(
      View,
      { style: styles.info },
      React.createElement(
        Text,
        { style: styles.service, numberOfLines: 1 },
        bookingService(booking)
      ),
      React.createElement(
        Text,
        { style: styles.sub, numberOfLines: 1 },
        `${who} · ${petName(booking)}`
      ),
      React.createElement(
        Text,
        { style: styles.when, numberOfLines: 2 },
        formatRange(booking.scheduledStart, booking.scheduledEnd)
      )
    ),
    React.createElement(StatusBadge, { status: booking.status })
  );

}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start', padding: 14, marginBottom: 12,
    borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  info: { flex: 1, marginHorizontal: 12 },
  service: { fontSize: 16, fontWeight: '600', color: colors.text },
  sub: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
  when: { fontSize: 13, color: colors.text, marginTop: 6 },
});