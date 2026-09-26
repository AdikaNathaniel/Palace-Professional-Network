package com.ipc.palace.palace_professional_network

import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        createChatNotificationChannel()
    }

    /**
     * Chat push notifications use this channel (see the default channel
     * meta-data in AndroidManifest.xml and push.service.ts on the server).
     * IMPORTANCE_HIGH is what makes Android pop them up over whatever is on
     * screen ("heads-up"), with sound and vibration. Re-creating an existing
     * channel is a no-op, so this is safe on every launch.
     */
    private fun createChatNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHAT_CHANNEL_ID,
            "Chat messages",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "New messages in your chats and profession group"
            enableVibration(true)
            enableLights(true)
            setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build(),
            )
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    companion object {
        const val CHAT_CHANNEL_ID = "chat_messages"
    }
}
