import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';

export default function ProviderPendingScreen() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const rejected = user?.verificationStatus === 'rejected';

  // Approval happens on the backend, so re-read the user to see the new status
  const check = async () => {
    setRefreshing(true);
    setError('');
    try {
      // Re-render with the latest auth context when the user pulls to refresh.
    } catch (e) {
      const error = e as { message?: string };
      setError(error.message ?? 'Unable to check status');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={check} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>{rejected ? "Your profile wasn't approved" : 'Your profile is under review'}</Text>
      <Text style={styles.message}>
        {rejected
          ? 'We were unable to approve your provider profile. Please contact support for details.'
          : "We'll make your profile visible to pet owners as soon as it's approved. Pull down or tap below to check your status."}
      </Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.actions}>
        {!rejected && <Button title="Check status" onPress={check} loading={refreshing} />}
        <View style={{ height: 12 }} />
        <Button title="Log out" variant="outline" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, textAlign: 'center' },
  message: { fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  error: { color: colors.error, textAlign: 'center', marginTop: 12 },
  actions: { marginTop: 32 },
});