import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { toast } from 'sonner-native';

import { chatApi } from '@/lib/api/endpoints';
import { getActiveChatRoom, openChat } from '@/lib/chat/navigation';
import { queryClient, queryKeys } from '@/lib/query-client';

/**
 * Chat push notifications (Firebase Cloud Messaging), like the Flutter app's
 * PushService. The server (push.service.ts) sends a notification with
 * `data: { roomId, title }` on the `chat_messages` channel, which the native
 * side creates at startup (plugins/with-chat-notifications.js).
 *
 * Android shows notifications by itself while the app is in the background;
 * in the foreground this shows a toast instead. Everything fails quietly so
 * a Firebase problem never breaks the rest of the app.
 */

let token: string | null = null;
let unsubscribers: (() => void)[] = [];
let handledInitial = false;

function roomOf(message: RemoteMessage | null) {
  const roomId = message?.data?.roomId;
  return typeof roomId === 'string' && roomId ? roomId : null;
}

function openFromNotification(message: RemoteMessage | null) {
  const roomId = roomOf(message);
  if (!roomId) return;
  const title = message?.data?.title;
  openChat(roomId, { title: typeof title === 'string' ? title : undefined });
}

async function askPermission() {
  if (Platform.OS === 'android') {
    // Android 13+ asks at runtime; older versions allow notifications by default.
    if (Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    return;
  }
  await requestPermission(getMessaging());
}

async function register(next: string) {
  token = next;
  try {
    await chatApi.registerDeviceToken(next);
  } catch {
    // Retried on the next launch / token refresh.
  }
}

/** Call once signed in (and in the app's navigation tree). */
export async function startPush() {
  stopListening();
  try {
    const messaging = getMessaging();
    await askPermission();

    const current = await getToken(messaging);
    if (current) await register(current);

    unsubscribers = [
      onTokenRefresh(messaging, (next) => void register(next)),
      onNotificationOpenedApp(messaging, openFromNotification),
      onMessage(messaging, async (message) => {
        // The chats list and badges catch up even if the inbox socket missed it.
        void queryClient.invalidateQueries({ queryKey: queryKeys.unread });
        void queryClient.invalidateQueries({ queryKey: queryKeys.dmRooms });
        const roomId = roomOf(message);
        if (!roomId || roomId === getActiveChatRoom()) return;
        toast(message.notification?.title ?? 'New message', {
          description: message.notification?.body ?? undefined,
          action: { label: 'Open', onClick: () => openFromNotification(message) },
        });
      }),
    ];

    // The notification that launched the app, once per app run.
    if (!handledInitial) {
      handledInitial = true;
      const initial = await getInitialNotification(messaging);
      // Let the signed-in screens mount before navigating.
      if (initial) setTimeout(() => openFromNotification(initial), 300);
    }
  } catch (e) {
    console.warn('Push setup failed', e);
  }
}

function stopListening() {
  for (const unsubscribe of unsubscribers) unsubscribe();
  unsubscribers = [];
}

/**
 * Call on sign-out while still authenticated, so this phone stops getting
 * the account's notifications. Never takes more than a few seconds.
 */
export async function stopPush() {
  stopListening();
  const current = token;
  token = null;
  if (!current) return;
  await Promise.race([
    chatApi.unregisterDeviceToken(current).catch(() => undefined),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
}
