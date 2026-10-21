import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Pressable, SectionList, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Icon } from '@/components/ui/icon';
import { filterOptionGroups } from '@/lib/biodata';
import type { OptionPickerRequest } from '@/lib/option-picker';

/**
 * A searchable list of options with optional section headings, pushed from
 * a form row. Picking one reports it and goes back.
 */
export function OptionList({ request }: { request: OptionPickerRequest }) {
  const [query, setQuery] = useState('');
  const [primary, muted] = useCSSVariable(['--color-primary', '--color-muted']) as string[];

  const sections = filterOptionGroups(request.groups, query.trim()).map((group) => ({
    title: group.title,
    data: group.items,
  }));

  const pick = (value: string) => {
    void Haptics.selectionAsync();
    request.onSelect(value);
    router.back();
  };

  return (
    <>
      <Stack.Screen.Title>{request.title}</Stack.Screen.Title>
      <Stack.SearchBar
        placeholder={request.searchPlaceholder}
        onChangeText={(e) => setQuery(e.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
        autoCapitalize="none"
        hideWhenScrolling={false}
        obscureBackground={false}
      />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item}-${index}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        stickySectionHeadersEnabled={false}
        className="flex-1 bg-background"
        contentContainerClassName="px-4 pb-8"
        renderSectionHeader={({ section }) =>
          section.title ? (
            <Text
              accessibilityRole="header"
              className="px-4 pb-2 pt-6 text-[13px] font-semibold uppercase text-muted">
              {section.title}
            </Text>
          ) : (
            <View className="h-4" />
          )
        }
        renderItem={({ item, index, section }) => {
          const selected = item === request.selected;
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => pick(item)}
              accessibilityRole="button"
              accessibilityLabel={item}
              accessibilityState={{ selected }}
              style={{ borderCurve: 'continuous' }}
              className={`min-h-12 flex-row items-center gap-3 bg-surface px-4 py-3 active:opacity-60 ${first ? 'rounded-t-xl' : ''} ${last ? 'rounded-b-xl' : 'border-b border-border'}`}>
              <Text className={`flex-1 text-[17px] ${selected ? 'font-semibold text-accent' : 'text-foreground'}`}>
                {item}
              </Text>
              {selected ? (
                <Icon name={{ ios: 'checkmark', android: 'check' }} size={17} weight="semibold" color={primary} />
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center gap-3 px-8 pt-16">
            <Icon name={{ ios: 'magnifyingglass', android: 'search' }} size={36} color={muted} />
            <Text className="text-center text-base text-muted">{`No matches for “${query.trim()}”`}</Text>
          </View>
        }
      />
    </>
  );
}
