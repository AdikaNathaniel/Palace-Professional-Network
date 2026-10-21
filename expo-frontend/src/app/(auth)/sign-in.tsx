import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { AuthShell } from '@/components/auth-shell';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { authApi } from '@/lib/api/endpoints';
import { signInSchema, type SignInValues } from '@/lib/validation';
import { useSession } from '@/stores/session';

export default function SignInScreen() {
  const signIn = useSession((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phoneNumber: '', pin: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      // The root layout's guard swaps to the app once the session is set.
      await signIn(await authApi.login(values));
    } catch (e) {
      setError((e as Error).message);
    }
  });

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
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.phoneNumber?.message}
          />
        )}
      />
      {/* TODO: replace with the PIN boxes input when porting pin_boxes_field.dart. */}
      <Controller
        control={control}
        name="pin"
        render={({ field }) => (
          <TextField
            label="4-digit PIN"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={4}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            onSubmitEditing={onSubmit}
            error={errors.pin?.message}
          />
        )}
      />
      <Button title="Sign in" loading={isSubmitting} onPress={onSubmit} className="mt-2" />
      <Link href="/register" asChild>
        <Button title="Don't have an account? Register" variant="ghost" disabled={isSubmitting} />
      </Link>
    </AuthShell>
  );
}
