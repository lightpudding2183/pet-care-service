import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../color';

export default function LoadingSpinner() {
  return React.createElement(
    View,
    { style: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } },
      React.createElement(ActivityIndicator, { size: "large", color: colors.primary })
  );
}