import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import useAuth from '../hooks/useAuth';
import BookingDetailScreen from '@/screens/Bookings/BookingDetails';
import BookingRequestScreen from '@/screens/Bookings/BookingRequest';
import BookingPetSelectionScreen from '@/screens/Bookings/BookingPetSelection';
import BookingsScreen from '@/screens/Bookings/Bookings';
import ProviderProfileScreen from '@/screens/Providers/ProviderProfile';
import CheckoutScreen from '@/screens/Payments/Checkout';
import PaymentDetailScreen from '@/screens/Payments/Detail';
import PaymentHistoryScreen from '@/screens/Payments/History';

type BookingStackParamList = {
  BookingsList: undefined;
  BookingDetail: { bookingId: string; booking?: any };
  ProviderProfile: undefined;
  BookingRequest: { provider: any; serviceId?: string; availabilityWindowId?: string; selectedPetId?: string; selectedPetName?: string; stage?: number };
  BookingPetSelection: { provider: any; serviceId: string; availabilityWindowId?: string };
  Checkout: { bookingId: string; booking: any };
  PaymentHistory: undefined;
  PaymentDetail: { paymentId: string; payment?: any };
};

const Stack = createNativeStackNavigator<BookingStackParamList>();

// Shared by the owner and provider tabs. ProviderProfile + BookingRequest are here so an
// owner can go provider profile -> "Book this provider" inside the Bookings tab.
export default function BookingsStack() {
  const { user } = useAuth();
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="BookingsList" component={BookingsScreen}
        options={{ title: user?.role === 'provider' ? 'Bookings' : 'My bookings' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ title: 'Provider' }} />
      <Stack.Screen name="BookingRequest" component={BookingRequestScreen} options={{ title: 'Book a service' }} />
      <Stack.Screen name="BookingPetSelection" component={BookingPetSelectionScreen} options={{ title: 'Choose a pet' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pay for booking' }} />
      <Stack.Screen name="PaymentHistory" component={PaymentHistoryScreen} options={{ title: 'Payments' }} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} options={{ title: 'Payment' }} />

    </Stack.Navigator>
  );
}