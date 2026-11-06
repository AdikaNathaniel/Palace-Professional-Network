import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { PinInput, type PinInputHandle } from '@/components/ui/pin-input';
import { TextField } from '@/components/ui/text-field';
import { authApi } from '@/lib/api/endpoints';
import { phoneNumber, signInSchema, type SignInValues } from '@/lib/validation';
import { useSession } from '@/stores/session';

export default function SignInScreen() {
  const signIn = useSession((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);
  const pinRef = useRef<PinInputHandle>(null);

  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phoneNumber: '', pin: '' },
  });

  // Built on each press: the callbacks reach for the PIN boxes' ref.
  const onSubmit = () =>
    handleSubmit(
      async (values) => {
        setError(null);
        try {
          // The root layout's guard swaps to the app once the session is set.
          await signIn(await authApi.login(values));
        } catch (e) {
          setError((e as Error).message);
          // Start the PIN again rather than make them delete four dots.
          setValue('pin', '');
          pinRef.current?.shake();
          pinRef.current?.focus();
        }
      },
      (invalid) => {
        if (invalid.pin) pinRef.current?.shake();
      },
    )();

  // Typing the last digit signs in, once there's a phone number to go with it.
  const submitIfReady = () => {
    if (phoneNumber.safeParse(getValues('phoneNumber')).success && !isSubmitting) void onSubmit();
  };

  return (
    <AuthShell subtitle="Sign in to continue" error={error}>
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
            returnKeyType="next"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={() => pinRef.current?.focus()}
            error={errors.phoneNumber?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="pin"
        render={({ field }) => (
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">4-digit PIN</Text>
            <PinInput
              ref={pinRef}
              label="PIN"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              onComplete={submitIfReady}
              editable={!isSubmitting}
              error={errors.pin?.message}
            />
          </View>
        )}
      />
      <Button title="Sign in" loading={isSubmitting} onPress={onSubmit} className="mt-2" />
      <Link href="/register" asChild>
        <Button title="Don't have an account? Register" variant="ghost" disabled={isSubmitting} />
      </Link>
    </AuthShell>
  );
}
