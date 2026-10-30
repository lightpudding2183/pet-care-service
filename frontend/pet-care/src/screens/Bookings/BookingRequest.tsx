import React, { useCallback, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createBookingRequest, getProviderBusySlotsRequest, quoteBookingPriceRequest } from '../../api/bookings.api';
import { getAvailabilityRequest } from '../../api/providers.api';
import Button from '../../components/Button';
import ChipGroup from '../../components/ChipGroup';
import DateTimeField from '../../components/DateTimeField';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import { validateBooking } from '../../utils/validation';
import { formatRange } from '../../utils/dateFormat';

const HOUR = 60 * 60 * 1000;

type AvailabilityWindow = {
  id: string;
  start_time: string;
  end_time: string;
};

type BookingRequestRoute = {
  params: { provider: any; serviceId?: string; availabilityWindowId?: string; selectedPetId?: string; selectedPetName?: string; stage?: number };
};

export default function BookingRequestScreen({ route, navigation }: { route: BookingRequestRoute; navigation: any }) {
  const { provider, serviceId: initialServiceId, availabilityWindowId } = route.params;
  const providerId = String(provider.id);
  const providerName = provider.business_name ?? provider.businessName ?? provider.user?.full_name ?? provider.user?.fullName ?? 'this provider';
  const providerServices = provider.provider_services ?? provider.providerServices ?? [];
  const serviceOptions = useMemo(() => providerServices.map((entry: any) => ({
    id: String(entry.service_id ?? entry.serviceId ?? entry.service?.id ?? ''),
    name: entry.service?.service_name ?? entry.service?.serviceName ?? 'Pet care',
    price: entry.price == null ? null : Number(entry.price),
    priceUnit: entry.price_unit ?? entry.priceUnit ?? 'service',
  })).filter((service: any) => service.id), [providerServices]);

  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState('');
  const [serviceId, setServiceId] = useState(initialServiceId ?? '');
  const [petId, setPetId] = useState(route.params.selectedPetId ?? '');
  const [petName, setPetName] = useState(route.params.selectedPetName ?? '');
  const [windowId, setWindowId] = useState(availabilityWindowId ?? '');
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'cash'>('stripe');
  const [stage, setStage] = useState(route.params.stage ?? 1);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [busyChecked, setBusyChecked] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [quote, setQuote] = useState<{ amount: number; rate: number; unit: string; units: number } | null>(null);
  const [busyChecking, setBusyChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadAvailability = useCallback(async () => {
    setAvailabilityLoading(true);
    setAvailabilityError('');
    try {
      const slots = await getAvailabilityRequest(providerId);
      setAvailability(slots.map((slot: any, index: number) => ({
        id: String(slot.id ?? index),
        start_time: slot.start_time,
        end_time: slot.end_time,
      })).filter((slot: AvailabilityWindow) => new Date(slot.end_time) > new Date())
        .sort((a: AvailabilityWindow, b: AvailabilityWindow) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
    } catch (error) {
      setAvailabilityError((error as { message?: string }).message ?? 'Unable to load provider availability.');
    } finally {
      setAvailabilityLoading(false);
    }
  }, [providerId]);

  useFocusEffect(useCallback(() => {
    loadAvailability();
  }, [loadAvailability]));

  React.useEffect(() => {
    if (route.params.selectedPetId) {
      setPetId(route.params.selectedPetId);
      setPetName(route.params.selectedPetName ?? 'Pet');
    }
    if (route.params.stage) setStage(route.params.stage);
  }, [route.params.selectedPetId, route.params.selectedPetName, route.params.stage]);

  const selectedService = serviceOptions.find((service: any) => service.id === serviceId);
  const selectedWindow = availability.find((slot) => slot.id === windowId);

  const selectWindow = (slot: AvailabilityWindow) => {
    const slotStart = new Date(slot.start_time);
    const slotEnd = new Date(slot.end_time);
    const start = slotStart > new Date() ? slotStart : new Date();
    const end = new Date(Math.min(start.getTime() + HOUR, slotEnd.getTime()));
    setWindowId(slot.id);
    setRange({ start, end });
    setBusyChecked(false);
    setConflict(false);
    setQuote(null);
    setFormError('');
  };

  React.useEffect(() => {
    const presetSlot = availability.find((slot) => slot.id === availabilityWindowId);
    if (presetSlot && !range) selectWindow(presetSlot);
  }, [availability, availabilityWindowId]);

  const changeStart = (start: Date) => {
    setRange((current) => current ? {
      start,
      end: new Date(start.getTime() + (current.end.getTime() - current.start.getTime())),
    } : current);
    setBusyChecked(false);
    setQuote(null);
  };

  const changeEnd = (end: Date) => {
    setRange((current) => current ? { ...current, end } : current);
    setBusyChecked(false);
    setQuote(null);
  };

  const checkExistingBookings = async () => {
    if (!selectedService || !selectedWindow || !range) {
      setFormError('Choose a service, availability window, and booking time first.');
      return false;
    }
    const validationErrors = validateBooking({
      petId: 'selected',
      serviceId,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    });
    if (Object.keys(validationErrors).length) {
      setFormError(Object.values(validationErrors)[0]);
      return false;
    }
    if (range.start < new Date(selectedWindow.start_time) || range.end > new Date(selectedWindow.end_time)) {
      setFormError('Choose a time within the provider availability window.');
      return false;
    }

    setBusyChecking(true);
    setBusyChecked(false);
    setQuote(null);
    setFormError('');
    try {
      const bookedSlots = await getProviderBusySlotsRequest(providerId, range.start.toISOString(), range.end.toISOString());
      const hasConflict = bookedSlots.some((slot: any) =>
        new Date(slot.start_time) < range.end && new Date(slot.end_time) > range.start
      );
      setConflict(hasConflict);
      setBusyChecked(true);
      if (hasConflict) {
        setQuote(null);
        setBusyChecked(true);
        setFormError('That time was just booked. Choose another time and check again.');
        return false;
      } else {
        const priceQuote = await quoteBookingPriceRequest({
          providerId,
          serviceId,
          scheduledStart: range.start.toISOString(),
          scheduledEnd: range.end.toISOString(),
        });
        setQuote(priceQuote);
        setBusyChecked(true);
        return true;
      }
    } catch (error) {
      setFormError((error as { message?: string }).message ?? 'Unable to check existing bookings.');
      return false;
    } finally {
      setBusyChecking(false);
    }
  };

  const createBooking = async () => {
    if (!range || !selectedService || !busyChecked || conflict || !quote) return;
    setSubmitting(true);
    setFormError('');
    try {
      const booking = await createBookingRequest({
        providerId,
        petId,
        serviceId,
        scheduledStart: range.start.toISOString(),
        scheduledEnd: range.end.toISOString(),
        notes: note.trim() || undefined,
        paymentMethod,
      });
      const result = { ...booking, payment_method: paymentMethod };
      setCreatedBooking(result);
      setStage(5);
    } catch (error) {
      setFormError((error as { message?: string }).message ?? 'Unable to create booking. Please check availability again.');
      setBusyChecked(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (availabilityLoading) return <LoadingSpinner />;

  if (availabilityError) {
    return <EmptyState title="Couldn't load availability" message={availabilityError} actionLabel="Try again" onAction={loadAvailability} />;
  }

  const windowOptions = availability.map((slot) => ({
    value: slot.id,
    label: formatRange(slot.start_time, slot.end_time),
  }));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{stage === 5 ? 'Request sent' : `Book ${providerName}`}</Text>
        <Text style={styles.subtitle}>{stage === 5 ? 'Your booking status and next steps are below.' : `Step ${stage} of 4`}</Text>

        {stage === 1 && <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Service and appointment time</Text>
          <ChipGroup label="Service" options={serviceOptions.map((service: any) => ({
            value: service.id,
            label: `${service.name}${service.price == null ? '' : ` · $${service.price.toFixed(2)}`}`,
          }))} value={serviceId} onChange={(value) => {
            setServiceId(value);
            setBusyChecked(false);
            setConflict(false);
            setQuote(null);
          }} clearable={false} />
          {availability.length ? <ChipGroup label="Available appointment windows" options={windowOptions} value={windowId}
            onChange={(value) => {
              const slot = availability.find((entry) => entry.id === value);
              if (slot) selectWindow(slot);
            }} clearable={false} /> : <Text style={styles.muted}>This provider has no upcoming availability yet.</Text>}
          {!!selectedWindow && !!range && <>
            <Text style={styles.windowLabel}>Select a time within {formatRange(selectedWindow.start_time, selectedWindow.end_time)}</Text>
            <DateTimeField label="Starts" value={range.start} onChange={changeStart} minimumDate={new Date()} />
            <DateTimeField label="Ends" value={range.end} onChange={changeEnd} minimumDate={range.start} />
          </>}
          <Button title="Choose a pet" onPress={() => navigation.navigate('BookingPetSelection', {
            provider,
            serviceId,
            availabilityWindowId: windowId,
          })} disabled={!selectedWindow || !selectedService || !range} />
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
        </View>}

        {stage === 2 && <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Add a note for the provider</Text>
          <Text style={styles.selectedPet}>{petName || 'Pet selected'}</Text>
          <Button title="Change pet" variant="outline" onPress={() => navigation.navigate('BookingPetSelection', {
            provider,
            serviceId,
            availabilityWindowId: windowId,
          })} />
          <Text style={styles.inputLabel}>Note for the provider</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="Care instructions or details to know"
            placeholderTextColor={colors.textMuted} multiline maxLength={1000} style={styles.noteInput} />
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          <Button title="Check time and review" loading={busyChecking} disabled={!petId || busyChecking}
            onPress={async () => {
              if (!busyChecked || !quote) {
                const available = await checkExistingBookings();
                if (!available) return;
              }
              setStage(3);
            }} />
        </View>}

        {stage === 3 && <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Review booking details</Text>
          <View style={styles.priceSummary}>
            <Text style={styles.reviewLine}>{selectedService?.name}</Text>
            <Text style={styles.reviewLine}>{range ? formatRange(range.start, range.end) : ''}</Text>
            <Text style={styles.reviewLine}>Pet: {petName}</Text>
            {!!note.trim() && <Text style={styles.reviewNote}>{note.trim()}</Text>}
            <Text style={styles.priceValue}>{quote ? `$${quote.amount.toFixed(2)}` : 'Price to be confirmed'}</Text>
          </View>
          <Button title="Choose payment method" onPress={() => setStage(4)} />
        </View>}

        {stage === 4 && <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Select payment method</Text>
          {([
            { value: 'stripe', label: 'Card', description: 'Pay by card after the provider confirms.' },
            { value: 'cash', label: 'Cash', description: 'Pay the provider in person.' },
          ] as const).map((method) => {
            const selected = paymentMethod === method.value;
            return <Pressable key={method.value} accessibilityRole="button" accessibilityState={{ selected }}
              onPress={() => setPaymentMethod(method.value)} style={[styles.paymentOption, selected && styles.paymentOptionSelected]}>
              <View style={styles.paymentCopy}><Text style={styles.paymentTitle}>{method.label}</Text><Text style={styles.muted}>{method.description}</Text></View>
              <View style={[styles.radio, selected && styles.radioSelected]} />
            </Pressable>;
          })}
          {!!formError && <Text style={styles.formError}>{formError}</Text>}
          <Button title="Send booking request" onPress={createBooking} loading={submitting} disabled={!quote || !petId} />
        </View>}

        {stage === 5 && createdBooking && <View style={styles.stepContent}>
          <Text style={styles.resultStatus}>Status: {createdBooking.status ?? 'pending'}</Text>
          <Text style={styles.muted}>Payment: {paymentMethod === 'cash' ? 'Cash' : 'Card after provider confirmation'}</Text>
          <View style={styles.priceSummary}>
            <Text style={styles.reviewLine}>{selectedService?.name}</Text>
            <Text style={styles.reviewLine}>{range ? formatRange(range.start, range.end) : ''}</Text>
            <Text style={styles.reviewLine}>Pet: {petName}</Text>
            {!!note.trim() && <Text style={styles.reviewNote}>{note.trim()}</Text>}
            <Text style={styles.priceValue}>{quote ? `$${quote.amount.toFixed(2)}` : ''}</Text>
          </View>
          <Button title="View booking" onPress={() => navigation.replace('BookingDetail', { bookingId: createdBooking.id, booking: createdBooking })} />
        </View>}

        {stage > 1 && stage < 5 && <View style={styles.backAction}>
          <Button title="Back" variant="outline" onPress={() => setStage(stage - 1)} />
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 48 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 20 },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border },
  stepNumber: { width: 26, height: 26, lineHeight: 26, textAlign: 'center', borderRadius: 13, overflow: 'hidden', backgroundColor: colors.surface, color: colors.primary, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  providerLabel: { color: colors.textMuted, fontSize: 14, marginBottom: 12 },
  windowLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 10 },
  muted: { color: colors.textMuted, fontSize: 14, marginBottom: 8 },
  availableMessage: { color: colors.primaryDark, fontSize: 14, fontWeight: '600', marginTop: 12 },
  priceSummary: { padding: 14, backgroundColor: colors.surface, borderRadius: 8 },
  priceService: { color: colors.text, fontSize: 15, fontWeight: '600' },
  priceValue: { color: colors.primaryDark, fontSize: 20, fontWeight: '700', marginTop: 6 },
  formError: { color: colors.error, fontSize: 13, marginBottom: 12 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  noteInput: { minHeight: 92, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.text, backgroundColor: colors.white, textAlignVertical: 'top', marginBottom: 16 },
  reviewLine: { color: colors.text, fontSize: 15, marginBottom: 8 },
  reviewNote: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: colors.white },
  paymentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  paymentCopy: { flex: 1, marginRight: 12 },
  paymentTitle: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.border },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
  resultStatus: { color: colors.primaryDark, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  selectedPet: { color: colors.text, fontSize: 15, fontWeight: '600', marginBottom: 8 },
  backAction: { marginTop: 12 },
});