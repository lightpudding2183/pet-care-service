import React, { useCallback, useLayoutEffect } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import EmptyState from '../../components/EmptyState';
import LoadingSpinner from '../../components/LoadingSpinner';
import { colors } from '../../color';
import PetCard from '../../components/PetCard';
import usePets from '../../hooks/usePets';

type MyPetsScreenProps = {
  navigation: any;
};

export default function MyPetsScreen({ navigation }: MyPetsScreenProps) {
  const { pets, loading, refreshing, error, fetchPets } = usePets();

  // Refetch whenever the screen regains focus (after add/edit/delete)
  useFocusEffect(useCallback(() => { fetchPets(); }, [fetchPets]));

  const goAdd = useCallback(() => navigation.navigate('AddEditPet'), [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={goAdd} hitSlop={8}>
          <Text style={styles.headerAction}>Add pet</Text>
        </Pressable>
      ),
    });
  }, [navigation, goAdd]);

  if (loading) return <LoadingSpinner />;

  if (error && !pets.length) {
    return <EmptyState title="Couldn't load your pets" message={error} actionLabel="Try again" onAction={() => fetchPets()} />;
  }

  return (
    <FlatList
      data={pets}
      keyExtractor={(p) => String(p.id)}
      renderItem={({ item }) => {
        const pet = item as any;
        return <PetCard pet={pet} onPress={() => navigation.navigate('PetDetail', { pet: item })} />;
      }}
      contentContainerStyle={pets.length ? styles.list : styles.emptyList}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPets({ refresh: true })} tintColor={colors.primary} />}
      ListEmptyComponent={
        <EmptyState
          title="No pets yet"
          message="Add your pet's details so providers know who they're caring for."
          actionLabel="Add a pet"
          onAction={goAdd}
        />
      }
      style={styles.flex}
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  list: { padding: 20 },
  emptyList: { flexGrow: 1 },
  headerAction: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});