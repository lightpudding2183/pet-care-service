import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPaymentRequest, refundPaymentRequest } from '../../api/payments.api';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import InfoRow from '../../components/InfoRow';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import { canRefund } from '../../constants/payment';
import { formatDateTime } from '../../utils/dateFormat';
import { formatMoney } from '../../utils/money';
import useAuth from '../../hooks/useAuth';
import PaymentStatusBadge from '../../components/PaymentStatusBadge';

export default function PaymentDetailScreen({ route, navigation }: { route: { params: { paymentId: string; payment?: any } }; navigation: any }) {
  const { user } = useAuth();
  const { paymentId } = route.params;

  // Show the payment passed in instantly, then refresh from the API
  const [payment, setPayment] = useState(route.params.payment ?? null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async () => {
    try {
      setPayment(await getPaymentRequest(paymentId));
      setError('');
    } catch (e) {
      const error = e as { message?: string };
      setError(error.message || 'Failed to load payment details.');
    }
  }, [paymentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Pull to refresh is how a pending payment gets re-checked
  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const confirmRefund = () =>
    Alert.alert('Refund this payment?', "The full amount is returned to the customer. This can't be undone.", [
      { text: 'Back', style: 'cancel' },
      {
        text: 'Refund',
        style: 'destructive',
        onPress: async () => {
          setRefunding(true);
          try {
            await refundPaymentRequest(paymentId);
            await load();
          } catch (e) {
            const error = e as { message?: string };
            Alert.alert("Couldn't refund payment", error.message);
          } finally {
            setRefunding(false);
          }
        },
      },
    ]);

  if (!payment) {
    if (error) return <EmptyState title="Couldn't load this payment" message={error} actionLabel="Try again" onAction={load} />;
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.amount}>{formatMoney(payment.amount, payment.currency)}</Text>
      <View style={styles.badge}>
        <PaymentStatusBadge status={payment.status} />
      </View>

      {payment.status === 'pending' && (
        <Text style={styles.hint}>This payment is still being processed. Pull down to check again.</Text>
      )}

      <View style={styles.card}>
        <InfoRow label="Date" value={formatDateTime(payment.createdAt)} />
        <InfoRow label="Method" value={payment.method} />
        {payment.bookingId && <InfoRow label="Booking" value={`#${payment.bookingId}`} />}
      </View>

      <View style={styles.actions}>
        {!!payment.bookingId && (
          <Button title="View booking" variant="outline"
            onPress={() => navigation.navigate('BookingDetail', { bookingId: payment.bookingId })} />
        )}
        {user && typeof user.role === 'string' && canRefund(user.role, payment) && (
          <View style={styles.action}>
            <Button title="Refund payment" variant="outline" onPress={confirmRefund} loading={refunding} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  amount: { fontSize: 34, fontWeight: '700', color: colors.text, textAlign: 'center' },
  badge: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
  hint: { textAlign: 'center', color: colors.textMuted, marginBottom: 20 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, marginBottom: 20, backgroundColor: colors.surface },
  actions: { marginTop: 4 },
  action: { marginTop: 12 },
});