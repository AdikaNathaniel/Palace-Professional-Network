import { LegendList } from '@legendapp/list/react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';
import { toast } from 'sonner-native';
import { useCSSVariable } from 'uniwind';

import { DirectorySkeleton } from '@/components/directory/directory-skeleton';
import { DirectoryToolbar } from '@/components/directory/directory-toolbar';
import { MemberCard, memberCardHeight, MemberRow } from '@/components/directory/member-items';
import { StatusMessage } from '@/components/status-message';
import { Icon } from '@/components/ui/icon';
import { useBiodataOptions, useDirectory } from '@/hooks/queries';
import type { Biodata } from '@/lib/api/types';
import { professionShortLabel } from '@/lib/chat/rooms';
import {
  countByCategory,
  filterDirectory,
  indexDirectory,
  indexLetter,
  memberCountLabel,
  memberKey,
} from '@/lib/directory';
import { useDirectoryLayout } from '@/stores/directory-layout';
import { useSession } from '@/stores/session';

type Item =
  | { kind: 'header'; key: string; letter: string }
  | { kind: 'member'; key: string; member: Biodata; isMe: boolean };

export default function DirectoryScreen() {
  // `?category=` comes from Home's profession cards (or a deep link) and is
  // the source of truth for the filter, so it survives tab switches.
  const params = useLocalSearchParams<{ category?: string }>();
  const category = params.category || null;
  const myPhone = useSession((s) => s.session?.phoneNumber);
  const directory = useDirectory();
  const options = useBiodataOptions();
  const layout = useDirectoryLayout((s) => s.layout);
  const setLayout = useDirectoryLayout((s) => s.setLayout);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search);
  const searchBar = useRef<SearchBarCommands>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const cardHeight = memberCardHeight(fontScale);

  const clearSearch = () => {
    searchBar.current?.clearText();
    searchBar.current?.blur();
    setSearch('');
  };

  // A category picked on Home starts a fresh search, like the Flutter app;
  // one picked from this screen's own menu keeps what's typed.
  const ownCategory = useRef(category);
  useEffect(() => {
    if (category === ownCategory.current) return;
    ownCategory.current = category;
    clearSearch();
  }, [category]);

  const changeCategory = (next: string | null) => {
    ownCategory.current = next;
    void Haptics.selectionAsync();
    router.setParams({ category: next ?? undefined });
  };

  const members = directory.data;
  const counts = useMemo(() => countByCategory(members), [members]);
  const categories = useMemo(
    () => options.data?.professionCategories ?? [...counts.keys()].sort(),
    [options.data, counts],
  );
  const indexed = useMemo(() => indexDirectory(members ?? [], myPhone), [members, myPhone]);
  const visible = useMemo(() => filterDirectory(indexed, query, category), [indexed, query, category]);

  // List mode files everyone under letter headings; your own entry sits on top.
  // (Not sticky: Legend List misplaces sticky headers when the filter changes.)
  const items = useMemo(() => {
    const out: Item[] = [];
    let letter = '';
    for (const { member, isMe } of visible) {
      if (layout === 'list' && !isMe) {
        const next = indexLetter(member.fullName);
        if (next !== letter) {
          letter = next;
          out.push({ kind: 'header', key: `header-${next}`, letter: next });
        }
      }
      out.push({ kind: 'member', key: memberKey(member), member, isMe });
    }
    return out;
  }, [visible, layout]);

  const refresh = async () => {
    setRefreshing(true);
    const [result] = await Promise.all([directory.refetch(), options.refetch()]);
    setRefreshing(false);
    if (result.isError) toast.error('Couldn’t refresh the directory', { description: result.error.message });
  };

  const clearFilters = () => {
    clearSearch();
    if (category) changeCategory(null);
  };

  const header = (
    <>
      <Stack.SearchBar
        ref={searchBar}
        placeholder="Name, profession or workplace"
        autoCapitalize="none"
        // Search is what this screen is for, so it stays put.
        hideWhenScrolling={false}
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch('')}
      />
      <DirectoryToolbar
        categories={categories}
        counts={counts}
        category={category}
        onCategoryChange={changeCategory}
        layout={layout}
        onLayoutChange={(next) => {
          void Haptics.selectionAsync();
          setLayout(next);
        }}
      />
    </>
  );

  if (!members) {
    return (
      <>
        {header}
        {directory.error ? (
          <View className="flex-1 bg-background">
            <StatusMessage
              icon={{ ios: 'wifi.exclamationmark', android: 'cloud_off' }}
              title="Couldn’t load the directory"
              message={directory.error.message}
              actionTitle="Try Again"
              onAction={() => void directory.refetch()}
              className="flex-1 justify-center"
            />
          </View>
        ) : (
          <DirectorySkeleton layout={layout} columns={columns} cardHeight={cardHeight} />
        )}
      </>
    );
  }

  const filtered = !!category || !!query.trim();

  return (
    <>
      {header}
      <LegendList
        // A new column count or card height (the text size changed) needs a
        // fresh layout pass; Legend List keeps the old row positions otherwise.
        key={layout === 'grid' ? `grid-${columns}-${cardHeight}` : 'list'}
        data={items}
        keyExtractor={(item) => item.key}
        getItemType={(item) => item.kind}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <SectionHeader letter={item.letter} />
          ) : layout === 'grid' ? (
            <MemberCard member={item.member} isMe={item.isMe} height={cardHeight} />
          ) : (
            <MemberRow member={item.member} isMe={item.isMe} />
          )
        }
        numColumns={layout === 'grid' ? columns : 1}
        estimatedItemSize={layout === 'grid' ? cardHeight : 76}
        recycleItems
        refreshing={refreshing}
        onRefresh={refresh}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={layout === 'grid' ? { paddingHorizontal: 10, paddingBottom: 16 } : { paddingBottom: 16 }}
        style={{ flex: 1 }}
        className="bg-background"
        ListHeaderComponent={
          members.length ? (
            <ResultsBar
              shown={visible.length}
              total={members.length}
              filtered={filtered}
              category={category}
              onClearCategory={() => changeCategory(null)}
              inset={layout === 'grid' ? 6 : 16}
            />
          ) : null
        }
        ListEmptyComponent={
          members.length ? (
            <StatusMessage
              icon={{ ios: 'magnifyingglass', android: 'search_off' }}
              title="No matches"
              message={
                query.trim()
                  ? `No one${category ? ` in ${professionShortLabel(category)}` : ''} matches “${query.trim()}”.`
                  : `No members in ${professionShortLabel(category ?? '')} yet.`
              }
              actionTitle="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <StatusMessage
              icon={{ ios: 'person.2', android: 'group' }}
              title="No members yet"
              message="Members appear here once they’ve submitted their biodata."
            />
          )
        }
      />
    </>
  );
}

