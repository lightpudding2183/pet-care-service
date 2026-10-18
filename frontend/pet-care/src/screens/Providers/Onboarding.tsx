import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createProviderRequest } from '../../api/providers.api';
import Button from '../../components/Button';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';
import ProviderProfileForm from '../../components/ProviderProfileForm';

export default function ProviderOnboardingScreen() {
  const { updateUser, logout } = useAuth();

  const handleSubmit = async (payload: any) => {
    const provider = await createProviderRequest(payload);
    // RootNavigator moves to the pending-review screen once providerId is set
    updateUser({ providerId: provider.id, verificationStatus: provider.verificationStatus ?? 'pending' });
  };

  return (
    <ProviderProfileForm
      submitLabel="Submit for review"
      onSubmit={handleSubmit}
      header={
        <View style={styles.header}>
          <Text style={styles.title}>Set up your provider profile</Text>
          <Text style={styles.subtitle}>Owners see this when choosing who to book. We review every profile before it goes live.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: 24, marginTop: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
});