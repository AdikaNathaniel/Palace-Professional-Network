import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';

/** Full-screen loading / error / empty states for a list screen. */
export function QueryState({
  isLoading,
  error,
  onRetry,
  emptyMessage,
}: {
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyMessage?: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
      {isLoading ? (
        <ActivityIndicator />
      ) : error ? (
        <>
          <Text className="text-center text-base text-foreground">{error.message}</Text>
          {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} /> : null}
        </>
      ) : (
        <Text className="text-center text-base text-muted">{emptyMessage}</Text>
      )}
    </View>
  );
}
