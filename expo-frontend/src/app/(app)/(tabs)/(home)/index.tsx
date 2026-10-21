import { Link } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { SymbolView } from 'expo-symbols';
import { Pressable } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { PlaceholderScreen } from '@/components/placeholder-screen';
import { Button } from '@/components/ui/button';

function AccountButton() {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <Link href="/account" asChild>
      <Pressable accessibilityLabel="Account" hitSlop={8} className="active:opacity-60">
        <SymbolView
          name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
          tintColor={accent}
          size={26}
        />
      </Pressable>
    </Link>
  );
}

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ headerRight: () => <AccountButton /> }} />
      <PlaceholderScreen
        title="Home"
        flutterSource="pages/dashboard_page.dart, widgets/home_hero.dart">
        <Link href="/presentation" asChild>
          <Button title="PPN Presentation" variant="secondary" />
        </Link>
        <Link href="/notifications" asChild>
          <Button title="Notifications" variant="secondary" />
        </Link>
      </PlaceholderScreen>
    </>
  );
}
