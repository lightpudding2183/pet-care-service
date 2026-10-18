import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../color';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export default function Avatar({ uri = null, name = '', size = 56 }: AvatarProps) {
  const style = { width: size, height: size, borderRadius: size / 2 };
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (uri) {
    return React.createElement(Image, {
      source: { uri },
      style: [styles.image, style],
    });
  }

  return React.createElement(
    View,
    { style: [styles.fallback, style] },
    React.createElement(Text, { style: [styles.initial, { fontSize: size * 0.42 }] }, initial)
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surface },
  fallback: { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.white, fontWeight: '700' },
});