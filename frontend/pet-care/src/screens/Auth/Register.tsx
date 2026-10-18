import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { colors } from '../../color';
import { validateSignup } from '../../utils/validation';
import useAuth from '../../hooks/useAuth';

interface SignupForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SignupScreenProps {
  route: { params: { role: 'owner' | 'provider' } };
}

export default function SignupScreen({ route }: SignupScreenProps) {
  const { role } = route.params; // 'owner' | 'provider'
  const { register } = useAuth();
  const [form, setForm] = useState<SignupForm>({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof SignupForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    const found = validateSignup(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await register({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
    } catch (e) {
      const error = e as { status?: number; message?: string; fieldErrors?: Partial<Record<keyof SignupForm, string>> };
      if (error.fieldErrors) setErrors(error.fieldErrors);
      else setFormError(error.message ?? 'Unable to create account');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{role === 'provider' ? 'Create your provider account' : 'Create your account'}</Text>
        {role === 'provider' && (
          <Text style={styles.note}>Next you'll submit your documents for verification. You can start taking bookings once approved.</Text>
        )}

        <Input label="Full name" value={form.fullName} onChangeText={set('fullName')} error={errors.fullName}
          autoCapitalize="words" autoComplete="name" />
        <Input label="Email" value={form.email} onChangeText={set('email')} error={errors.email}
          keyboardType="email-address" autoComplete="email" />
        <Input label="Phone (optional)" value={form.phone} onChangeText={set('phone')} error={errors.phone}
          keyboardType="phone-pad" autoComplete="tel" />
        <Input label="Password" value={form.password} onChangeText={set('password')} error={errors.password}
          secureTextEntry autoComplete="new-password" />
        <Input label="Confirm password" value={form.confirmPassword} onChangeText={set('confirmPassword')}
          error={errors.confirmPassword} secureTextEntry autoComplete="new-password" />

        {!!formError && <Text style={styles.formError}>{formError}</Text>}
        <Button title="Create account" onPress={onSubmit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8 },
  note: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  formError: { color: colors.error, marginBottom: 12 },
});