function SectionHeader({ letter }: { letter: string }) {
  return (
    <View className="bg-background px-4 pb-1 pt-3" accessibilityRole="header">
      <Text className="text-[15px] font-bold text-accent">{letter}</Text>
    </View>
  );
}

/** "12 of 140 members" and the active profession filter, which can be removed. */
function ResultsBar({
  shown,
  total,
  filtered,
  category,
  onClearCategory,
  inset,
}: {
  shown: number;
  total: number;
  filtered: boolean;
  category: string | null;
  onClearCategory: () => void;
  inset: number;
}) {
  const accent = useCSSVariable('--color-accent') as string;
  const label = category ? professionShortLabel(category) : '';
  return (
    <View className="flex-row flex-wrap items-center gap-2 pb-2 pt-1" style={{ paddingHorizontal: inset }}>
      {category ? (
        <Pressable
          onPress={onClearCategory}
          accessibilityRole="button"
          accessibilityLabel={`Filtered by ${label}`}
          accessibilityHint="Removes the filter"
          hitSlop={6}
          className="max-w-full flex-row items-center gap-1.5 rounded-full border border-border bg-surface py-1.5 pl-3 pr-2 active:opacity-60">
          <Icon name={{ ios: 'line.3.horizontal.decrease', android: 'filter_alt' }} size={14} color={accent} />
          <Text className="shrink text-sm font-semibold text-accent" numberOfLines={1}>
            {label}
          </Text>
          <Icon name={{ ios: 'xmark.circle.fill', android: 'cancel' }} size={16} color={accent} />
        </Pressable>
      ) : null}
      <Text
        className="text-sm text-muted"
        style={{ fontVariant: ['tabular-nums'] }}
        accessibilityLiveRegion="polite">
        {filtered ? `${shown} of ${memberCountLabel(total)}` : memberCountLabel(total)}
      </Text>
    </View>
  );
}
