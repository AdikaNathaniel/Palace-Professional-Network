/**
 * The app can take photos (chat, profile picture) and record voice notes,
 * but neither is essential. Without these declarations Play treats the
 * CAMERA / RECORD_AUDIO permissions as *requiring* a camera and microphone,
 * and hides the app from devices without them (it dropped ~475 devices
 * compared with the Flutter app, which declared the microphone optional).
 */
const { withAndroidManifest } = require('expo/config-plugins');

const OPTIONAL_FEATURES = [
  'android.hardware.camera',
  'android.hardware.camera.autofocus',
  'android.hardware.camera.front',
  'android.hardware.microphone',
];

module.exports = function withOptionalHardware(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const features = (manifest['uses-feature'] ?? []).filter(
      (f) => !OPTIONAL_FEATURES.includes(f.$['android:name']),
    );
    for (const name of OPTIONAL_FEATURES) {
      features.push({ $: { 'android:name': name, 'android:required': 'false' } });
    }
    manifest['uses-feature'] = features;
    return config;
  });
};
