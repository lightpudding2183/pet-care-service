import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, GestureResponderEvent } from 'react-native';
import { colors } from '../color';

type ButtonProps = { 
  title: string; 
  onPress: (event: GestureResponderEvent) => void; 
  loading?: boolean; 
  disabled?: boolean; 
  variant?: 'primary' | 'outline'; };
export default function Button({ title, onPress, loading = false, disabled = false, variant = 'primary' }: ButtonProps) {
  const isPrimary = variant === 'primary';

  const isDisabled = disabled || loading;

  return React.createElement(
    Pressable,
    {
      onPress: isDisabled ? undefined : onPress,
      disabled: isDisabled,
      accessibilityRole: 'button',
      accessibilityState: {
        disabled: isDisabled,
        busy: loading,
      },
      style: ({ pressed }: { pressed: boolean }) => [
        styles.base,
        isPrimary ? styles.primary : styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ],
    },
    loading
      ? React.createElement(ActivityIndicator, {
          color: isPrimary ? colors.white : colors.primary,
        })
      : React.createElement(
          Text,
          { style: [styles.text, !isPrimary && styles.outlineText] },
          title
        )
  );
}

const styles = StyleSheet.create({
  base: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: 'transparent' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.85 },
  text: { color: colors.white, fontSize: 16, fontWeight: '600' },
  outlineText: { color: colors.primary },
});