import { memo } from 'react';
import { Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Avatar } from '@/components/avatar';
import { MemberLink } from '@/components/directory/member-link';
import { Icon } from '@/components/ui/icon';
import type { Biodata } from '@/lib/api/types';
import { shortenCompany } from '@/lib/company-abbreviation';
import { shortProfessionLine } from '@/lib/directory';

function YouBadge() {
  return (
    <View className="rounded-full bg-primary px-2 py-0.5">
      <Text className="text-xs font-bold text-on-primary" maxFontSizeMultiplier={1.6}>
        You
      </Text>
    </View>
  );
}

function memberLabel(member: Biodata, isMe: boolean) {
  return `${member.fullName}${isMe ? ' (you)' : ''}. ${shortProfessionLine(member)}. ${member.placeOfWork}`;
}

/** A Contacts-style row: photo, name, what they do and where. */
export const MemberRow = memo(function MemberRow({ member, isMe }: { member: Biodata; isMe: boolean }) {
  return (
    <MemberLink
      member={member}
      isMe={isMe}
      accessibilityLabel={memberLabel(member, isMe)}
      className="bg-background active:bg-surface">
      <View className="flex-row items-center gap-3 pl-4">
        <Avatar name={member.fullName} imageUrl={member.imageUrl} size={48} />
        <View className="flex-1 gap-0.5 border-b border-border py-3 pr-4">
          <View className="flex-row items-center gap-2">
            <Text className="shrink text-[17px] font-semibold text-foreground" numberOfLines={1}>
              {member.fullName}
            </Text>
            {isMe ? <YouBadge /> : null}
          </View>
          <Text className="text-[15px] text-accent" numberOfLines={1}>
            {shortProfessionLine(member)}
          </Text>
          <Text className="text-sm text-muted" numberOfLines={1}>
            {shortenCompany(member.placeOfWork)}
          </Text>
        </View>
      </View>
    </MemberLink>
  );
});

/**
 * Grid card height: padding, photo and gaps, plus two lines each of name,
 * profession and place of work, grown with the text-size setting so every
 * card in a row lines up and nothing is cut off at large sizes.
 */
export function memberCardHeight(fontScale: number) {
  return 144 + Math.round(100 * fontScale);
}

/** A photo-led card for the grid, like the Flutter app's BiodataGridCard. */
export const MemberCard = memo(function MemberCard({
  member,
  isMe,
  height,
}: {
  member: Biodata;
  isMe: boolean;
  height: number;
}) {
  const muted = useCSSVariable('--color-muted') as string;
  return (
    <View className="p-1.5" style={{ height }}>
      <MemberLink
        member={member}
        isMe={isMe}
        accessibilityLabel={memberLabel(member, isMe)}
        className="flex-1 items-center justify-center gap-1 rounded-2xl border border-border bg-surface px-3 py-4 active:opacity-70">
        <View>
          <Avatar name={member.fullName} imageUrl={member.imageUrl} size={76} />
          {isMe ? (
            <View className="absolute -inset-x-6 -bottom-1 items-center">
              <YouBadge />
            </View>
          ) : null}
        </View>
        <Text className="mt-2 text-center text-[15px] font-bold text-foreground" numberOfLines={2}>
          {member.fullName}
        </Text>
        <Text className="text-center text-[13px] font-medium text-accent" numberOfLines={2}>
          {shortProfessionLine(member)}
        </Text>
        <View className="mt-0.5 flex-row items-start justify-center gap-1">
          <Icon name={{ ios: 'building.2', android: 'business' }} size={12} color={muted} style={{ marginTop: 2 }} />
          <Text className="shrink text-center text-xs text-muted" numberOfLines={2}>
            {shortenCompany(member.placeOfWork)}
          </Text>
        </View>
      </MemberLink>
    </View>
  );
});
