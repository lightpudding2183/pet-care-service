import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfileScreen from '../screens/Profile/Profile';
import BookingsStack from './BookingStack';
import PetsStack from './PetStack';
import ProviderBrowseStack from './ProviderBrowseStack';
import { colors } from '../color';

const Tab = createBottomTabNavigator();

// Add Browse / Bookings / Chat tabs here as those features land
export default function OwnerTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="BrowseTab" component={ProviderBrowseStack}
        options={{ title: 'Browse', tabBarIcon: ({ color, size }) =>
          <Ionicons name="search-outline" color={color} size={size} /> }} />
      <Tab.Screen name="PetsTab" component={PetsStack}
        options={{ title: 'My pets', tabBarIcon: ({ color, size }) => 
          <Ionicons name="paw-outline" color={color} size={size} /> }} />
      <Tab.Screen name="BookingsTab" component={BookingsStack}
        options={{ title: 'Bookings', tabBarIcon: ({ color, size }) => 
          <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tab.Screen name="AccountTab" component={ProfileScreen}
        options={{ title: 'Account', headerShown: true, tabBarIcon: ({ color, size }) => 
          <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}