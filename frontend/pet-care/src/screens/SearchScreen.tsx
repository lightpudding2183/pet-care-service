import React, { useState, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  View,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSearch } from '../hooks/useSearch';
import { SERVICES } from '../constants/provider';
import ProviderCard from '../components/ProviderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { colors } from '../color';

export default function SearchScreen({ navigation }: { navigation: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const { providers, loading, refreshing, error, triggerRefresh } = useSearch();
  const serverFilters = topRatedOnly ? { minRating: 4 } : {};

  useFocusEffect(
    useCallback(() => {
      triggerRefresh(serverFilters);
      return () => {};
    }, [triggerRefresh, topRatedOnly])
  );

  const handleTopRatedToggle = () => {
    setTopRatedOnly((enabled) => !enabled);
  };

  const filteredProviders = providers.filter((provider: any) => {
    const services = provider.provider_services ?? provider.providerServices ?? [];
    const matchesService = services.some((entry: any) => {
      const name = entry.service?.service_name ?? entry.service?.serviceName ?? '';
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const serviceAliases: Record<string, string[]> = {
        drop_in: ['drop_in_visits'],
      };
      return normalizedName === selectedService
        || normalizedName.startsWith(`${selectedService}_`)
        || serviceAliases[selectedService]?.includes(normalizedName);
    });
    const searchableText = [
      provider.business_name,
      provider.businessName,
      provider.address,
      ...services.map((entry: any) => entry.service?.service_name ?? entry.service?.serviceName ?? ''),
    ].join(' ').toLowerCase();
    return matchesService && searchableText.includes(searchTerm.trim().toLowerCase());
  });

  if (loading) return <LoadingSpinner />;

  if (error && !providers.length) {
    return <EmptyState title="Couldn't load providers" message={error} actionLabel="Try again" onAction={() => triggerRefresh(serverFilters)} />;
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => triggerRefresh(serverFilters)}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for providers..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          keyboardType="default"
          returnKeyType="search"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filtersBar}>
        <Pressable onPress={handleTopRatedToggle} style={[styles.ratingToggle, topRatedOnly && styles.ratingToggleActive]}>
          <Text style={[styles.ratingToggleText, topRatedOnly && styles.ratingToggleTextActive]}>
            {topRatedOnly ? 'Top rated (4+)' : 'Top rated'}
          </Text>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceFilters}>
          {SERVICES.map((service) => {
            const selected = selectedService === service.value;
            return (
              <Pressable
                key={service.value}
                onPress={() => setSelectedService(service.value)}
                style={[styles.serviceFilter, selected && styles.serviceFilterSelected]}
              >
                <Text style={[styles.serviceFilterText, selected && styles.serviceFilterTextSelected]}>{service.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <Text style={styles.resultCount}>
        {selectedService
          ? `${filteredProviders.length} ${filteredProviders.length === 1 ? 'provider' : 'providers'}`
          : 'Choose a service to find providers'}
      </Text>

      {!!selectedService && filteredProviders.length === 0 && (
        <View style={resultsStyle.empty}>
          <EmptyState
            title="No providers found"
            message="Try another name or service."
            actionLabel="Refresh"
            onAction={() => triggerRefresh(serverFilters)}
          />
        </View>
      )}

      <View style={styles.list}>
        {selectedService
          ? filteredProviders.map((provider: any) => (
              <ProviderCard key={String(provider.id)} provider={provider} navigation={navigation} serviceId={selectedService} />
            ))
          : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20 },
  header: { paddingVertical: 16 },
  searchInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  filtersBar: { marginBottom: 12 },
  ratingToggle: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12 },
  ratingToggleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ratingToggleText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  ratingToggleTextActive: { color: colors.white },
  serviceFilters: { gap: 8, paddingBottom: 4 },
  serviceFilter: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  serviceFilterSelected: { backgroundColor: colors.surface, borderColor: colors.primary },
  serviceFilterText: { color: colors.textMuted, fontSize: 13 },
  serviceFilterTextSelected: { color: colors.primary, fontWeight: '600' },
  resultCount: { color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  list: { marginTop: 12 },
});

const resultsStyle = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
});
