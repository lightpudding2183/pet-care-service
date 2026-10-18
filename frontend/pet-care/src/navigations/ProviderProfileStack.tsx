import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EditProviderProfileScreen from '../screens/Providers/EditProviderProfile';
import ProviderProfileScreen from '../screens/Providers/ProviderProfile';

const Stack = createNativeStackNavigator();

export default function ProviderProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ title: 'My profile' }} />
      <Stack.Screen name="EditProviderProfile" component={EditProviderProfileScreen} options={{ title: 'Edit profile' }} />
    </Stack.Navigator>
  );
}