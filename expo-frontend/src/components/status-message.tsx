import { Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';

/** An icon, a heading and a line of explanation, with an optional action: for empty and error states. */
export function StatusMessage({
  icon,
  title,
  message,
  actionTitle,
  onAction,
  className = '',
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
  className?: string;
}) {
  const muted = useCSSVariable('--color-muted') as string;
  return (
    <View className={`items-center gap-2 px-8 py-16 ${className}`}>
      <Icon name={icon} size={44} color={muted} />
      <Text accessibilityRole="header" className="mt-2 text-center text-lg font-semibold text-foreground">
        {title}
      </Text>
      {message ? (
        <Text selectable className="text-center text-base text-muted">
          {message}
        </Text>
      ) : null}
      {actionTitle && onAction ? (
        <Button title={actionTitle} variant="secondary" onPress={onAction} className="mt-3" />
      ) : null}
    </View>
  );
}
