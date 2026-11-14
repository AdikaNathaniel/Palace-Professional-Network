/// <reference types="node" />

import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. React Native Firebase's config plugin refuses to prebuild
 * iOS without a GoogleService-Info.plist, and iOS hasn't been registered in
 * the Firebase console yet. Until that file is added here, iOS builds leave
 * the Firebase plugins out (no push on iOS); Android keeps them for chat
 * push notifications (src/lib/push.ts).
 */
const buildingIos =
  process.env.EAS_BUILD_PLATFORM === 'ios' ||
  process.argv.some((arg, i, all) => arg === 'run:ios' || (arg === 'ios' && /^(-p|--platform)$/.test(all[i - 1] ?? '')));

export default ({ config, projectRoot }: ConfigContext): ExpoConfig => {
  const iosServicesFile = './GoogleService-Info.plist';

  if (existsSync(join(projectRoot, iosServicesFile))) {
    return {
      ...config,
      ios: { ...config.ios, googleServicesFile: iosServicesFile },
    } as ExpoConfig;
  }

  if (!buildingIos) return config as ExpoConfig;

  return {
    ...config,
    plugins: config.plugins?.filter((plugin) => {
      const name = Array.isArray(plugin) ? plugin[0] : plugin;
      return !name?.startsWith('@react-native-firebase/');
    }),
  } as ExpoConfig;
};
