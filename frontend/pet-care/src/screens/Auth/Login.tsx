import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../color';
import { validateLogin } from '../../utils/validation';
import useAuth from '../../hooks/useAuth';

export default function LoginScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    const found = validateLogin(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await login({ email: form.email.trim().toLowerCase(), password: form.password });
      // RootNavigator swaps to the main app once status becomes 'authenticated'
    } catch (e) {
      const error = e as { status?: number; message?: string };
      setFormError(error.status === 401 ? 'Incorrect email or password' : error.message ?? 'Unable to log in');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to manage your pets and bookings.</Text>

        <Input label="Email" value={form.email} onChangeText={set('email')} error={errors.email}
          keyboardType="email-address" autoComplete="email" placeholder="you@example.com" />
        <Input label="Password" value={form.password} onChangeText={set('password')} error={errors.password}
          secureTextEntry autoComplete="password" placeholder="Your password" />

        {!!formError && <Text style={styles.formError}>{formError}</Text>}
        <Button title="Log in" onPress={onSubmit} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to the app? </Text>
          <Pressable onPress={() => navigation.navigate('RoleSelect')}>
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.textMuted, marginTop: 6, marginBottom: 28 },
  formError: { color: colors.error, marginBottom: 12 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: '600' },
});