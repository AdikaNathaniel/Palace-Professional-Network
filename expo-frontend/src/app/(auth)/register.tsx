import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { authApi } from '@/lib/api/endpoints';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { useSession } from '@/stores/session';

export default function RegisterScreen() {
  const signIn = useSession((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phoneNumber: '', fullName: '', pin: '', confirmPin: '' },
  });

  const onSubmit = handleSubmit(async ({ phoneNumber, fullName, pin }) => {
    setError(null);
    try {
      const session = await authApi.register({
        phoneNumber,
        pin,
        fullName: fullName || undefined,
      });
      // New members go straight to the biodata form (see the (app) layout).
      await signIn(session, { justRegistered: true });
    } catch (e) {
      setError((e as Error).message);
    }
  });

  return (
    <AuthShell subtitle="Create your account" error={error}>
      <Controller
        control={control}
        name="phoneNumber"
        render={({ field }) => (
          <TextField
            label="Phone number"
            placeholder="e.g. 0244000000"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phoneNumber?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="fullName"
        render={({ field }) => (
          <TextField
            label="Full name"
            placeholder="e.g. Mr. Vincent Kumah"
            autoComplete="name"
            textContentType="name"
            autoCapitalize="words"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.fullName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="pin"
        render={({ field }) => (
          <TextField
            label="Create a 4-digit PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.pin?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPin"
        render={({ field }) => (
          <TextField
            label="Confirm PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={onSubmit}
            error={errors.confirmPin?.message}
          />
        )}
      />
      <Button title="Register" loading={isSubmitting} onPress={onSubmit} className="mt-2" />
      <Button
        title="Already have an account? Sign in"
        variant="ghost"
        disabled={isSubmitting}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
      />
    </AuthShell>
  );
}
