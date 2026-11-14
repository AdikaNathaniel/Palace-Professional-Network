import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Icon } from '@/components/ui/icon';

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View className="gap-0.5">
      <Text accessibilityRole="header" className="text-xl font-bold text-foreground">
        {title}
      </Text>
      {subtitle ? <Text className="text-[15px] text-muted">{subtitle}</Text> : null}
    </View>
  );
}

/** "Welcome back, Ama" and what they do, or a plain welcome before we know their name. */
export function Greeting({ name, detail }: { name: string | null; detail: string | null }) {
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
        {name ? `Welcome back, ${name}` : 'Welcome!'}
      </Text>
      {detail ? <Text className="text-base text-accent">{detail}</Text> : null}
    </View>
  );
}

/** Shown until the member submits their biodata, since only then do others see them. */
export function CompleteProfileCard() {
  const primary = useCSSVariable('--color-primary') as string;
  return (
    <Link href="/biodata-form" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Complete your profile"
        accessibilityHint="Opens the biodata form. Other members will see you in the Directory once you submit it."
        className="flex-row items-center gap-3 rounded-2xl border border-primary-soft bg-surface p-4 active:opacity-70"
        style={{ borderCurve: 'continuous' }}>
        <View className="size-11 items-center justify-center rounded-full bg-primary">
          <Icon name={{ ios: 'person.crop.circle.badge.plus', android: 'person_add' }} size={22} color="#ffffff" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-foreground">Complete your profile</Text>
          <Text className="text-sm text-muted">
            Fill in your biodata so other members can find you in the Directory.
          </Text>
        </View>
        <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} color={primary} />
      </Pressable>
    </Link>
  );
}
