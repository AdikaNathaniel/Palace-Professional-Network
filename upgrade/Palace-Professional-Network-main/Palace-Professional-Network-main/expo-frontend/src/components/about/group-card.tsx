import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { LeaderRow } from '@/components/about/leader-row';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { groupLeaders, type ProfessionalGroup } from '@/lib/leadership';
import { professionImage } from '@/lib/profession-images';

/** Cards below an expanding group slide into place rather than jump. */
const groupLayoutTransition = LinearTransition.duration(220);

/**
 * A professional group: its picture, name and coordinator; tap to show the
 * Coordinator, Secretary and Principal Member. The leaders fade in and the
 * cards below glide down; with Reduce Motion it simply opens.
 */
export function GroupCard({
  group,
  expanded,
  onToggle,
}: {
  group: ProfessionalGroup;
  expanded: boolean;
  /** Absent while searching, when every match stays open. */
  onToggle?: () => void;
}) {
  const muted = useCSSVariable('--color-muted') as string;
  const reduced = useReducedMotion();

  return (
    <Animated.View
      layout={groupLayoutTransition}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
      style={{ borderCurve: 'continuous' }}>
      {onToggle ? (
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onToggle();
          }}
          accessibilityRole="button"
          accessibilityLabel={`${group.name}, coordinator ${group.coordinator.name}`}
          accessibilityHint={expanded ? 'Hides its leaders' : 'Shows its leaders'}
          accessibilityState={{ expanded }}
          className="flex-row items-center gap-3 p-3 active:bg-background">
          <GroupHeading group={group} />
          <Animated.View
            style={{
              transform: [{ rotate: expanded ? '180deg' : '0deg' }],
              transitionProperty: 'transform',
              transitionDuration: reduced ? 0 : 200,
            }}>
            <Icon name={{ ios: 'chevron.down', android: 'expand_more' }} size={16} weight="semibold" color={muted} />
          </Animated.View>
        </Pressable>
      ) : (
        <View
          className="flex-row items-center gap-3 p-3"
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${group.name}, coordinator ${group.coordinator.name}`}>
          <GroupHeading group={group} />
        </View>
      )}
      {expanded ? (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} className="px-3 pb-2">
          {groupLeaders(group).map((leader) => (
            <View key={leader.id} className="border-t border-border py-2">
              <LeaderRow leader={leader} />
            </View>
          ))}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function GroupHeading({ group }: { group: ProfessionalGroup }) {
  return (
    <>
      <Image
        source={professionImage(group.name)}
        style={{ width: 52, height: 52, borderRadius: 10 }}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View className="flex-1">
        <Text className="text-base font-semibold text-foreground">{group.name}</Text>
        <Text className="text-sm text-accent">{group.coordinator.name}</Text>
      </View>
    </>
  );
}
