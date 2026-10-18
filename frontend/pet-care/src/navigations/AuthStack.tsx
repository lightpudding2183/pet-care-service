import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/Login';
import SignupScreen from '../screens/Auth/Register';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerTitle: '' }}>
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Signup">
        {(props: any) => <SignupScreen {...props} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}