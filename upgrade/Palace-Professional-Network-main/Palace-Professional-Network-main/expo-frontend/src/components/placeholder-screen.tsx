import { ScrollView, Text, View } from 'react-native';

/**
 * Stand-in for screens that haven't been ported from the Flutter app yet,
 * so the navigation structure can be exercised end to end.
 */
export function PlaceholderScreen({
  title,
  flutterSource,
  children,
}: {
  title: string;
  /** The Dart file this screen will be ported from. */
  flutterSource: string;
  children?: React.ReactNode;
}) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 p-4">
      <View className="gap-1 rounded-2xl border border-border bg-surface p-4">
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted">Not ported yet — from {flutterSource}</Text>
      </View>
      {children}
    </ScrollView>
  );
}
