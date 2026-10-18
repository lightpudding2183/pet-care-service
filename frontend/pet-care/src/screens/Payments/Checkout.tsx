import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import InfoRow from '../../components/InfoRow';
import { colors } from '../../color';
import { formatRange } from '../../utils/dateFormat';
import { formatMoney } from '../../utils/money';
import { bookingService, petName, providerName } from '../../utils/bookingDisplay';
import usePayment from '../../hooks/usePayment';

// Opened from a booking: navigate('Checkout', { booking })
export default function CheckoutScreen({ route, navigation }: { route: { params: { booking: any } }; navigation: any }) {
  const { booking } = route.params;
  const { pay, step } = usePayment();
  const [error, setError] = useState('');
  const busy = step !== 'idle';
  const amount = formatMoney(booking.priceSnapshot, booking.currency);

  const onPay = async () => {
    setError('');
    try {
      const result = await pay(booking.id);
      if (result.outcome === 'paid') {
        // Replace so Back returns to the booking, not to a finished checkout
        navigation.replace('PaymentDetail', { paymentId: result.payment.id, payment: result.payment });
      } else if (result.outcome === 'processing') {
        Alert.alert('Payment received', "We're still confirming it with the payment provider. It will show as paid shortly.", [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
      // 'canceled': the user closed the sheet, so stay here quietly
    } catch (e) {
      const error = e as { message?: string };
      setError(error.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Confirm and pay</Text>

      <View style={styles.card}>
        <InfoRow label="Service" value={bookingService(booking)} />
        <InfoRow label="Provider" value={providerName(booking)} />
        <InfoRow label="Pet" value={petName(booking)} />
        <InfoRow label="When" value={formatRange(booking.scheduledStart, booking.scheduledEnd)} />
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.total}>{amount}</Text>
      </View>
      <Text style={styles.note}>You'll enter your card details in a secure payment sheet. The amount is set by the booking.</Text>

      {step === 'confirming' && (
        <View style={styles.confirming}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.confirmingText}>Confirming your payment…</Text>
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button title={`Pay ${amount ?? ''}`.trim()} onPress={onPay} loading={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, marginBottom: 20, backgroundColor: colors.surface },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  totalLabel: { fontSize: 16, color: colors.textMuted },
  total: { fontSize: 28, fontWeight: '700', color: colors.text },
  note: { fontSize: 13, color: colors.textMuted, marginBottom: 20 },
  confirming: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  confirmingText: { color: colors.textMuted },
  error: { color: colors.error, marginBottom: 12 },
});