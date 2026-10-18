import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';
import DayRow from '../../components/DayRow';
import useAvailability from '../../hooks/useAvailability';
import { DAYS, validateSchedule } from '../../constants/availability';

export default function AvailabilityScreen() {
  const { user } = useAuth();
  const providerId = typeof user?.providerId === 'string' ? user.providerId : '';
  const { schedule, loading, saving, error, dirty, setDay, save, clear, reload } = useAvailability(providerId);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const onSave = async () => {
    const found = validateSchedule(schedule as Record<number, { enabled: boolean; start: string; end: string }>);
    setErrors(found);
    if (Object.keys(found).length) return;
    try {
      await save();
      Alert.alert('Availability saved');
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      Alert.alert("Couldn't save availability", error.message);
    }
  };

  const onClear = () =>
    Alert.alert('Clear all availability?', "Owners won't be able to book you until you add hours again.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: async () => {
          try {
            await clear();
            setErrors({});
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            Alert.alert("Couldn't clear availability", error.message);
          }
        },
      },
    ]);

  if (loading) return <LoadingSpinner />;
  if (error) return <EmptyState title="Couldn't load your schedule" message={error} actionLabel="Try again" onAction={reload} />;

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weekly availability</Text>
      <Text style={styles.subtitle}>Set the hours you're normally free. This repeats every week.</Text>

      <View style={styles.list}>
        {DAYS.map((d) => (
          <DayRow key={d.dow} label={d.label} day={schedule[d.dow]} error={errors[d.dow]}
            onChange={(patch) => setDay(String(d.dow), patch)} />
        ))}
      </View>

      <Button title="Save availability" onPress={onSave} loading={saving} disabled={!dirty} />
      <View style={{ height: 12 }} />
      <Button title="Clear all" variant="outline" onPress={onClear} disabled={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
  list: { marginTop: 12, marginBottom: 24 },
});