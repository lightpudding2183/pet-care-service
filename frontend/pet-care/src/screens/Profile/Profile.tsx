import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';

// Minimal for now: identity + logout. Settings and earnings come later.
export default function ProfileScreen() {
  const { user, logout } = useAuth() as {
    user?: {
      avatar_url?: string | null;
      full_name?: string;
      email?: string;
    };
    logout: () => void;
  };

  const safeUser = user ?? {};

  return (
    <View style={styles.container}>
      <Avatar uri={safeUser.avatar_url as any} name={safeUser.full_name ?? 'User'} size={88} />
      <Text style={styles.name}>{safeUser.full_name ?? 'User'}</Text>
      <Text style={styles.email}>{safeUser.email ?? 'No email available'}</Text>
      <View style={styles.action}>
        <Button title="Log out" variant="outline" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', padding: 32, paddingTop: 48 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 16 },
  email: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  action: { alignSelf: 'stretch', marginTop: 40 },
});