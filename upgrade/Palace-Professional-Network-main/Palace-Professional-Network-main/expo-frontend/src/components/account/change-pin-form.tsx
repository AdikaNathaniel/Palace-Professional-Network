import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { Button } from '@/components/ui/button';
import { PinInput, type PinInputHandle } from '@/components/ui/pin-input';
import { ApiError } from '@/lib/api/client';
import { authApi } from '@/lib/api/endpoints';
import { changePinSchema, type ChangePinValues } from '@/lib/validation';

type FieldName = keyof ChangePinValues;

/**
 * Current, new and confirm PIN, one step after another: each set of boxes
 * hands focus to the next once it's full. A wrong current PIN is shown on
 * that field, and whatever was typed elsewhere is kept.
 */
export function ChangePinForm() {
  // Separate calls: the React Compiler would memoize hooks inside an object literal.
  const currentRef = useRef<PinInputHandle>(null);
  const newRef = useRef<PinInputHandle>(null);
  const confirmRef = useRef<PinInputHandle>(null);
  const refs = { currentPin: currentRef, newPin: newRef, confirmPin: confirmRef };
  // Problems other than a wrong PIN (offline, server down) go above the form.
  const [failure, setFailure] = useState<string | null>(null);

  const { control, handleSubmit, setError } = useForm<ChangePinValues>({
    resolver: zodResolver(changePinSchema),
    defaultValues: { currentPin: '', newPin: '', confirmPin: '' },
  });

  const change = useMutation({
    mutationFn: ({ currentPin, newPin }: ChangePinValues) => authApi.changePin({ currentPin, newPin }),
    onSuccess: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Your PIN has been changed.');
      router.back();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        setError('currentPin', { message: error.message });
        refs.currentPin.current?.shake();
        refs.currentPin.current?.focus();
        return;
      }
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setFailure(error.message);
    },
  });

  // Built on each press: the callbacks reach for the PIN boxes' refs.
  const submit = () =>
    handleSubmit(
      (values) => {
        setFailure(null);
        change.mutate(values);
      },
      (errors) => {
        const first = (['currentPin', 'newPin', 'confirmPin'] as const).find((name) => errors[name]);
        if (!first) return;
        refs[first].current?.shake();
        refs[first].current?.focus();
      },
    )();

  const field = (name: FieldName, title: string, label: string, next?: FieldName, note?: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
        <View className="gap-3">
          <Text accessibilityRole="header" className="px-1 text-[13px] font-medium uppercase text-muted">
            {title}
          </Text>
          <View className="gap-3 rounded-2xl bg-surface px-4 py-5" style={{ borderCurve: 'continuous' }}>
            <PinInput
              ref={refs[name]}
              label={label}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoFocus={name === 'currentPin'}
              editable={!change.isPending}
              onComplete={() => (next ? refs[next].current?.focus() : refs[name].current?.blur())}
              error={error?.message}
            />
          </View>
          {note ? <Text className="px-1 text-[13px] text-muted">{note}</Text> : null}
        </View>
      )}
    />
  );

  return (
    <KeyboardAwareScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      // Room for the button under the active field, so it stays reachable.
      bottomOffset={96}
      className="flex-1 bg-background"
      contentContainerClassName="gap-7 p-4 pb-10">
      {failure ? (
        <View className="rounded-xl border border-danger/30 bg-danger/10 p-3" accessibilityLiveRegion="polite">
          <Text selectable className="text-sm text-danger">
            {failure}
          </Text>
        </View>
      ) : null}
      {field('currentPin', 'Current PIN', 'Current PIN', 'newPin')}
      {field('newPin', 'New PIN', 'New PIN', 'confirmPin', 'You’ll use this PIN to sign in from now on.')}
      {field('confirmPin', 'Confirm New PIN', 'Confirm new PIN')}
      <Button title="Update PIN" loading={change.isPending} onPress={submit} />
    </KeyboardAwareScrollView>
  );
}
