import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deletePetRequest, getPetRequest } from '../../api/pets.api';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { colors } from '../../color';
import { formatAge, speciesLabel } from '../../constants/pets';


function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function PetDetailScreen({ route, navigation }: { route: { params: { pet: any } }; navigation: any }) {
  const initial = route.params.pet;
  const [pet, setPet] = useState(initial);
  const [deleting, setDeleting] = useState(false);

  // Show the passed-in pet instantly, then refresh (picks up edits on return)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getPetRequest(initial.id).then((p) => active && setPet(p)).catch(() => {});
      return () => { active = false; };
    }, [initial.id])
  );

  const confirmDelete = () =>
    Alert.alert(`Remove ${pet.name}?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deletePetRequest(pet.id);
            navigation.goBack();
          } catch (e) {
            const error = e as { message?: string };
            setDeleting(false);
            Alert.alert("Couldn't remove pet", error.message);
          }
        },
      },
    ]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar name={pet.name} size={120} />
        <Text style={styles.name}>{pet.name}</Text>
      </View>

      <View style={styles.card}>
        <Row label="Species" value={speciesLabel(pet.species)} />
        <Row label="Breed" value={pet.breed} />
        <Row label="Age" value={formatAge(pet.age)} />
      </View>

      <View style={styles.actions}>
        <Button title="Edit pet" onPress={() => navigation.navigate('AddEditPet', { pet })} />
        <View style={{ height: 12 }} />
        <Button title="Remove pet" variant="outline" onPress={confirmDelete} loading={deleting} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  name: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 14 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, marginBottom: 16, backgroundColor: colors.surface },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: colors.textMuted, fontSize: 15 },
  rowValue: { color: colors.text, fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
  notesTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  notes: { fontSize: 15, color: colors.text, lineHeight: 22 },
  actions: { marginTop: 8 },
});