import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useCSSVariable } from 'uniwind';

import { useUnreadCounts } from '@/hooks/queries';

export default function TabsLayout() {
  const [primary, surface] = useCSSVariable(['--color-primary', '--color-surface']) as string[];
  const { data: unread } = useUnreadCounts();
  const unreadTotal = unread?.total ?? 0;

  return (
    <NativeTabs tintColor={primary} backgroundColor={surface}>
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="directory">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          md="group"
        />
        <NativeTabs.Trigger.Label>Directory</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'bubble.left.and.bubble.right',
            selected: 'bubble.left.and.bubble.right.fill',
          }}
          md="forum"
        />
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        {unreadTotal > 0 ? (
          <NativeTabs.Trigger.Badge>
            {unreadTotal > 99 ? '99+' : String(unreadTotal)}
          </NativeTabs.Trigger.Badge>
        ) : null}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="about">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'info.circle', selected: 'info.circle.fill' }}
          md="info"
        />
        <NativeTabs.Trigger.Label>About Us</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
