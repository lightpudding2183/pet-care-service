import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProviderRequest } from '../../api/providers.api';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';

type Provider = {
  businessName?: string | null;
  user?: { fullName?: string | null; avatarUrl?: string | null } | null;
  ratingCount?: number;
  ratingAvg?: number;
  verificationStatus?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

// Own profile (provider tab) when no providerId param; any provider's public view otherwise
export default function ProviderProfileScreen({ route, navigation }: any) {
  const { user, logout } = useAuth();
  const providerId = route.params?.providerId ?? user?.providerId;
  const isOwn = !!providerId && providerId === user?.providerId;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!providerId) {
      setError('No provider ID specified');
      setLoading(false);
      return;
    }
    let active = true;
    getProviderRequest(providerId)
      .then((p) => { if (active) { setProvider(p); setError(''); } })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [providerId]);

  useFocusEffect(load);

  if (loading) return <LoadingSpinner />;
  if (error && !provider) {
    return <EmptyState title="Couldn't load this profile" message={error} actionLabel="Try again" onAction={load} />;
  }
  if (!provider) return <EmptyState title="Profile unavailable" message="No provider profile was found." actionLabel="Try again" onAction={load} />;

  const name = provider.businessName || provider.user?.fullName || 'Provider';
  const rating = (provider.ratingCount ?? 0) > 0
    ? `${Number(provider.ratingAvg).toFixed(1)} (${provider.ratingCount} ${provider.ratingCount === 1 ? 'review' : 'reviews'})`
    : 'No reviews yet';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={provider.user?.avatarUrl as never} name={name} size={104} />
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.rating}>{rating}</Text>
        {provider.verificationStatus === 'approved' && <Text style={styles.badge}>Verified</Text>}
      </View>

      <View style={styles.card}>
        <Row label="Address" value={provider.address} />
        {provider.latitude != null && provider.longitude != null && (
          <Row label="Coordinates" value={`${provider.latitude}, ${provider.longitude}`} />
        )}
      </View>

      {!isOwn && user?.role === 'owner' && (
        <View style={styles.actions}>
          <Button title="Book this provider" onPress={() => navigation.navigate('BookingRequest', { provider })} />
        </View>
      )}


      {isOwn && (
        <View style={styles.actions}>
          <Button title="Edit profile" onPress={() => navigation.navigate('EditProviderProfile', { provider })} />
          <View style={{ height: 12 }} />
          <Button title="Log out" variant="outline" onPress={logout} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  name: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 14, textAlign: 'center' },
  rating: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  badge: { marginTop: 8, color: colors.primary, fontWeight: '700', fontSize: 13 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, marginBottom: 16, backgroundColor: colors.surface },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rowLabel: { color: colors.textMuted, fontSize: 15 },
  rowValue: { color: colors.text, fontSize: 15, fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: 16 },
  actions: { marginTop: 8 },
});