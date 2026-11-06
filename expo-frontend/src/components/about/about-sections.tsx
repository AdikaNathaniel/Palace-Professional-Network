import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { LeaderRow } from '@/components/about/leader-row';
import { Icon, type IconName } from '@/components/ui/icon';
import { BRAND_GRADIENT } from '@/constants/brand';
import {
  CHIEF_COORDINATOR,
  CHIEF_COORDINATOR_DUTIES,
  COORDINATOR_ROLE,
  PRINCIPAL_MEMBER_ROLE,
  SECRETARY_ROLE,
} from '@/lib/leadership';

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

const ROLES: { icon: IconName; title: string; duty: string }[] = [
  {
    icon: { ios: 'star.fill', android: 'star' },
    title: COORDINATOR_ROLE,
    duty:
      'Leads the group, represents it before church leadership, and coordinates meetings and professional events.',
  },
  {
    icon: { ios: 'square.and.pencil', android: 'edit_note' },
    title: SECRETARY_ROLE,
    duty:
      'Assists the Coordinator, keeps records and minutes, and manages communication and membership records.',
  },
  {
    icon: { ios: 'wrench.and.screwdriver', android: 'handshake' },
    title: PRINCIPAL_MEMBER_ROLE,
    duty: "Handles the group's legwork: logistics, operations and other tasks.",
  },
];

/**
 * "How the network is led": the three group roles and what each does, laid
 * out in full (the Flutter app cycled through them in one collapsed strip).
 */
export function LeadershipExplainer() {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <View className={`${CARD} gap-3 p-4`} style={{ borderCurve: 'continuous' }}>
      <View className="flex-row items-center gap-3">
        <View className="size-9 items-center justify-center rounded-full bg-primary/10">
          <Icon name={{ ios: 'person.3.fill', android: 'account_tree' }} size={18} color={accent} />
        </View>
        <Text accessibilityRole="header" className="flex-1 text-[17px] font-bold text-accent">
          How the network is led
        </Text>
      </View>
      <Text className="text-[15px] leading-5 text-muted">
        A Chief Professional Coordinator oversees all the groups. Each group is led by:
      </Text>
      {ROLES.map((role) => (
        <View key={role.title} className="flex-row gap-3" accessible accessibilityLabel={`${role.title}. ${role.duty}`}>
          <View className="size-9 items-center justify-center rounded-xl bg-background" style={{ borderCurve: 'continuous' }}>
            <Icon name={role.icon} size={17} color={accent} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="text-[15px] font-semibold text-foreground">{role.title}</Text>
            <Text className="text-[15px] leading-5 text-muted">{role.duty}</Text>
          </View>
        </View>
      ))}
    </View>
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
