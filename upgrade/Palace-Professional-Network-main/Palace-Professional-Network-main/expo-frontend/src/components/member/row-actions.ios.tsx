import { Button, ContextMenu } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';

import type { RowAction } from '@/components/member/row-actions';

/** Long-press a row for its actions, in a native SwiftUI context menu. */
export function RowActions({ actions, children }: { actions: RowAction[]; children: ReactNode }) {
  if (!actions.length) return children;
  return (
    <ContextMenu>
      <ContextMenu.Items>
        {actions.map((a) => (
          <Button key={a.label} label={a.label} systemImage={a.icon.ios} onPress={a.onPress} />
        ))}
      </ContextMenu.Items>
      <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
    </ContextMenu>
  );
}

/** iOS opens the menu with a long press, so a tap does nothing extra. */
export function rowPressHandler(_title: string, _actions: RowAction[]): undefined {
  return undefined;
}
