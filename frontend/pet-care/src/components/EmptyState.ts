import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import { colors } from '../color';

type EmptyStateProp = {
  title: string,
  message: string, 
  actionLabel: string, 
  onAction: () => void
}
export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProp) {
  return React.createElement(
    View, 
    { style: [styles.container] },
    React.createElement(Text, { style: styles.title }, title),
    (!!message && React.createElement(Text, { style: styles.message }, message)) ||
    null,
    (!!actionLabel && React.createElement(
      View,
      { style: styles.action },
      React.createElement(Button, { title: actionLabel, onPress: onAction })
    )) || null
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 20, fontWeight: '600', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  action: { marginTop: 24, alignSelf: 'stretch' },
});