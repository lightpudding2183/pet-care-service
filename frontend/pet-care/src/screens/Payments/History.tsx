import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import { formatMoney } from '../../utils/money';
import useAuth from '../../hooks/useAuth';
import PaymentCard from '../../components/PaymentCard';
import usePayments from '../../hooks/usePayments';

export default function PaymentHistoryScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const isProvider = user?.role === 'provider';
  const { payments, loading, refreshing, error, fetchPayments } = usePayments();

  useFocusEffect(useCallback(() => { fetchPayments(); }, [fetchPayments]));

  const sorted = useMemo(
    () => [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments]
  );

  // Refunded and failed payments don't count toward the total
  const total = useMemo(
    () => payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0),
    [payments]
  );

  if (loading) return <LoadingSpinner />;

  if (error && !payments.length) {
    return <EmptyState title="Couldn't load payments" message={error} actionLabel="Try again" onAction={() => fetchPayments()} />;
  }

  return (
    <FlatList
      style={styles.flex}
      data={sorted}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item }) => (
        <PaymentCard payment={item} onPress={() => navigation.navigate('PaymentDetail', { paymentId: item.id, payment: item })} />
      )}
      contentContainerStyle={sorted.length ? styles.list : styles.emptyList}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPayments({ refresh: true })} tintColor={colors.primary} />}
      ListHeaderComponent={
        sorted.length ? (
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>{isProvider ? 'Total received' : 'Total paid'}</Text>
            <Text style={styles.summaryValue}>{formatMoney(total, sorted[0].currency)}</Text>
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          title="No payments yet"
          message={isProvider ? 'Payments for your completed jobs show up here.' : 'Payments for your bookings show up here.'}
          actionLabel="Refresh"
          onAction={() => fetchPayments()}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  summary: { padding: 18, borderRadius: 14, backgroundColor: colors.surface, marginBottom: 16 },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryValue: { fontSize: 28, fontWeight: '700', color: colors.text, marginTop: 4 },
});