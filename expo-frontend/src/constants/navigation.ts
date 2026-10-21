import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router/stack';

/** Header style for the stack inside each tab: native large titles. */
export const tabStackScreenOptions: ComponentProps<typeof Stack>['screenOptions'] = {
  headerLargeTitleEnabled: true,
  headerShadowVisible: false,
  headerLargeTitleShadowVisible: false,
  headerBackButtonDisplayMode: 'minimal',
};
