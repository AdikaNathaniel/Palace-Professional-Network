import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { LeaderRow } from '@/components/about/leader-row';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { BRAND_GRADIENT } from '@/constants/brand';
import { CHIEF_COORDINATOR, CHIEF_COORDINATOR_DUTIES } from '@/lib/leadership';

const CARD = 'rounded-2xl border border-border bg-surface';

/** What the network is, opening the page. */
export function Intro() {
  return (
    <Text className="text-base leading-6 text-foreground">
      The <Text className="font-bold text-accent">Palace Professional Network (PPN)</Text> is an initiative of
      the International Palace Church leadership aimed at bringing together members with similar professions,
      skill sets, and trades to foster networking, collaboration, and mutual growth.
    </Text>
  );
}

/**
 * Opens the PPN Sunday presentation (the policy document). It replaced the
 * "How the network is led" card, whose roles the slides already cover.
 */
export function PresentationCard() {
  const accent = useCSSVariable('--color-accent') as string;
  const muted = useCSSVariable('--color-muted') as string;
  return (
    <Link href="/presentation" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Palace Professional Network"
        accessibilityHint="Opens the presentation slides"
        className={`${CARD} flex-row items-center gap-3 p-4 active:opacity-70`}
        style={{ borderCurve: 'continuous' }}>
        <View className="size-11 overflow-hidden rounded-xl" style={{ borderCurve: 'continuous' }}>
          <Image source={require('../../../assets/images/network.jpg')} contentFit="cover" className="size-full" />
        </View>
        <Text className="flex-1 text-[17px] font-bold text-accent">Palace Professional Network</Text>
        <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} color={muted ?? accent} />
      </Pressable>
    </Link>
  );
}

export function ConcernsBanner() {
  return (
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 16, borderCurve: 'continuous', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={{ ios: 'questionmark.bubble.fill', android: 'support_agent' }} size={28} color="#ffffff" />
      <Text className="flex-1 text-[15px] leading-5 text-white">
        Have a concern? Please reach out to the Professional Coordinator, Secretary or Principal Member of your
        group. Their contacts are listed below.
      </Text>
    </LinearGradient>
  );
}

export function ChiefCard() {
  return (
    <View className={`${CARD} gap-3 p-4`} style={{ borderCurve: 'continuous' }}>
      {/* The section heading above already names the role. */}
      <LeaderRow leader={CHIEF_COORDINATOR} avatarSize={56} showRole={false} />
      <Text className="text-[15px] leading-5 text-muted">{CHIEF_COORDINATOR_DUTIES}</Text>
    </View>
  );
}
