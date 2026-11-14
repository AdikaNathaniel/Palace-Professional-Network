import { buttonStyle, tint } from '@expo/ui/swift-ui/modifiers';

/** Tints the sheet's SwiftUI buttons and toggles with the brand colour. */
export function sheetModifiers(color: string) {
  return [tint(color)];
}

/** Text buttons ("Cancel", "Add Option") that take the tint, like a toolbar's. */
export function linkButtonModifiers() {
  return [buttonStyle('borderless')];
}
