import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { createPetRequest, updatePetRequest } from '../../api/pets.api';
import Button from '../../components/Button';
import ChipGroup from '../../components/ChipGroup';
import Input from '../../components/Input';
import { colors } from '../../color';
import { SPECIES } from '../../constants/pets';
import { validatePet } from '../../utils/validation';


export default function AddEditPetScreen({ route, navigation } : { route: { params?: { pet?: any } }; navigation: any }) {
  const editing = route.params?.pet ?? null;

  const [form, setForm] = useState({
    name: editing?.name ?? '',
    species: editing?.species ?? '',
    breed: editing?.breed ?? '',
    age: editing?.age != null ? String(editing.age) : '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) => 
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    const found = validatePet(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    const payload = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim() || null,
      age: form.age.trim() === '' ? null : Number(form.age),
    };

    setLoading(true);
    try {
      await editing ? updatePetRequest(editing.id, payload) : createPetRequest(payload);
      navigation.goBack();
    } catch (e) {
      const error = e as { fieldErrors?: Record<string, string>; message?: string };
      if (error.fieldErrors) setErrors(error.fieldErrors);
      else setFormError(error.message ?? 'Unable to save pet');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Input label="Name" value={form.name} onChangeText={set('name')} error={errors.name} autoCapitalize="words" />
        <ChipGroup label="Species" options={SPECIES} value={form.species} onChange={set('species')} error={errors.species} clearable />
        <Input label="Breed (optional)" value={form.breed} onChangeText={set('breed')} error={errors.breed} autoCapitalize="words" />
        <Input label="Age (years)" value={form.age} onChangeText={set('age')} error={errors.age} keyboardType="number-pad" />

        {!!formError && <Text style={styles.formError}>{formError}</Text>}
        <Button title={editing ? 'Save changes' : 'Add pet'} onPress={onSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  formError: { color: colors.error, marginBottom: 12 },
});