import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../color';

type ChipOption = {
  label: string;
  value: string;
};

type MultiChipGroupProps = {
  label: string;
  options: ChipOption[];
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

export default function MultiChipGroup({ label, options, value, onChange, error }: MultiChipGroupProps) {
  const handleToggle = (optionValue: string) => {
    const selected = value.includes(optionValue);
    onChange(selected ? value.filter((v) => v !== optionValue) : [...value, optionValue]);
  };

  return React.createElement(
    View,
    { style: styles.wrapper },
    label ? React.createElement(Text, { style: styles.label }, label) : null,
    React.createElement(
      View,
      { style: styles.row },
      options.map((o) => {
        const selected = value.includes(o.value);
        return React.createElement(
          Pressable,
          {
            key: o.value,
            accessibilityRole: 'button',
            accessibilityState: { selected },
            onPress: () => handleToggle(o.value),
            style: [styles.chip, selected && styles.chipSelected],
          },
          React.createElement(Text, { style: [styles.chipText, selected && styles.chipTextSelected] }, o.label)
        );
      })
    ),
    error ? React.createElement(Text, { style: styles.error }, error) : null
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextSelected: { color: colors.white, fontWeight: '600' },
  error: { color: colors.error, fontSize: 13, marginTop: 4 },
});