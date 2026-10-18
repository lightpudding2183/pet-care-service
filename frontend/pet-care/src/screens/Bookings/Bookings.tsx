import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View  } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import SegmentedControl from '../../components/SegmentedControl';
import { SEGMENTS } from '../../constants/booking';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';
import BookingCard from '../../components/BookingCard';
import useBookings from '../../hooks/useBookings';

// One list screen for both roles: owners see their bookings, providers see requests and jobs
export default function BookingsScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const role = user?.role === 'provider' ? 'provider' : 'owner';
  const segments = SEGMENTS[role];
  const [segmentKey, setSegmentKey] = useState(segments[0].key);
  const { bookings, loading, refreshing, error, fetchBookings } = useBookings();

  useFocusEffect(useCallback(() => { fetchBookings(); }, [fetchBookings]));

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => navigation.navigate('PaymentHistory')} hitSlop={8}>
          <Text style={styles.headerAction}>Payments</Text>
        </Pressable>
      ),
    });
  }, [navigation]);


  const current = segments.find((s) => s.key === segmentKey);

  const options = useMemo(
    () => segments.map((s) => ({
      key: s.key,
      label: s.label,
      count: 'showCount' in s && s.showCount ? bookings.filter((booking) => s.statuses.includes(booking.status)).length : 0,
    })),
    [segments, bookings]
  );

  const data = useMemo(() => {
    if (!current) return [];
    const dir = current.order === 'desc' ? -1 : 1;
    return bookings
      .filter((b) => current.statuses.includes(b.status))
      .sort((a, b) => dir * (new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime()));
  }, [bookings, current]);

  if (loading) return <LoadingSpinner />;

  if (error && !bookings.length) {
    return <EmptyState title="Couldn't load bookings" message={error} actionLabel="Try again" onAction={() => fetchBookings()} />;
  }

  return (
    <View style={styles.flex}>
      <SegmentedControl options={options} value={segmentKey} onChange={setSegmentKey} />
      <FlatList
        data={data}
        keyExtractor={(b: (typeof bookings)[number]) => String(b.id)}
        renderItem={({ item }) => (
          <BookingCard booking={item} role={role}
            onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id, booking: item })} />
        )}
        contentContainerStyle={data.length ? styles.list : styles.emptyList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchBookings({ refresh: true })} tintColor={colors.primary} />}
        ListEmptyComponent={current ? <EmptyState title={current.empty.title} message={current.empty.message} actionLabel="Refresh" onAction={() => fetchBookings({ refresh: true })} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerAction: { color: colors.primary, fontWeight: '600' },
  list: { padding: 20, paddingTop: 8 },
  emptyList: { flexGrow: 1 },
});