import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/SearchScreen';
import ProviderDetailsScreen from '../screens/Providers/ProviderDetails';
import BookingPetSelectionScreen from '../screens/Bookings/BookingPetSelection';
import BookingRequestScreen from '../screens/Bookings/BookingRequest';
import BookingDetailScreen from '../screens/Bookings/BookingDetails';
import CheckoutScreen from '../screens/Payments/Checkout';
import PaymentDetailScreen from '../screens/Payments/Detail';

type ProviderBrowseStackParamList = {
  ProviderSearch: undefined;
  ProviderDetails: { providerId: string; serviceId?: string };
  BookingPetSelection: { provider: any; serviceId: string; availabilityWindowId?: string };
  BookingRequest: {
    provider: any;
    serviceId?: string;
    availabilityWindowId?: string;
    selectedPetId?: string;
    selectedPetName?: string;
    stage?: number;
  };
  BookingDetail: { bookingId: string; booking?: any };
  Checkout: { booking: any };
  PaymentDetail: { paymentId: string; payment?: any };
};

const Stack = createNativeStackNavigator<ProviderBrowseStackParamList>();

export default function ProviderBrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="ProviderSearch" component={SearchScreen} options={{ title: 'Find care' }} />
      <Stack.Screen name="ProviderDetails" component={ProviderDetailsScreen} options={{ title: 'Provider' }} />
      <Stack.Screen name="BookingPetSelection" component={BookingPetSelectionScreen} options={{ title: 'Choose a pet' }} />
      <Stack.Screen name="BookingRequest" component={BookingRequestScreen} options={{ title: 'Book a service' }} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} options={{ title: 'Booking' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Pay for booking' }} />
      <Stack.Screen name="PaymentDetail" component={PaymentDetailScreen} options={{ title: 'Payment' }} />
    </Stack.Navigator>
  );
}
