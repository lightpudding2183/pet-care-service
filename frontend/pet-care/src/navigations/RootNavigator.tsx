import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import AuthStack from './AuthStack';
import OwnerTabNavigator from './OwnerTabNavigator';
import ProviderTabNavigator from './ProviderTabNavigator';
import Button from '../components/Button';
import useAuth from '../hooks/useAuth';
import ProviderOnboardingScreen from '@/screens/Providers/Onboarding';
import ProviderPendingScreen from '@/screens/Providers/Pending';
import { colors } from '../color';

// --- Placeholders: replace with real navigators as features are built ---
type PlaceholderProps = {
  title: string;
};

const Placeholder = ({ title }: PlaceholderProps) => {
  const { logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16 }}>{title}</Text>
      <Button title="Log out" variant="outline" onPress={logout} />
    </View>
  );
};

const AdminNavigator = () => {
  const { logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', marginBottom: 16 }}>Admin home</Text>
      <Button title="Log out" variant="outline" onPress={logout} />
    </View>
  );
};

// -----------------------------------------------------------------------

export default function RootNavigator() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'unauthenticated' || !user) return <AuthStack />;

  switch (user.role) {
    case 'admin':
      return <AdminNavigator />;
    case 'provider':
      // Assumes the API returns user.verificationStatus for providers
      if (!user.providerId) return <ProviderOnboardingScreen />;
      if (user.verificationStatus !== 'approved') return <ProviderPendingScreen />;
      return <ProviderTabNavigator />;

    default:
      return <OwnerTabNavigator />;
  }
}