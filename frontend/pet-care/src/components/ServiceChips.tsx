import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../color';

type ServiceChipsProps = {
  chips: string[];
};

export default function ServiceChips({ chips }: ServiceChipsProps) {
  return (
    <View style={styles.chipsWrap}>
      {chips.map((chip, index) => (
        <View
          key={chip}
          style={[
            styles.chip,
            index < chips.length - 1 && styles.chipRight,
          ]}
        >
          <Text style={styles.chipText}>{chip}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  chip: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4, marginRight: 4, marginBottom: 4 },
  chipRight: { marginRight: 0 },
  chipText: { fontSize: 11, color: colors.primary, fontWeight: '500' },
});