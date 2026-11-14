import * as Application from 'expo-application';
import { Linking } from 'react-native';

/** The Google Play listing (same package as the Flutter app). */
export const PLAY_PACKAGE = 'com.ipc.palace.palace_professional_network';

/**
 * The App Store's numeric ID ("id123456789" in the listing URL, without
 * "id"). The app isn't on the App Store yet, so iOS can't check for updates.
 * TODO: fill in once the iOS listing is live.
 */
export const APP_STORE_ID = '';

/** e.g. "1.0.24 (27)", as in the Flutter app's Settings. */
export function currentVersion() {
  const version = Application.nativeApplicationVersion ?? '?';
  const build = Application.nativeBuildVersion;
  return build ? `${version} (${build})` : version;
}

export type UpdateCheckResult = 'upToDate' | 'updating' | 'cancelled' | 'openedStore' | 'failed';

/** Opens the first of `urls` the device accepts; false if none would open. */
export async function openFirst(urls: string[]) {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // Try the next one (e.g. no Play Store app, so use the website).
    }
  }
  return false;
}
