import { router } from 'expo-router';

import type { OptionGroup } from '@/lib/biodata';

export type OptionPickerRequest = {
  title: string;
  searchPlaceholder: string;
  groups: OptionGroup[];
  selected?: string;
  onSelect: (value: string) => void;
};

/**
 * The open picker's options and callback. They're too big for route params
 * and a callback can't go in a URL, so the form leaves them here and the
 * picker screen reads them when it mounts.
 */
let pending: OptionPickerRequest | null = null;

/** Pushes the searchable option list inside the biodata form's stack. */
export function openOptionPicker(request: OptionPickerRequest) {
  pending = request;
  router.push('/biodata-form/select');
}

export function getOptionPickerRequest() {
  return pending;
}
