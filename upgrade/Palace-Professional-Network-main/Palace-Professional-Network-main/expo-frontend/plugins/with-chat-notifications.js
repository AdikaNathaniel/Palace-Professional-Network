/**
 * Android chat notifications, matching the Flutter app:
 *  - creates the high-importance `chat_messages` channel at startup (the
 *    server's push.service.ts sends every chat notification on it), so they
 *    pop up over the screen with sound and vibration;
 *  - adds the `ic_stat_notification` status-bar icon the server asks for;
 *  - makes both Firebase's defaults.
 */
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');

const CHANNEL_ID = 'chat_messages';
const ICON = 'ic_stat_notification';

function withIcon(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const drawableDir = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/drawable');
      fs.mkdirSync(drawableDir, { recursive: true });
      fs.copyFileSync(
        path.join(config.modRequest.projectRoot, 'assets/notifications', `${ICON}.xml`),
        path.join(drawableDir, `${ICON}.xml`),
      );
      return config;
    },
  ]);
}

function withDefaults(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const set = (name, attr, value) => {
      app['meta-data'] = (app['meta-data'] ?? []).filter((m) => m.$['android:name'] !== name);
      app['meta-data'].push({ $: { 'android:name': name, [attr]: value, 'tools:replace': attr } });
    };
    config.modResults.manifest.$['xmlns:tools'] ??= 'http://schemas.android.com/tools';
    set('com.google.firebase.messaging.default_notification_channel_id', 'android:value', CHANNEL_ID);
    set('com.google.firebase.messaging.default_notification_icon', 'android:resource', `@drawable/${ICON}`);
    return config;
  });
}

const CHANNEL_CODE = `
    // Chat notifications (see plugins/with-chat-notifications.js).
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val channel = android.app.NotificationChannel(
        "${CHANNEL_ID}",
        "Chat messages",
        android.app.NotificationManager.IMPORTANCE_HIGH,
      ).apply {
        description = "New messages in your chats and profession group"
        enableVibration(true)
        enableLights(true)
        setSound(
          android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_NOTIFICATION),
          android.media.AudioAttributes.Builder()
            .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build(),
        )
      }
      getSystemService(android.app.NotificationManager::class.java).createNotificationChannel(channel)
    }
`;

function withChannel(config) {
  return withMainApplication(config, (config) => {
    const src = config.modResults.contents;
    if (!src.includes(`"${CHANNEL_ID}"`)) {
      config.modResults.contents = src.replace(
        /(override fun onCreate\(\) \{\s*\n\s*super\.onCreate\(\)\n)/,
        `$1${CHANNEL_CODE}`,
      );
      if (!config.modResults.contents.includes(`"${CHANNEL_ID}"`)) {
        throw new Error('with-chat-notifications: could not find onCreate in MainApplication');
      }
    }
    return config;
  });
}

module.exports = function withChatNotifications(config) {
  return withChannel(withDefaults(withIcon(config)));
};
