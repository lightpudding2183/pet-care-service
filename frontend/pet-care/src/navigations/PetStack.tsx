import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddEditPetScreen from '../screens/Pets/AddEditPet';
import MyPetsScreen from '../screens/Pets/MyPet';
import PetDetailScreen from '../screens/Pets/PetDetail';

type PetStackParamList = {
  MyPets: undefined;
  PetDetail: { pet: { name?: string } };
  AddEditPet: { pet?: { name?: string } } | undefined;
};

const Stack = createNativeStackNavigator<PetStackParamList>();

export default function PetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="MyPets" component={MyPetsScreen} options={{ title: 'My pets' }} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen}
        options={({ route }: any) => ({ title: route.params?.pet?.name ?? 'Pet' })} />
      <Stack.Screen name="AddEditPet" component={AddEditPetScreen}
        options={({ route }: any) => ({ title: route.params?.pet ? 'Edit pet' : 'Add a pet' })} />
    </Stack.Navigator>
  );
}