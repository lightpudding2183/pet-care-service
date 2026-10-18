import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../color';

type InputProps = {
  label: string;
  error?: string;
  secureTextEntry?: boolean;
  [key: string]: any; // Allow any other props for TextInput
};
export default function Input({ label, error, secureTextEntry, ...props }: InputProps) {
  const [hidden, setHidden] = useState(!!secureTextEntry);

  return React.createElement(
    View,
    { style: styles.wrapper },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(
      View,
      { style: [styles.field, error ? styles.fieldError : null] },
      React.createElement(TextInput, {
        style: styles.input,
        placeholderTextColor: colors.textMuted,
        secureTextEntry: hidden,
        autoCapitalize: 'none',
        ...props,
      }),
      secureTextEntry &&
        React.createElement(
          Pressable,
          { onPress: () => setHidden((h) => !h), hitSlop: 8 },
          React.createElement(Text, { style: styles.toggle }, hidden ? 'Show' : 'Hide')
        )
    ),
    !!error && React.createElement(Text, { style: styles.error }, error)
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 },
  field: {
    flexDirection: 'row', alignItems: 'center', height: 50, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface,
  },
  fieldError: { borderColor: colors.error },
  input: { flex: 1, fontSize: 16, color: colors.text },
  toggle: { color: colors.primary, fontWeight: '600', marginLeft: 8 },
  error: { color: colors.error, fontSize: 13, marginTop: 4 },
});