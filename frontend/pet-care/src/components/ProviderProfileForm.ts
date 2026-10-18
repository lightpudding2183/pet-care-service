import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Button from './Button';
import Input from './Input';
import { colors } from '../color';

interface ProviderProfileFormProps {
  initial?: any;
  submitLabel: string;
  onSubmit: (payload: any) => Promise<void>;
  header?: React.ReactNode;
}

export default function ProviderProfileForm({ initial = {}, submitLabel, onSubmit, header }: ProviderProfileFormProps) {
  const [form, setForm] = useState({
    businessName: initial.businessName ?? initial.business_name ?? '',
    address: initial.address ?? '',
    latitude: initial.latitude ?? '',
    longitude: initial.longitude ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (key: string) => (value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    const found: Record<string, string> = {};
    if (!form.businessName.trim()) found.businessName = 'Enter your business name';
    if (!form.address.trim()) found.address = 'Enter your address';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      await onSubmit({
        business_name: form.businessName.trim(),
        address: form.address.trim(),
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });
    } catch (e) {
      const error = e as { fieldErrors?: Record<string, string>; message?: string };
      if (error.fieldErrors) setErrors(error.fieldErrors);
      else setFormError(error.message ?? 'Unable to save profile');
      setLoading(false);
    }
  };

  return React.createElement(
    KeyboardAvoidingView,
    {
      style: styles.flex,
      behavior: Platform.OS === 'ios' ? 'padding' : undefined,
    },
    React.createElement(
      ScrollView,
      {
        contentContainerStyle: styles.container,
        keyboardShouldPersistTaps: 'handled',
      },
      header,
      React.createElement(Input, {
        label: 'Business Name',
        value: form.businessName,
        onChangeText: set('businessName'),
        error: errors.businessName,
        placeholder: 'Your business name',
      }),
      React.createElement(Input, {
        label: 'Address',
        value: form.address,
        onChangeText: set('address'),
        error: errors.address,
        placeholder: 'Service address',
        autoCapitalize: 'words',
      }),
      React.createElement(Input, {
        label: 'Latitude (optional)',
        value: form.latitude,
        onChangeText: set('latitude'),
        keyboardType: 'decimal-pad',
        placeholder: 'e.g., 37.7749',
      }),
      React.createElement(Input, {
        label: 'Longitude (optional)',
        value: form.longitude,
        onChangeText: set('longitude'),
        keyboardType: 'decimal-pad',
        placeholder: 'e.g., -122.4194',
      }),
      !!formError &&
        React.createElement(
          Text,
          { style: styles.formError },
          formError
        ),
      React.createElement(Button, {
        title: submitLabel,
        onPress: handleSubmit,
        loading: loading,
      })
    )
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  formError: { color: colors.error, marginBottom: 12 },
});