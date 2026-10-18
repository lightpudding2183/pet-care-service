import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../color';

type SegmentedControlProps = {
  options: { key: string; label: string; count?: number }[];
  value: string;
  onChange: (key: string) => void;
};
// options: [{ key, label, count? }]. A count > 0 is shown next to the label.
export default function SegmentedControl({ options, value, onChange } : SegmentedControlProps ) {
  return React.createElement(
  View,
  { style: styles.wrap },
  options.map((o) => {
    const selected = o.key === value;
    return React.createElement(
      Pressable,
      {
        key: o.key,
        onPress: () => onChange(o.key),
        accessibilityRole: "button",
        accessibilityState: { selected },
        style: [styles.item, selected && styles.itemSelected],
      },
      React.createElement(
        Text,
        { style: [styles.text, selected && styles.textSelected] },
        `${o.label}${(o.count ?? 0) > 0 ? ` (${o.count})` : ''}`
      )
    );
  })
);

}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', margin: 20, marginBottom: 8, padding: 4, borderRadius: 12, backgroundColor: colors.surface },
  item: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  itemSelected: { backgroundColor: colors.background, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  text: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  textSelected: { color: colors.text, fontWeight: '600' },
});