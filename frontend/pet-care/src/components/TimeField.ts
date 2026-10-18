import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../color';

const toDate = (hhmm: string): Date => {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
const toHHMM = (d: Date): string => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

type TimeFieldProps = {
  label: string,
  value: string,
  onChange: (value: string) => void
}
export default function TimeField({ label, value, onChange }: TimeFieldProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && date) onChange(toHHMM(date));
  };

  return React.createElement(
    View,
    { style: styles.wrap },
    React.createElement(Text, { style: styles.label }, label),
    Platform.OS === 'ios'
      ? React.createElement(DateTimePicker, {
          value: toDate(value),
          mode: 'time',
          display: 'compact',
          onChange: handleChange,
        })
      : React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Pressable,
            {
              style: styles.button,
              onPress: () => setShow(true),
              accessibilityRole: 'button',
              accessibilityLabel: `${label} time, ${value}`,
            },
            React.createElement(Text, { style: styles.value }, value)
          ),
          show &&
            React.createElement(DateTimePicker, {
              value: toDate(value),
              mode: 'time',
              is24Hour: true,
              display: 'default',
              onChange: handleChange,
            })
        )
  )
};

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'flex-start' },
  label: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  button: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  value: { fontSize: 16, color: colors.text, fontWeight: '500' },
});
