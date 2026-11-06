import { SymbolView, type AndroidSymbol, type SFSymbol, type SymbolViewProps } from 'expo-symbols';

/**
 * An SF Symbol on iOS and its Material Symbol twin on Android (and web).
 * Decorative: it sits beside a label or inside a labelled control, so
 * screen readers skip it rather than read out the symbol's name.
 */
export type IconName = { ios: SFSymbol; android: AndroidSymbol };

export function Icon({
  name,
  size = 22,
  color,
  weight,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
  style?: SymbolViewProps['style'];
}) {
  return (
    <SymbolView
      name={{ ios: name.ios, android: name.android, web: name.android }}
      size={size}
      tintColor={color}
      weight={weight}
      style={style}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
