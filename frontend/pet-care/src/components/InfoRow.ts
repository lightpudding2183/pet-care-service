import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../color';

export default function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return React.createElement(
    View, { style:styles.row },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.value }, value),
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { color: colors.textMuted, fontSize: 15 },
  value: { color: colors.text, fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
});