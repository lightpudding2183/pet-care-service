import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getProviderRequest, getAvailabilityRequest } from '../../api/providers.api';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';
import { formatRange } from '../../utils/dateFormat';

type Provider = {
  id?: string;
  business_name?: string | null;
  businessName?: string | null;
  user?: { id?: string | number | null; fullName?: string | null; full_name?: string | null; avatarUrl?: string | null; avatar_url?: string | null } | null;
  ratingCount?: number;
  rating_count?: number;
  ratingAvg?: number;
  rating_avg?: number;
  verificationStatus?: string;
  verified?: boolean;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  services?: Array<{ service: { label: string } }>;
  provider_services?: Array<{ service: { service_name: string } }>;
};

type ProviderDetailsScreenProps = {
  route: { params: { providerId: string; serviceId?: string } };
  navigation: any;
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

export default function ProviderDetailsScreen({ route, navigation }: ProviderDetailsScreenProps) {
  const { user } = useAuth();
  const providerId = route.params.providerId;
  const [provider, setProvider] = useState<Provider | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(route.params.serviceId ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!providerId) {
      setError('No provider ID specified');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [providerData, availabilityData] = await Promise.all([
        getProviderRequest(providerId),
        getAvailabilityRequest(providerId)
      ]);

      setProvider(providerData);
      setAvailability(availabilityData
        .filter((slot: any) => new Date(slot.end_time) > new Date())
        .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()));
    } catch (e: any) {
      setError(e.message ?? 'Error loading provider');
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useFocusEffect(useCallback(() => {
    load();
    return () => {};
  }, [load]));

  if (loading) return <LoadingSpinner />;

  if (error && !provider) {
    return <EmptyState title="Couldn't load this profile" message={error} actionLabel="Try again" onAction={load} />;
  }
  if (!provider) return <EmptyState title="Provider unavailable" message="No provider profile was found." actionLabel="Try again" onAction={load} />

  const providerName = provider.business_name || provider.businessName || provider.user?.full_name || provider.user?.fullName || 'Provider';
  const reviewCount = provider.rating_count ?? provider.ratingCount ?? 0;
  const averageRating = provider.rating_avg ?? provider.ratingAvg;
  const rating = reviewCount > 0
    ? `${Number(averageRating).toFixed(1)} (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})`
    : 'No reviews yet';
  const providerServices = provider.provider_services ?? provider.services ?? [];
  const serviceOptions = providerServices.map((entry: any) => {
    const serviceId = entry.service_id ?? entry.serviceId ?? entry.service?.id;
    const serviceName = entry.service?.service_name ?? entry.service?.serviceName ?? entry.service?.label ?? 'Pet care';
    return { id: String(serviceId ?? ''), name: serviceName, price: entry.price, priceUnit: entry.price_unit ?? entry.priceUnit };
  }).filter((entry: any) => entry.id);
  const normalizeServiceName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const selectedService = serviceOptions.find((entry: any) => entry.id === selectedServiceId)
    ?? serviceOptions.find((entry: any) => normalizeServiceName(entry.name).startsWith(`${selectedServiceId}_`) || normalizeServiceName(entry.name) === selectedServiceId)
    ?? serviceOptions[0];

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Avatar uri={(provider.user?.avatar_url ?? provider.user?.avatarUrl) as never} name={providerName} size={104} />
        <Text style={styles.name}>{providerName}</Text>
        <Text style={styles.rating}>{rating}</Text>
        {(provider.verificationStatus === 'approved' || provider.verified) && <Text style={styles.badge}>Verified</Text>}
      </View>

      <View style={styles.card}>
        <Row label="Address" value={provider.address} />
        {provider.latitude != null && provider.longitude != null && (
          <Row label="Coordinates" value={`${provider.latitude}, ${provider.longitude}`} />
        )}
        {providerServices.length > 0 && (
          <View style={styles.servicesSection}>
            <Text style={styles.servicesLabel}>Services</Text>
            <View style={styles.serviceList}>
              {serviceOptions.map((service: any) => {
                const selected = service.id === (selectedService?.id ?? selectedServiceId);
                return (
                  <Pressable
                    key={service.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedServiceId(service.id)}
                    style={[styles.serviceOption, selected && styles.serviceOptionSelected]}
                  >
                    <View style={styles.serviceCopy}>
                      <Text style={[styles.serviceName, selected && styles.serviceNameSelected]}>{service.name}</Text>
                      <Text style={styles.serviceRate}>
                        {service.price == null ? 'Rate provided when booking' : `$${Number(service.price).toFixed(2)}${service.priceUnit ? ` / ${service.priceUnit}` : ''}`}
                      </Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {provider.latitude != null && provider.longitude != null && (
        <View style={styles.locationSection}>
          <Text style={styles.locationLabel}>Location</Text>
          <Text style={styles.locationValue}>
            {Number(provider.latitude).toFixed(4)}, {Number(provider.longitude).toFixed(4)}
          </Text>
        </View>
      )}

      {availability.length > 0 && (
        <View style={styles.availabilitySection}>
          <Text style={styles.availabilityLabel}>Availability</Text>
          <View style={styles.availabilityList}>
            {availability.map((slot, index) => {
              const slotId = String(slot.id ?? index);
              const selected = selectedAvailabilityId === slotId;
              return (
                <Pressable key={slotId} accessibilityRole="button" accessibilityState={{ selected }}
                  onPress={() => setSelectedAvailabilityId(slotId)}
                  style={[styles.availabilityOption, selected && styles.availabilityOptionSelected]}>
                  <Text style={[styles.availabilityValue, selected && styles.availabilityValueSelected]}>
                    {formatRange(slot.start_time, slot.end_time)}
                  </Text>
                  <View style={[styles.radio, selected && styles.radioSelected]} />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* {!(provider.user?.avatar_url ?? provider.user?.avatarUrl) && <Text style={styles.noAvatar}>No avatar available</Text>} */}

      {/* Backend stores pet owners as role "user" (ENUM); "owner" is only a UI label. */}
      {(user?.role === 'user' || user?.role === 'owner') && String(provider.id) !== String(user?.providerId ?? '') && (
        <View style={styles.actions}>
          <Button
            title="Choose a pet"
            disabled={!selectedService || !selectedAvailabilityId}
            onPress={() => navigation.navigate('BookingPetSelection', {
              provider,
              serviceId: selectedService?.id,
              availabilityWindowId: selectedAvailabilityId,
            })}
          />
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
  servicesSection: { marginBottom: 16 },
  servicesLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  serviceList: { gap: 8 },
  serviceOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white },
  serviceOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  serviceCopy: { flex: 1 },
  serviceName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  serviceNameSelected: { color: colors.primaryDark },
  serviceRate: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: colors.border, marginLeft: 12 },
  radioSelected: { borderWidth: 5, borderColor: colors.primary },
  locationSection: { marginBottom: 16 },
  locationLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  locationValue: { color: colors.text, fontSize: 15 },
  availabilitySection: { marginBottom: 16 },
  availabilityLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  availabilityList: { gap: 8, marginTop: 6 },
  availabilityOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.white },
  availabilityOptionSelected: { borderColor: colors.primary, backgroundColor: colors.surface },
  availabilityValue: { color: colors.text, fontSize: 14, flex: 1, marginRight: 12 },
  availabilityValueSelected: { color: colors.primaryDark, fontWeight: '600' },
  noAvatar: { color: colors.textMuted, textAlign: 'center', marginVertical: 16, fontSize: 14 },
  actions: { marginTop: 8 },
});