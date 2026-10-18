import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../color';
import { formatDate, formatTime } from '../utils/dateFormat';

type DateTimeFieldProps = {
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  minimumDate?: Date;
  error?: string;
};
// Date + time editor for one Date value. iOS shows two compact pickers; Android shows
// two buttons that open the native date / time dialogs.
export default function DateTimeField({ label, value, onChange, minimumDate, error }: DateTimeFieldProps) {
  const [androidMode, setAndroidMode] = useState<'date' | 'time' | null>(null);

  const apply = (kind: 'date' | 'time', picked: Date) => {
    const next = new Date(value);
    if (kind === 'date') next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
    else next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
    onChange(next);
  };

  return React.createElement(
    View,
    { style: styles.wrapper },
    React.createElement(Text, { style: styles.label }, label),
    
    Platform.OS === 'ios'
      ? React.createElement(
          View,
          { style: styles.row },
          React.createElement(DateTimePicker, {
            value: value,
            mode: "date",
            display: "compact",
            minimumDate: minimumDate,
            onChange: (_, d) => d && apply('date', d),
          }),
          React.createElement(DateTimePicker, {
            value: value,
            mode: "time",
            display: "compact",
            onChange: (_, d) => d && apply('time', d),
          })
        )
      : React.createElement(
          View,
          { style: styles.row },
          React.createElement(
            Pressable,
            {
              style: styles.button,
              onPress: () => setAndroidMode('date'),
              accessibilityRole: "button",
              accessibilityLabel: `${label} date, ${formatDate(value)}`,
            },
            React.createElement(Text, { style: styles.value }, formatDate(value))
          ),
          React.createElement(
            Pressable,
            {
              style: styles.button,
              onPress: () => setAndroidMode('time'),
              accessibilityRole: "button",
              accessibilityLabel: `${label} time, ${formatTime(value)}`,
            },
            React.createElement(Text, { style: styles.value }, formatTime(value))
          ),
          
          androidMode &&
            React.createElement(DateTimePicker, {
              value: value,
              mode: androidMode,
              is24Hour: true,
              minimumDate: androidMode === 'date' ? minimumDate : undefined,
              onChange: (event, d) => {
                const kind = androidMode;
                setAndroidMode(null);
                if (event.type === 'set' && d) apply(kind, d);
              },
            })
        ),

    !!error && React.createElement(Text, { style: styles.error }, error)
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  button: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  value: { fontSize: 16, color: colors.text, fontWeight: '500' },
  error: { color: colors.error, fontSize: 13, marginTop: 6 },
});