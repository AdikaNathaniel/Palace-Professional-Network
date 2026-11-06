import { semantics } from '@expo/ui/jetpack-compose/modifiers';

/**
 * Compose forms take their colours from the Host's Material theme; the iOS
 * version (form-modifiers.ios.ts) restyles the SwiftUI Form.
 */
export function formModifiers(_tintColor: string): undefined {
  return undefined;
}

export function sectionModifiers(_rowColor: string): undefined {
  return undefined;
}

/** What TalkBack reads for a control whose visible label sits beside it. */
export function a11y(label: string, hint?: string) {
  return [semantics({ contentDescription: hint ? `${label}. ${hint}` : label })];
}

/** Compose sizes text in sp, so a weight in textStyle already scales. */
export function headlineFont(): undefined {
  return undefined;
}
