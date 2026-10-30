import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import Input from '../../components/Input';
import SegmentedControl from '../../components/SegmentedControl';
import { colors } from '../../color';
import useAuth from '../../hooks/useAuth';
import {
  createAvatarUploadUrlRequest,
  updateProfileRequest,
  uploadAvatarRequest,
} from '../../api/users.api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth() as {
    user?: Record<string, unknown> | null;
    logout: () => void;
    updateUser: (updates: Record<string, unknown>) => void;
  };

  const safeUser = user ?? {};
  const [activeTab, setActiveTab] = useState('details');
  const [fullName, setFullName] = useState(String(safeUser.full_name ?? ''));
  const [phone, setPhone] = useState(String(safeUser.phone ?? ''));
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setFullName(String(safeUser.full_name ?? ''));
    setPhone(String(safeUser.phone ?? ''));
  }, [safeUser.full_name, safeUser.phone]);

  const saveProfile = async () => {
    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setFormError('Name must be at least 2 characters.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const updatedProfile = await updateProfileRequest({
        full_name: trimmedName,
        phone: phone.trim(),
      });
      updateUser(updatedProfile);
      setActiveTab('details');
    } catch (error) {
      setFormError((error as { message?: string }).message ?? 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to choose a profile picture.');
      return;
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (selection.canceled) return;

    const asset = selection.assets[0];
    const contentType = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) {
      Alert.alert('Unsupported image', 'Choose a JPEG, PNG, or WebP image.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { uploadUrl, avatarUrl } = await createAvatarUploadUrlRequest(contentType);
      await uploadAvatarRequest(uploadUrl, asset.uri, contentType);
      const updatedProfile = await updateProfileRequest({ avatar_url: avatarUrl });
      updateUser(updatedProfile);
    } catch (error) {
      Alert.alert('Avatar not updated', (error as { message?: string }).message ?? 'Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Avatar
          uri={typeof safeUser.avatar_url === 'string' ? safeUser.avatar_url : null}
          name={String(safeUser.full_name ?? 'User')}
          size={88}
        />
        <Text style={styles.name}>{String(safeUser.full_name ?? 'User')}</Text>
        <Text style={styles.email}>{String(safeUser.email ?? 'No email available')}</Text>
      </View>

      <SegmentedControl
        options={[{ key: 'details', label: 'Profile details' }, { key: 'edit', label: 'Edit profile' }]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'details' ? (
        <View style={styles.details}>
          <Text style={styles.sectionTitle}>Account information</Text>
          <DetailRow label="Full name" value={safeUser.full_name} />
          <DetailRow label="Email" value={safeUser.email} />
          <DetailRow label="Phone" value={safeUser.phone} />
          <DetailRow label="Account type" value={safeUser.role} capitalize />
          <DetailRow label="Account ID" value={safeUser.id} />
          <View style={styles.action}>
            <Button title="Log out" variant="outline" onPress={logout} />
          </View>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Edit your profile</Text>
          <View style={styles.avatarEditor}>
            <Avatar
              uri={typeof safeUser.avatar_url === 'string' ? safeUser.avatar_url : null}
              name={String(safeUser.full_name ?? 'User')}
              size={76}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              disabled={uploadingAvatar}
              onPress={changeAvatar}
              style={styles.avatarButton}
            >
              <Text style={styles.avatarButtonText}>{uploadingAvatar ? 'Uploading...' : 'Change photo'}</Text>
            </Pressable>
          </View>
          <Input
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            autoCapitalize="words"
            maxLength={200}
          />
          <Input
            label="Email address"
            value={String(safeUser.email ?? '')}
            editable={false}
          />
          <Input
            label="Phone number"
            value={phone}
            onChangeText={setPhone}
            placeholder="Add a phone number"
            keyboardType="phone-pad"
            maxLength={30}
          />
          {!!formError && <Text style={styles.error}>{formError}</Text>}
          <Button title="Save changes" onPress={saveProfile} loading={saving} />
        </View>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value, capitalize = false }: { label: string; value: unknown; capitalize?: boolean }) {
  const displayValue = value == null || value === '' ? 'Not provided' : String(value);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, capitalize && styles.capitalize]}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 36 },
  header: { alignItems: 'center', paddingTop: 32, paddingBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 14 },
  email: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  details: { paddingHorizontal: 24, paddingTop: 20 },
  form: { paddingHorizontal: 24, paddingTop: 20 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16 },
  detailRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { color: colors.textMuted, fontSize: 13, marginBottom: 5 },
  detailValue: { color: colors.text, fontSize: 16 },
  capitalize: { textTransform: 'capitalize' },
  avatarEditor: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  avatarButton: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.surface },
  avatarButtonText: { color: colors.primary, fontWeight: '600' },
  action: { marginTop: 28 },
  error: { color: colors.error, fontSize: 13, marginBottom: 12 },
});