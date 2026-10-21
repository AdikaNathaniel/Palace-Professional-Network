import type { ReactNode } from 'react';
import { Alert } from 'react-native';

import type { IconName } from '@/components/ui/icon';

export type RowAction = { label: string; icon: IconName; onPress: () => void };

/**
 * Android (and web): Compose list rows have no long-press menu here, so the
 * row's tap opens the same actions in an alert instead (see rowPressHandler).
 * The iOS version wraps the row in a native context menu.
 */
export function RowActions({ children }: { actions: RowAction[]; children: ReactNode }) {
  return children;
}

export function rowPressHandler(title: string, actions: RowAction[]) {
  if (!actions.length) return undefined;
  return () =>
    Alert.alert(title, undefined, [
      ...actions.map((a) => ({ text: a.label, onPress: a.onPress })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
}
