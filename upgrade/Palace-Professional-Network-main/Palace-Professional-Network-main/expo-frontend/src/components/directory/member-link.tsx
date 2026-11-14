import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import type { SFSymbol } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Alert, Pressable, type AccessibilityActionEvent } from 'react-native';

import type { Biodata } from '@/lib/api/types';
import { openDirectMessage } from '@/lib/chat/navigation';
import { copyDetail, openContactUrl } from '@/lib/contact';

type MemberAction = { name: string; title: string; icon: SFSymbol; onPress: () => void };

/** Message and Call for other members; Copy Phone Number for anyone. */
function memberActions(member: Biodata, isMe: boolean): MemberAction[] {
  const copy: MemberAction = {
    name: 'copy',
    title: 'Copy Phone Number',
    icon: 'doc.on.doc',
    onPress: () => void copyDetail(member.phoneNumber, 'Phone number'),
  };
  if (isMe) return [copy];
  return [
    {
      name: 'message',
      title: 'Message',
      icon: 'message',
      onPress: () =>
        openDirectMessage(member.phoneNumber, { title: member.fullName, imageUrl: member.imageUrl }),
    },
    { name: 'call', title: 'Call', icon: 'phone', onPress: () => void openContactUrl(`tel:${member.phoneNumber}`) },
    copy,
  ];
}

/**
 * Opens a member's profile. Long-press for Message / Call / Copy: a native
 * context menu with a peek of the profile on iOS, an alert on Android. The
 * same actions are offered to VoiceOver and TalkBack as custom actions.
 */
export function MemberLink({
  member,
  isMe,
  accessibilityLabel,
  className,
  children,
}: {
  member: Biodata;
  isMe: boolean;
  accessibilityLabel: string;
  className?: string;
  children: ReactNode;
}) {
  const href = { pathname: '/member/[id]' as const, params: { id: member._id! } };
  const actions = memberActions(member, isMe);
  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityLabel,
    accessibilityHint: 'Opens their profile',
    accessibilityActions: actions.map((a) => ({ name: a.name, label: a.title })),
    onAccessibilityAction: (e: AccessibilityActionEvent) =>
      actions.find((a) => a.name === e.nativeEvent.actionName)?.onPress(),
  };

  if (process.env.EXPO_OS !== 'ios') {
    const showActions = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Alert.alert(member.fullName, undefined, [
        ...actions.map((a) => ({ text: a.title, onPress: a.onPress })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    };
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
      <Link.Preview />
      <Link.Menu>
        {actions.map((a) => (
          <Link.MenuAction key={a.name} title={a.title} icon={a.icon} onPress={a.onPress} />
        ))}
      </Link.Menu>
    </Link>
  );
}
