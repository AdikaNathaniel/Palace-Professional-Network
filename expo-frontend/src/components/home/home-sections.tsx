import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Icon, type IconName } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';

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

function QuickLink({
  href,
  title,
  subtitle,
  leading,
  last = false,
}: {
  href: Href;
  title: string;
  subtitle: string;
  leading: ReactNode;
  last?: boolean;
}) {
  const muted = useCSSVariable('--color-muted') as string;
  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${subtitle}`}
        className="flex-row items-center gap-3 pl-3 active:bg-background">
        {leading}
        <View className={`flex-1 flex-row items-center gap-2 py-3 pr-3 ${last ? '' : 'border-b border-border'}`}>
          <View className="flex-1">
            <Text className="text-base font-semibold text-foreground">{title}</Text>
            <Text className="text-sm text-muted">{subtitle}</Text>
          </View>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} color={muted} />
        </View>
      </Pressable>
    </Link>
  );
}

function IconTile({ name }: { name: IconName }) {
  return (
    <View className="size-11 items-center justify-center rounded-xl bg-primary" style={{ borderCurve: 'continuous' }}>
      <Icon name={name} size={20} color="#ffffff" />
    </View>
  );
}

/** The PPN Presentation and Notifications, as a short grouped list. */
export function QuickLinks() {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-surface" style={{ borderCurve: 'continuous' }}>
      <QuickLink
        href="/presentation"
        title="PPN Presentation"
        subtitle="Slides about the network"
        leading={
          <View className="size-11 overflow-hidden rounded-xl" style={{ borderCurve: 'continuous' }}>
            <Image source={require('../../../assets/images/network.jpg')} contentFit="cover" className="size-full" />
          </View>
        }
      />
      <QuickLink
        href="/notifications"
        title="Notifications"
        subtitle="Announcements and updates"
        leading={<IconTile name={{ ios: 'bell.fill', android: 'notifications' }} />}
        last
      />
    </View>
  );
}
