import {
  accessibilityHint,
  accessibilityLabel,
  font,
  listRowBackground,
  scrollContentBackground,
  scrollDismissesKeyboard,
  tint,
} from '@expo/ui/swift-ui/modifiers';

/**
 * A SwiftUI Form in the app's colours rather than the system's grouped
 * greys: the Host's background shows through and the brand tints controls.
 * Dragging the form tucks the keyboard away.
 */
export function formModifiers(tintColor: string) {
  return [scrollContentBackground('hidden'), scrollDismissesKeyboard('interactively'), tint(tintColor)];
}

/** Section rows on the surface colour, like the app's cards. */
export function sectionModifiers(rowColor: string) {
  return [listRowBackground(rowColor)];
}

/** What VoiceOver reads for a control whose visible label sits beside it. */
export function a11y(label: string, hint?: string) {
  return hint ? [accessibilityLabel(label), accessibilityHint(hint)] : [accessibilityLabel(label)];
}

/**
 * The headline text style, so emphasised text still follows Dynamic Type
 * (a bare weight would pin it to a fixed size).
 */
export function headlineFont() {
  return [font({ textStyle: 'headline' })];
}
