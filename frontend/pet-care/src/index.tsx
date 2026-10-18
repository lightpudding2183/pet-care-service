import { Text, View, StyleSheet } from "react-native";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider } from "./context/AuthContext";
import RootNavigator from "./navigations/RootNavigator";
import { registerRootComponent } from "expo";
import { STRIPE_PUBLISHABLE_KEY } from "./config";
import { StripeProvider } from '@stripe/stripe-react-native';


export default function Index() {
  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <AuthProvider>
          <NavigationContainer>
            <RootNavigator />
            <StatusBar barStyle="default" />
          </NavigationContainer>
        </AuthProvider>
      </StripeProvider>    
    </SafeAreaProvider>

  );
}

registerRootComponent(Index);

/*
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
*/
