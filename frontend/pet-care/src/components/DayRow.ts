import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '../color';
import TimeField from './TimeField';

type DayRowProps = {
  label: string,
  day: { enabled: boolean, start: string, end: string },
  error?: string,
  onChange: (patch: { enabled?: boolean, start?: string, end?: string }) => void
}
export default function DayRow({ label, day, error, onChange }: DayRowProps) {
  return React.createElement(
    View, { style: styles.row },
    React.createElement(View, { style: styles.top },
      React.createElement(Text, {style: styles.label}, label),
      React.createElement(Switch, {
        value: day.enabled,
        onValueChange: (enabled) => onChange({ enabled }),
        trackColor: { true: colors.primary, false: colors.border },
        accessibilityLabel: `${label} available`
      }),
    ),
    day.enabled ? (
      React.createElement(View, { style: styles.times },
        React.createElement(TimeField, { label: "From", value: day.start, onChange: (start) => onChange({ start }) }),
        React.createElement(TimeField, { label: "To", value: day.end, onChange: (end) => onChange({ end }) })
      )
    ) : ( React.createElement(Text, { style: styles.off }, "Unavailable") ),
    error ? React.createElement(Text, { style: styles.error }, error) : null
  )
}

const styles = StyleSheet.create({
  row: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '600', color: colors.text },
  times: { flexDirection: 'row', gap: 16, marginTop: 10 },
  off: { color: colors.textMuted, marginTop: 4 },
  error: { color: colors.error, fontSize: 13, marginTop: 6 },
});