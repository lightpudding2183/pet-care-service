import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AvailabilityScreen from '../screens/Providers/Availability';
import BookingsStack from './BookingStack';
import ProviderProfileStack from './ProviderProfileStack';
import { colors } from '../color';

const Tab = createBottomTabNavigator();

// Add Requests / Jobs / Chat / Earnings tabs here as those features land
export default function ProviderTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="ScheduleTab" component={AvailabilityScreen}
        options={{ title: 'Schedule', headerShown: true, tabBarIcon: ({ color, size }) => 
          <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tab.Screen name="BookingsTab" component={BookingsStack}
        options={{ title: 'Bookings', tabBarIcon: ({ color, size }) => 
          <Ionicons name="clipboard-outline" color={color} size={size} /> }} />
      <Tab.Screen name="ProviderProfileTab" component={ProviderProfileStack}
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => 
          <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}