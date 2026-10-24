import { FlatList } from 'react-native';

import { StatusMessage } from '@/components/status-message';

/**
 * An announcement from the network. Nothing is stored yet (chat messages
 * still arrive as push notifications), so the list is always empty; when a
 * backend exists, fill `notifications` from a query and add a row component.
 */
type Notification = { id: string; title: string; body: string; createdAt: string };

const notifications: Notification[] = [];

export default function NotificationsScreen() {
  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={() => null}
      contentInsetAdjustmentBehavior="automatic"
      // The centred empty state plus the header inset would otherwise scroll a little.
      scrollEnabled={notifications.length > 0}
      className="flex-1 bg-background"
      contentContainerClassName="grow justify-center"
      ListEmptyComponent={
        <StatusMessage
          icon={{ ios: 'bell', android: 'notifications_none' }}
          title="No notifications yet"
          message="Announcements and updates from the network will appear here."
        />
      }
    />
  );
}
