import * as Application from 'expo-application';
import type { AndroidNeedsUpdateResponse, InstallationResult } from 'sp-react-native-in-app-updates';

import { openFirst, PLAY_PACKAGE, type UpdateCheckResult } from '@/lib/app-version';

export const updateCheck = { available: true, store: 'Google Play' } as const;

const openPlayStore = () =>
  openFirst([
    `market://details?id=${PLAY_PACKAGE}`,
    `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`,
  ]).then((opened): UpdateCheckResult => (opened ? 'openedStore' : 'failed'));

/**
 * Google Play's immediate in-app update, like the Flutter app: a full-screen
 * Play update that restarts on the new version. Builds that weren't installed
 * from Play (debug, sideloaded) can't use it, so they open the listing.
 */
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  try {
    // Loaded on demand: it pulls in react-native-device-info, and a missing
    // native module should cost the in-app update, not the Settings screen.
    const lib = await import('sp-react-native-in-app-updates');
    const updates = new lib.default(false);
    const result = (await updates.checkNeedsUpdate({
      // Play reports a versionCode, so compare it with ours rather than the
      // version name the library would otherwise read from device-info.
      curVersion: Application.nativeBuildVersion ?? '0',
      toSemverConverter: (code) => `${code}`,
      customVersionComparator: (store, current) => Math.sign(Number(store) - Number(current)) as -1 | 0 | 1,
    })) as AndroidNeedsUpdateResponse;

    // A previous update was started but not finished: resume it.
    const inProgress = result.other.updateAvailability === lib.IAUAvailabilityStatus.DEVELOPER_TRIGGERED;
    if (!result.shouldUpdate && !inProgress) return 'upToDate';
    if (!result.other.isImmediateUpdateAllowed && !inProgress) return openPlayStore();

    const outcome = new Promise<UpdateCheckResult>((resolve) => {
      const listener = (status: InstallationResult) => {
        updates.removeIntentSelectionListener(listener);
        resolve(status === lib.IAUInstallStatus.CANCELED ? 'cancelled' : 'updating');
      };
      updates.addIntentSelectionListener(listener);
    });
    await updates.startUpdate({ updateType: lib.IAUUpdateKind.IMMEDIATE });
    return await outcome;
  } catch {
    // Thrown when the app wasn't installed from Google Play.
    return openPlayStore();
  }
}
