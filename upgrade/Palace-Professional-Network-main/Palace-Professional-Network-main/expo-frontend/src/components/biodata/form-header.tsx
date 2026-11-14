import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Icon } from '@/components/ui/icon';

type FormHeaderProps = {
  title: string;
  /** Leave out for a header with only Cancel (loading / error states). */
  save?: {
    onPress: () => void;
    /** iOS: Save is greyed out until the form is changed and valid. */
    enabled: boolean;
    /** Android: Save is tappable once something changed; invalid fields are then pointed out. */
    changed: boolean;
    saving: boolean;
  };
};

/**
 * The biodata form's Cancel / Save. iOS uses the native toolbar; it isn't
 * drawn on Android, so there they're header buttons (Save was missing).
 */
export function FormHeader({ title, save }: FormHeaderProps) {
  if (process.env.EXPO_OS === 'ios') {
    return (
      <>
        <Stack.Screen.Title>{title}</Stack.Screen.Title>
        <Stack.Toolbar placement="left">
          <Stack.Toolbar.Button onPress={() => router.back()}>Cancel</Stack.Toolbar.Button>
        </Stack.Toolbar>
        {save ? (
          <Stack.Toolbar placement="right">
            {save.saving ? (
              <Stack.Toolbar.View>
                <View className="h-8 w-12 items-center justify-center" accessibilityLabel="Saving">
                  <ActivityIndicator />
                </View>
              </Stack.Toolbar.View>
            ) : (
              <Stack.Toolbar.Button variant="done" disabled={!save.enabled} onPress={save.onPress}>
                Save
              </Stack.Toolbar.Button>
            )}
          </Stack.Toolbar>
        ) : null}
      </>
    );
  }

  return (
    <Stack.Screen
      options={{
        title,
        headerLeft: () => <CloseButton />,
        headerRight: save ? () => <SaveButton {...save} /> : undefined,
      }}
    />
  );
}

function CloseButton() {
  const foreground = useCSSVariable('--color-foreground') as string;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Cancel"
      onPress={() => router.back()}
      hitSlop={4}
      className="-ml-2 mr-2 size-12 items-center justify-center rounded-full active:opacity-60">
      <Icon name={{ ios: 'xmark', android: 'close' }} size={24} color={foreground} />
    </Pressable>
  );
}

function SaveButton({ onPress, changed, saving }: NonNullable<FormHeaderProps['save']>) {
  const accent = useCSSVariable('--color-accent') as string;
  if (saving) {
    return (
      <View className="h-12 w-16 items-center justify-center" accessibilityLabel="Saving">
        <ActivityIndicator color={accent} />
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Save"
      accessibilityState={{ disabled: !changed }}
      disabled={!changed}
      onPress={onPress}
      hitSlop={4}
      className={`h-12 justify-center rounded-full px-4 active:opacity-60 ${changed ? '' : 'opacity-40'}`}>
      <Text className="text-base font-semibold" style={{ color: accent }}>
        Save
      </Text>
    </Pressable>
  );
}
