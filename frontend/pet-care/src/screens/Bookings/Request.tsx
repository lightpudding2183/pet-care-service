import React, { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createBookingRequest } from '../../api/bookings.api';
import Button from '../../components/Button';
import ChipGroup from '../../components/ChipGroup';
import DateTimeField from '../../components/DateTimeField';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import { validateBooking } from '../../utils/validation';
import usePets from '../../hooks/usePets';

const HOUR = 60 * 60 * 1000;

// Default: tomorrow 09:00 for one hour
const defaultRange = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  return { start, end: new Date(start.getTime() + HOUR) };
};

// Opened from a provider's profile: navigate('BookingRequest', { provider })
export default function BookingRequestScreen({ route, navigation }: { route: { params: { provider: any } }; navigation: any }) {
  const { provider } = route.params;
  const providerName = provider.businessName || provider.user?.fullName || 'this provider';
  const providerServices = provider.provider_services ?? provider.providerServices ?? [];

  const { pets, loading: petsLoading, error: petsError, fetchPets } = usePets();
  useFocusEffect(useCallback(() => { fetchPets(); }, [fetchPets])); // picks up a pet added mid-flow

  const [petId, setPetId] = useState<string | undefined>(undefined);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);
  const [{ start, end }, setRange] = useState(defaultRange);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Moving the start keeps the chosen duration
  const onStartChange = (next: Date) =>
    setRange(({ start: s, end: e }) => ({
      start: next,
      end: new Date(next.getTime() + (e.getTime() > s.getTime() ? e.getTime() - s.getTime() : HOUR)),
    }));
  const onEndChange = (next: Date) => setRange((r) => ({ ...r, end: next }));

  const onSubmit = async () => {
    const found = validateBooking({ petId, serviceId, start: start.toISOString(), end: end.toISOString() });
    setFormError('');
    if (Object.keys(found).length) return setErrors(found);

    setSubmitting(true);
    try {
      setErrors({});

      const booking = await createBookingRequest({
        providerId: provider.id,
        petId,
        serviceId,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      });
      // Replace the form so Back returns to the provider, not to a filled-in form
      navigation.replace('BookingDetail', { bookingId: booking.id, booking });
    } catch (e: any) {
      // e.g. 409 when the provider isn't available at that time
      if (e.fieldErrors) setErrors(e.fieldErrors);
      else setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (petsLoading) return <LoadingSpinner />;

  if (petsError && !pets.length) {
    return <EmptyState title="Couldn't load your pets" message={petsError} actionLabel="Try again" onAction={() => fetchPets()} />;
  }

  if (!pets.length) {
    return (
      <EmptyState title="Add a pet first" message="Providers need to know which pet they'll be caring for."
        actionLabel="Add a pet" onAction={() => navigation.navigate('PetsTab', { screen: 'AddEditPet' })} />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.providerCard}>
          <Text style={styles.providerName}>{providerName}</Text>
        </View>

        <ChipGroup label="Which pet?" options={pets.map((p) => ({ value: String(p.id), label: String(p.name) }))}
          value={petId ?? ''} onChange={setPetId} error={errors.petId} clearable />

        <ChipGroup label="Which service?" options={providerServices.map((entry: any) => {
          const serviceId = entry.service_id ?? entry.serviceId ?? entry.service?.id;
          const serviceName = entry.service?.service_name ?? entry.service?.serviceName ?? 'Service';
          const price = entry.price == null ? '' : ` · ${entry.price}`;
          const priceUnit = entry.price_unit ?? entry.priceUnit;
          return { value: String(serviceId), label: `${serviceName}${price}${priceUnit ? ` / ${priceUnit}` : ''}` };
        })}
          value={serviceId ?? ''} onChange={setServiceId} error={errors.serviceId} clearable />

        <DateTimeField label="Starts" value={start} onChange={onStartChange} minimumDate={new Date()} error={errors.start} />
        <DateTimeField label="Ends" value={end} onChange={onEndChange} minimumDate={start} error={errors.end} />

        <Text style={styles.priceNote}>The price is calculated when you send the request and shown on your booking.</Text>
        {!!formError && <Text style={styles.formError}>{formError}</Text>}
        <Button title="Send request" onPress={onSubmit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  providerCard: { padding: 16, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: 24 },
  providerName: { fontSize: 18, fontWeight: '600', color: colors.text },
  priceNote: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  formError: { color: colors.error, marginBottom: 12 },
});