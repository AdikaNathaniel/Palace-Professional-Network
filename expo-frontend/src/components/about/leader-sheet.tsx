import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { leaderActions } from '@/components/about/leader-actions';
import { LeaderAvatar } from '@/components/about/leader-row';
import { StatusMessage } from '@/components/status-message';
import { ActionTile } from '@/components/ui/action-tile';
import { findLeader } from '@/lib/leadership';

/** A leader's photo, name, role, contact actions and bio, shown in a sheet. */
export function LeaderSheet({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const accent = useCSSVariable('--color-accent') as string;
  const found = findLeader(id);

  if (!found) {
    return (
      <StatusMessage
        icon={{ ios: 'person.crop.circle.badge.questionmark', android: 'person_off' }}
        title="Leader not found"
      />
    );
  }

  const { leader, group } = found;
  const actions = leaderActions(leader);

  return (
    <ScrollView
      contentContainerClassName="gap-5 px-6 pt-8"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <View className="items-center gap-1">
        <LeaderAvatar leader={leader} size={96} />
        <Text selectable accessibilityRole="header" className="mt-3 text-center text-xl font-bold text-foreground">
          {leader.name}
        </Text>
        <Text className="text-center text-base font-medium text-accent">{leader.role}</Text>
        {group ? <Text className="text-center text-[15px] text-muted">{group.name}</Text> : null}
        {leader.phone ? (
          <Text selectable className="text-center text-sm text-muted" style={{ fontVariant: ['tabular-nums'] }}>
            {leader.phone}
          </Text>
        ) : null}
      </View>

      {actions.length ? (
        <View className="flex-row gap-2">
          {actions.map((a) => (
            <ActionTile
              key={a.name}
              label={a.title}
              icon={a.icon}
              color={accent}
              onPress={a.onPress}
              className="bg-background"
            />
          ))}
        </View>
      ) : (
        <Text className="text-center text-[15px] text-muted">No phone number listed.</Text>
      )}

      {leader.bio ? (
        <Text selectable className="text-base leading-6 text-foreground">
          {leader.bio}
        </Text>
      ) : null}
    </ScrollView>
  );
}
