import React from 'react';
import { updateProviderRequest } from '../../api/providers.api';
import ProviderProfileForm from '../../components/ProviderProfileForm';

const TypedProviderProfileForm = ProviderProfileForm as React.ComponentType<{
  initial: any;
  submitLabel: string;
  onSubmit: (payload: any) => Promise<void>;
}>;

export default function EditProviderProfileScreen({ route, navigation }: { route: any; navigation: any }) {
  const { provider } = route.params;

  const handleSubmit = async (payload: any) => {
    await updateProviderRequest(provider.id, payload);
    navigation.goBack(); // profile screen refetches on focus
  };

  return <TypedProviderProfileForm initial={provider} submitLabel="Save changes" onSubmit={handleSubmit} />;
}