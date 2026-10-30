import React from 'react';
import { Pressable, StyleSheet, Text, View, Image } from 'react-native';
import { colors } from '../color';

type ProviderCardProps = {
  provider: any;
  navigation: any;
  serviceId?: string;
};

export default function ProviderCard({ provider, navigation, serviceId }: ProviderCardProps) {
  const id = provider.id;
  const name = provider.name ?? provider.business_name ?? provider.businessName ?? provider.user?.full_name ?? provider.user?.fullName;
  const ratingAvg = provider.rating_avg ?? provider.ratingAvg;
  const avatar = provider.user?.avatar_url ?? provider.user?.avatarUrl ?? provider.avatar;
  const services = provider.provider_services ?? provider.providerServices ?? provider.services ?? [];

  return (
    <Pressable
      onPress={() => navigation.navigate('ProviderDetails', { providerId: String(id), serviceId })}
      style={styles.card}
    >
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.providerName}>{name || 'Provider'}</Text>
        <View style={styles.rating}>
          {ratingAvg ? (
            <Text style={styles.ratingText}>{ratingAvg.toFixed(1)}</Text>
          ) : (
            <Text style={styles.ratingText}>No rating</Text>
          )}
        </View>
      </View>

      <View style={styles.services}>
        {services?.map((s: any, index: number) => (
          <Text key={s.service_id ?? s.serviceId ?? index} style={styles.serviceChip}>
            {s.service?.service_name || s.service?.serviceName || s.value}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarContainer: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 60, height: 60 },
  avatarPlaceholder: { width: 60, height: 60, backgroundColor: colors.surface },
  avatarText: { fontSize: 24 },
  details: { padding: 12 },
  providerName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  ratingText: { fontSize: 12, color: colors.textMuted, marginHorizontal: 4 },
  services: { paddingHorizontal: 12, paddingBottom: 12 },
  serviceChip: { fontSize: 11, color: colors.primary, backgroundColor: colors.surface, paddingVertical: 3, paddingHorizontal: 6, borderRadius: 9, marginRight: 4 },
});