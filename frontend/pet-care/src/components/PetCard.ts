import React from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import Avatar from '../components/Avatar';
import { colors } from '../color';
import { formatAge, speciesLabel } from '../constants/pets';

type PetCardPet = {
  name: string;
  species?: string | null;
  breed?: string | null;
  age?: number | string | null;
};

type PetCardProps = {
  pet: PetCardPet;
  onPress?: (event: GestureResponderEvent) => void;
};

export default function PetCard({ pet, onPress }: PetCardProps) {
  const subtitle = [speciesLabel(pet.species ?? ''), pet.breed, formatAge(pet.age != null ? Number(pet.age) : null)].filter(Boolean).join(', ');

  return React.createElement(
    Pressable,
    {
      onPress,
      style: ({ pressed }) => [styles.card, pressed && styles.pressed],
      accessibilityRole: 'button',
      accessibilityLabel: `${pet.name}, ${subtitle}`,
    },
    React.createElement(Avatar, { name: pet.name, size: 60 }),
    React.createElement(
      View,
      { style: styles.info },
      React.createElement(Text, { style: styles.name, numberOfLines: 1 }, pet.name),
      React.createElement(Text, { style: styles.subtitle, numberOfLines: 1 }, subtitle)
    )
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  pressed: { backgroundColor: colors.surface },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 17, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },
});