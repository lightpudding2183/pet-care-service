import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getBookingRequest, updateBookingRequest } from '../../api/bookings.api';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import InfoRow from '../../components/InfoRow';
import LoadingSpinner from '../../components/LoadingSpinner';
import { getActions } from '../../constants/booking';
import { colors } from '../../color';
import { speciesLabel } from '../../constants/pets';
import { formatDateTime, formatRange } from '../../utils/dateFormat';
import useAuth from '../../hooks/useAuth';
import StatusBadge from '../../components/StatusBadge';
import { bookingService, counterpartName, formatPrice, petName } from '../../utils/bookingDisplay';
import { PAYABLE_BOOKING_STATUSES, paymentStatusLabel } from '@/constants/payment';
import usePaymentForBooking from '@/hooks/usePaymentForBooking';

export default function BookingDetailScreen({ route, navigation }: { route: { params: { bookingId: string; booking?: any } }; navigation: { navigate: (screen: string, params: Record<string, unknown>) => void } }) {
  const { user } = useAuth();
  const role = user?.role === 'provider' ? 'provider' : user?.role === 'admin' ? 'admin' : 'owner';
  const { bookingId } = route.params;

  // Show the booking passed from the list instantly, then refresh from the API
  const [booking, setBooking] = useState(route.params.booking ?? null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const payment = usePaymentForBooking(bookingId);

  const load = useCallback(() => {
    let active = true;
    getBookingRequest(bookingId)
      .then((b) => { if (active) { setBooking(b); setError(''); } })
      .catch((e) => active && setError(e.message));
    return () => { active = false; };
  }, [bookingId]);

  useFocusEffect(load);

  const run = async (action: (typeof actions)[number]) => {
    setBusy(action.next);
    try {
      await updateBookingRequest(bookingId, { status: action.next });
      setBooking(await getBookingRequest(bookingId)); // re-read so we show what the server decided
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      Alert.alert("Couldn't update booking", error.message);
    } finally {
      setBusy(null); 
    }
  };

  const onAction = (action: (typeof actions)[number]) => {
    if (!('confirm' in action) || !action.confirm) return run(action);
    Alert.alert(action.confirm.title, action.confirm.message, [
      { text: 'Back', style: 'cancel' },
      { text: action.confirm.confirmText, style: 'destructive', onPress: () => run(action) },
    ]);
  };

  if (!booking) {
    if (error) return <EmptyState title="Couldn't load this booking" message={error} actionLabel="Try again" onAction={load} />;
    return <LoadingSpinner />;
  }

  const actions = getActions(role, booking.status);
  const needsPayment = !payment || payment.status === 'pending';
  const canPay = role === 'owner' && PAYABLE_BOOKING_STATUSES.includes(booking.status)
    && needsPayment && booking.priceSnapshot != null;

  const petDesc = [petName(booking), booking.pet?.species && speciesLabel(booking.pet.species), booking.pet?.breed]
    .filter(Boolean).join(' · ');

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.service}>{bookingService(booking)}</Text>
        <StatusBadge status={booking.status} />
      </View>

      <View style={styles.card}>
        <InfoRow label="When" value={formatRange(booking.scheduledStart, booking.scheduledEnd)} />
        <InfoRow label="Pet" value={petDesc} />
        <InfoRow label={role === 'provider' ? 'Owner' : 'Provider'} value={counterpartName(booking, role)} />
        {role === 'provider' && <InfoRow label="Phone" value={booking.owner?.phone} />}
        <InfoRow label="Address" value={booking.address} />
        <InfoRow label="Price" value={formatPrice(booking.priceSnapshot) ?? ''} />
        {payment && <InfoRow label="Payment" value={paymentStatusLabel(payment.status)} />}
        {booking.actualStart && <InfoRow label="Started" value={formatDateTime(booking.actualStart)} />}
        {booking.actualEnd && <InfoRow label="Finished" value={formatDateTime(booking.actualEnd)} />}

      </View>

      {!!booking.notes && (
        <View style={styles.card}>
          <Text style={styles.notesTitle}>Notes</Text>
          <Text style={styles.notes}>{booking.notes}</Text>
        </View>
      )}

      {(canPay || payment) && (
        <View style={styles.actions}>
          {canPay && (
            <View style={styles.action}>
              <Button title={payment?.status === 'pending' ? 'Complete payment' : 'Pay now'}
                onPress={() => navigation.navigate('Checkout', { booking })} />
            </View>
          )}
          {payment && (
            <View style={styles.action}>
              <Button title="View payment" variant="outline"
                onPress={() => navigation.navigate('PaymentDetail', { paymentId: payment.id, payment })} />
            </View>
          )}
        </View>
      )}


      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <View key={a.label} style={styles.action}>
              <Button title={a.label} variant={a.variant as 'outline' | 'primary' | undefined} onPress={() => onAction(a)}
                loading={busy === a.next} disabled={!!busy && busy !== a.next} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20, gap: 10 },
  service: { fontSize: 26, fontWeight: '700', color: colors.text },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, marginBottom: 16, backgroundColor: colors.surface },
  notesTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  notes: { fontSize: 15, color: colors.text, lineHeight: 22 },
  actions: { marginTop: 8 },
  action: { marginBottom: 12 },
});