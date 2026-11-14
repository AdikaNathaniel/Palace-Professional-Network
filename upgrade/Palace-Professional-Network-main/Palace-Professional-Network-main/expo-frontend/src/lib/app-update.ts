import { APP_STORE_ID, currentVersion, openFirst, type UpdateCheckResult } from '@/lib/app-version';

/**
 * iOS (and web): there's no in-app update, so the check compares this build
 * with the App Store listing and opens it when it's newer. Off until the app
 * has an App Store ID; Android's version is in app-update.android.ts.
 */
export const updateCheck = {
  available: process.env.EXPO_OS === 'ios' && !!APP_STORE_ID,
  store: 'the App Store',
} as const;

/** Compares dotted versions numerically, so 1.0.10 is newer than 1.0.9. */
function isNewer(store: string, current: string) {
  const a = store.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff) return diff > 0;
  }
  return false;
}

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!updateCheck.available) return 'failed';
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${APP_STORE_ID}&t=${Date.now()}`);
    const body = (await res.json()) as { results?: { version?: string }[] };
    const latest = body.results?.[0]?.version;
    if (!latest) return 'failed';
    if (!isNewer(latest, currentVersion().split(' ')[0]!)) return 'upToDate';
    const opened = await openFirst([
      `itms-apps://apps.apple.com/app/id${APP_STORE_ID}`,
      `https://apps.apple.com/app/id${APP_STORE_ID}`,
    ]);
    return opened ? 'openedStore' : 'failed';
  } catch {
    return 'failed';
  }
}
