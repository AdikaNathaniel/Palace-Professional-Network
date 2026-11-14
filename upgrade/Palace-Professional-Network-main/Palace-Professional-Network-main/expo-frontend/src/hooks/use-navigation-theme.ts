import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';
import { useCSSVariable, useUniwind } from 'uniwind';

/** React Navigation's theme (headers, screen backgrounds) built from our CSS tokens. */
export function useNavigationTheme(): Theme {
  const { theme } = useUniwind();
  const [primary, background, surface, foreground, border] = useCSSVariable([
    '--color-primary',
    '--color-background',
    '--color-surface',
    '--color-foreground',
    '--color-border',
  ]) as string[];

  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary,
      background,
      card: surface,
      text: foreground,
      border,
    },
  };
}
