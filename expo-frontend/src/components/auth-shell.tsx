import { Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from '@/components/ui/image';

/** Logo, title and a keyboard-aware scroll area shared by sign-in and register. */
export function AuthShell({
  subtitle,
  error,
  children,
}: {
  subtitle: string;
  /** Server error from the last submit, shown above the form. */
  error?: string | null;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-background">
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          gap: 24,
          paddingHorizontal: 28,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}>
        <View className="items-center gap-1">
          <Image
            source={require('@/assets/images/app_icon.png')}
            className="mb-4 size-28 rounded-full"
            accessibilityIgnoresInvertColors
          />
          <Text className="text-center text-xl font-bold text-accent">
            Palace Professional Network
          </Text>
          <Text className="text-center text-sm text-muted">{subtitle}</Text>
        </View>

        {error ? (
          <View className="rounded-xl border border-danger/30 bg-danger/10 p-3">
            <Text className="text-sm text-danger">{error}</Text>
          </View>
        ) : null}

        <View className="gap-4">{children}</View>
      </KeyboardAwareScrollView>
    </View>
  );
}
