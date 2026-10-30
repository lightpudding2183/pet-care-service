import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import { formatAge, speciesLabel } from '../../constants/pets';
import usePets from '../../hooks/usePets';

type BookingPetSelectionRoute = {
  params: { provider: any; serviceId: string; availabilityWindowId?: string };
};

export default function BookingPetSelectionScreen({ route, navigation }: { route: BookingPetSelectionRoute; navigation: any }) {
  const { provider, serviceId, availabilityWindowId } = route.params;
  const { pets, loading, error, fetchPets } = usePets();
  const [selectedPetId, setSelectedPetId] = useState('');

  useFocusEffect(useCallback(() => {
    fetchPets();
  }, [fetchPets]));

  if (loading) return <LoadingSpinner />;

  if (error && !pets.length) {
    return <EmptyState title="Couldn't load your pets" message={error} actionLabel="Try again" onAction={() => fetchPets()} />;
  }

  if (!pets.length) {
    return <EmptyState title="Add a pet first" message="Providers need to know which pet they'll be caring for."
      actionLabel="Add a pet" onAction={() => navigation.navigate('PetsTab', { screen: 'AddEditPet' })} />;
  }

  const selectedPet = pets.find((pet) => String(pet.id) === selectedPetId);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose a pet</Text>
      <Text style={styles.subtitle}>Select the pet for this appointment.</Text>
      <View style={styles.list}>
        {pets.map((pet) => {
          const id = String(pet.id);
          const selected = id === selectedPetId;
          const details = [
            typeof pet.species === 'string' ? speciesLabel(pet.species) : '',
            typeof pet.breed === 'string' ? pet.breed : '',
            formatAge(typeof pet.age === 'number' ? pet.age : null),
          ].filter(Boolean).join(' · ');

          return (
            <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected }}
              onPress={() => setSelectedPetId(id)} style={[styles.petOption, selected && styles.petOptionSelected]}>
              <View style={styles.petCopy}>
                <Text style={[styles.petName, selected && styles.petNameSelected]}>{String(pet.name ?? 'Unnamed pet')}</Text>
                {!!details && <Text style={styles.petDetails}>{details}</Text>}
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]} />
            </Pressable>
          );
        })}
      </View>
      <Button title={selectedPet ? `Continue with ${String(selectedPet.name ?? 'pet')}` : 'Select a pet'}
        disabled={!selectedPet} onPress={() => navigation.navigate('BookingRequest', {
          provider,
          serviceId,
          availabilityWindowId,
          selectedPetId,
          selectedPetName: String(selectedPet?.name ?? 'Pet'),
          stage: 2,
        })} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 48 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  list: { gap: 10, marginBottom: 20 },
  petOption: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white },
  petOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  petCopy: { flex: 1, marginRight: 12 },
  petName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  petNameSelected: { color: colors.primaryDark },
  petDetails: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.border },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
});