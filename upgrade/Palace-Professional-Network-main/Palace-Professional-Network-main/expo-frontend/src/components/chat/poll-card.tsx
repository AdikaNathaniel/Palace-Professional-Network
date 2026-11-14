import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import type { ChatPoll } from '@/lib/api/types';

/**
 * A poll inside a message bubble: tap an option to vote (tapping your choice
 * again withdraws it), with live counts and bars.
 */
export function PollCard({
  poll,
  myPhone,
  isMine,
  accent,
  disabled,
  onVote,
  onViewVotes,
}: {
  poll: ChatPoll;
  myPhone: string;
  isMine: boolean;
  /** Icon colour (hex) for this bubble. */
  accent: string;
  /** Not sent yet: nothing to vote on. */
  disabled?: boolean;
  onVote: (optionIds: string[]) => void;
  onViewVotes: () => void;
}) {
  const mine = new Set(poll.options.filter((o) => o.voters.includes(myPhone)).map((o) => o.id));
  const voters = new Set(poll.options.flatMap((o) => o.voters)).size;
  const fg = isMine ? 'text-on-primary' : 'text-foreground';
  const muted = isMine ? 'text-on-primary/75' : 'text-muted';

  const tap = (optionId: string) => {
    void Haptics.selectionAsync();
    if (poll.allowMultiple) {
      const next = new Set(mine);
      if (next.has(optionId)) next.delete(optionId);
      else next.add(optionId);
      onVote([...next]);
    } else {
      onVote(mine.has(optionId) ? [] : [optionId]);
    }
  };

  return (
    <View className="w-64 gap-1">
      <View className="flex-row items-start gap-1.5">
        <Icon name={{ ios: 'chart.bar.fill', android: 'bar_chart' }} size={17} color={accent} />
        <Text className={`flex-1 text-base font-semibold ${fg}`}>{poll.question}</Text>
      </View>
      <Text className={`text-xs ${muted}`}>
        {poll.allowMultiple ? 'Select one or more' : 'Select one'}
      </Text>

      <View className="mt-1.5 gap-1">
        {poll.options.map((option) => {
          const chosen = mine.has(option.id);
          const share = voters === 0 ? 0 : option.voters.length / voters;
          return (
            <Pressable
              key={option.id}
              disabled={disabled}
              onPress={() => tap(option.id)}
              accessibilityRole={poll.allowMultiple ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: chosen, disabled }}
              className="gap-1.5 py-1.5 active:opacity-60">
              <View className="flex-row items-center gap-2">
                <Icon
                  name={
                    poll.allowMultiple
                      ? chosen
                        ? { ios: 'checkmark.square.fill', android: 'check_box' }
                        : { ios: 'square', android: 'check_box_outline_blank' }
                      : chosen
                        ? { ios: 'checkmark.circle.fill', android: 'radio_button_checked' }
                        : { ios: 'circle', android: 'radio_button_unchecked' }
                  }
                  size={20}
                  color={accent}
                />
                <Text className={`flex-1 text-[15px] ${fg}`}>{option.text}</Text>
                <Text
                  className={`text-sm font-semibold ${muted}`}
                  style={{ fontVariant: ['tabular-nums'] }}>
                  {option.voters.length}
                </Text>
              </View>
              <View
                className={`ml-7 h-1 overflow-hidden rounded-full ${isMine ? 'bg-on-primary/25' : 'bg-primary/15'}`}>
                <View
                  className={`absolute inset-y-0 left-0 rounded-full ${isMine ? 'bg-on-primary' : 'bg-primary'}`}
                  style={{ width: `${share * 100}%` }}
                />
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onViewVotes}
        disabled={disabled}
        className="mt-1 items-center py-1.5 active:opacity-60">
        <Text className={`text-sm font-semibold ${isMine ? 'text-on-primary' : 'text-accent'}`}>
          {voters === 1 ? 'View votes (1 person)' : `View votes (${voters} people)`}
        </Text>
      </Pressable>
    </View>
  );
}
