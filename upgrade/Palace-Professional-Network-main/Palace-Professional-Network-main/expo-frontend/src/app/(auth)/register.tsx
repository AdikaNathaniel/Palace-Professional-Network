import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { PinInput, type PinInputHandle } from '@/components/ui/pin-input';
import { TextField } from '@/components/ui/text-field';
import { authApi } from '@/lib/api/endpoints';
import { registerSchema, type RegisterValues } from '@/lib/validation';
import { useSession } from '@/stores/session';

export default function RegisterScreen() {
  const signIn = useSession((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);
  const pinRef = useRef<PinInputHandle>(null);
  const confirmRef = useRef<PinInputHandle>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phoneNumber: '', fullName: '', pin: '', confirmPin: '' },
  });

  // Built on each press: the callbacks reach for the PIN boxes' refs.
  const onSubmit = () =>
    handleSubmit(
      async ({ phoneNumber, fullName, pin }) => {
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
      },
      (invalid) => {
        if (invalid.pin) pinRef.current?.shake();
        else if (invalid.confirmPin) confirmRef.current?.shake();
      },
    )();

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
            returnKeyType="next"
            onSubmitEditing={() => pinRef.current?.focus()}
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
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Create a 4-digit PIN</Text>
            <PinInput
              ref={pinRef}
              label="New PIN"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onComplete={() => confirmRef.current?.focus()}
              editable={!isSubmitting}
              error={errors.pin?.message}
            />
          </View>
        )}
      />
      <Controller
        control={control}
        name="confirmPin"
        render={({ field }) => (
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Confirm PIN</Text>
            <PinInput
              ref={confirmRef}
              label="Confirm PIN"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onComplete={() => confirmRef.current?.blur()}
              editable={!isSubmitting}
              error={errors.confirmPin?.message}
            />
          </View>
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
