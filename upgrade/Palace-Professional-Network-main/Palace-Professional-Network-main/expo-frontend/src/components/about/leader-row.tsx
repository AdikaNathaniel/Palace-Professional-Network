import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Alert, Pressable, Text, useWindowDimensions, View, type AccessibilityActionEvent } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { leaderActions, type LeaderAction } from '@/components/about/leader-actions';
import { Avatar } from '@/components/avatar';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import type { Leader } from '@/lib/leadership';

/** WhatsApp's green (the Flutter app's), so the button reads as WhatsApp at a glance. */
const WHATSAPP_GREEN = '#16a34a';

/** "Mrs. Regina R. Matey" → "Regina R. Matey", so initials skip the title. */
function withoutTitle(name: string) {
  return name.replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/, '');
}

/** The leader's photo, or their initials when there isn't one. */
export function LeaderAvatar({ leader, size }: { leader: Leader; size: number }) {
  if (!leader.photo) return <Avatar name={withoutTitle(leader.name)} size={size} />;
  return (
    <Image
      source={leader.photo}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      // Portraits are taller than wide; bias the crop upwards to keep faces.
      contentPosition={{ top: '20%', left: '50%' }}
      accessibilityIgnoresInvertColors
    />
  );
}

/**
 * Opens the leader's sheet (photo, bio, contact actions). Long-press for
 * Call / WhatsApp / Copy Number: a native context menu on iOS, an alert on
 * Android. The same actions are offered to VoiceOver and TalkBack as custom
 * actions.
 */
export function LeaderLink({
  leader,
  accessibilityLabel,
  className,
  children,
}: {
  leader: Leader;
  accessibilityLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const href = { pathname: '/leader/[id]' as const, params: { id: leader.id } };
  const actions = leaderActions(leader);
  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityLabel,
    accessibilityHint: leader.bio ? 'Opens their bio and contact options' : 'Opens their contact options',
    accessibilityActions: actions.map((a) => ({ name: a.name, label: a.title })),
    onAccessibilityAction: (e: AccessibilityActionEvent) =>
      actions.find((a) => a.name === e.nativeEvent.actionName)?.onPress(),
  };

  if (process.env.EXPO_OS !== 'ios' || !actions.length) {
    const showActions = actions.length
      ? () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert(leader.name, leader.phone, [
            ...actions.map((a) => ({ text: a.title, onPress: a.onPress })),
            { text: 'Cancel', style: 'cancel' as const },
          ]);
        }
      : undefined;
    return (
      <Link href={href} asChild>
        <Pressable {...a11y} onLongPress={showActions} className={className}>
          {children}
        </Pressable>
      </Link>
    );
  }

  return (
    <Link href={href} asChild>
      <Link.Trigger>
        <Pressable {...a11y} className={className}>
          {children}
        </Pressable>
      </Link.Trigger>
      <Link.Menu title={leader.phone}>
        {actions.map((a) => (
          <Link.MenuAction key={a.name} icon={a.icon.ios} onPress={a.onPress}>
            {a.title}
          </Link.MenuAction>
        ))}
      </Link.Menu>
    </Link>
  );
}

/** A round icon button for Call and WhatsApp, 44pt to meet the touch-target minimum. */
function ContactButton({ action, color, name }: { action: LeaderAction; color: string; name: string }) {
  return (
    <Pressable
      onPress={action.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${action.title} ${name}`}
      hitSlop={4}
      className="size-11 items-center justify-center rounded-full bg-primary/10 active:opacity-60">
      <Icon name={action.icon} size={20} color={color} />
    </Pressable>
  );
}

export function ContactButtons({ leader }: { leader: Leader }) {
  const accent = useCSSVariable('--color-accent') as string;
  const actions = leaderActions(leader);
  const call = actions.find((a) => a.name === 'call');
  const whatsapp = actions.find((a) => a.name === 'whatsapp');
  if (!call || !whatsapp) return null;
  return (
    <View className="flex-row gap-2">
      <ContactButton action={call} color={accent} name={leader.name} />
      <ContactButton action={whatsapp} color={WHATSAPP_GREEN} name={leader.name} />
    </View>
  );
}

/**
 * Photo, name, role and number, with Call / WhatsApp buttons when there is
 * a number. Tapping the row opens the leader's sheet. At very large text
 * sizes the buttons move under the name so it isn't squeezed.
 */
export function LeaderRow({
  leader,
  avatarSize = 48,
  showRole = true,
}: {
  leader: Leader;
  avatarSize?: number;
  showRole?: boolean;
}) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= 1.6;
  const label = [leader.name, showRole ? leader.role : null, leader.phone].filter(Boolean).join(', ');

  return (
    <View className={stacked ? 'gap-2' : 'flex-row items-center gap-2'}>
      <LeaderLink
        leader={leader}
        accessibilityLabel={label}
        className="flex-1 flex-row items-center gap-3 rounded-xl py-1 active:opacity-60">
        <LeaderAvatar leader={leader} size={avatarSize} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{leader.name}</Text>
          {showRole ? <Text className="text-sm text-accent">{leader.role}</Text> : null}
          {leader.phone ? (
            <Text className="text-sm text-muted" style={{ fontVariant: ['tabular-nums'] }}>
              {leader.phone}
            </Text>
          ) : null}
          {leader.bio ? <Text className="text-xs text-muted">Tap to read bio</Text> : null}
        </View>
      </LeaderLink>
      {/* Stacked, the buttons line up with the name (avatar + gap-3). */}
      <View style={stacked ? { paddingLeft: avatarSize + 12 } : undefined}>
        <ContactButtons leader={leader} />
      </View>
    </View>
  );
}
