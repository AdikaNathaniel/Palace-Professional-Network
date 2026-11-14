import { SegmentedControl } from '@expo/ui/community/segmented-control';
import { LegendList } from '@legendapp/list/react-native';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { ApiError } from '@/lib/api/client';
import { chatApi } from '@/lib/api/endpoints';
import type { Sticker } from '@/lib/api/types';
import { pickSticker } from '@/lib/chat/sticker-picks';

const KINDS = ['Stickers', 'GIFs'] as const;
const GAP = 8;
const PADDING = 12;

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** GIPHY sticker and GIF search; an empty search shows what's trending. */
export function StickerPicker({ roomId }: { roomId: string }) {
  const muted = useCSSVariable('--color-muted') as string;
  const { width } = useWindowDimensions();
  const [kindIndex, setKindIndex] = useState(0);
  const [search, setSearch] = useState('');
  const query = useDebounced(search.trim(), 400);
  const isGif = kindIndex === 1;
  const kind = isGif ? 'gifs' : 'stickers';
  const columns = isGif ? 2 : 3;
  const cell = (width - PADDING * 2 - GAP * (columns - 1)) / columns;

  const { data, error, isLoading } = useQuery({
    queryKey: ['chat', 'stickers', kind, query],
    queryFn: () => chatApi.stickers(query, kind),
    staleTime: 5 * 60_000,
  });

  const choose = (sticker: Sticker) => {
    void Haptics.selectionAsync();
    pickSticker(roomId, { sticker, isGif });
    router.back();
  };

  return (
    <View className="flex-1 bg-surface">
      <View className="gap-3 px-3 pb-2 pt-5">
        <SegmentedControl
          values={[...KINDS]}
          selectedIndex={kindIndex}
          onChange={(e) => setKindIndex(e.nativeEvent.selectedSegmentIndex)}
        />
        <View className="h-10 flex-row items-center gap-2 rounded-xl bg-background px-3" style={{ borderCurve: 'continuous' }}>
          <Icon name={{ ios: 'magnifyingglass', android: 'search' }} size={16} color={muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${isGif ? 'GIFs' : 'stickers'}`}
            placeholderTextColor={muted}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
            className="flex-1 text-[16px] text-foreground"
          />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text selectable className="text-center text-base text-muted">
            {error instanceof ApiError ? error.message : 'Could not load stickers.'}
          </Text>
        </View>
      ) : (
        <LegendList
          key={kind}
          data={data ?? []}
          numColumns={columns}
          keyExtractor={(item) => item.id}
          estimatedItemSize={cell + GAP}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          columnWrapperStyle={{ columnGap: GAP, rowGap: GAP }}
          contentContainerStyle={{ paddingHorizontal: PADDING, paddingBottom: 24 }}
          style={{ flex: 1 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => choose(item)}
              accessibilityRole="button"
              accessibilityLabel={isGif ? 'Send GIF' : 'Send sticker'}
              className="items-center justify-center active:opacity-60"
              style={{ width: cell, height: cell }}>
              <Image
                source={{ uri: item.previewUrl }}
                className={isGif ? 'size-full rounded-lg bg-background' : 'size-full'}
                contentFit={isGif ? 'cover' : 'contain'}
                recyclingKey={item.id}
              />
            </Pressable>
          )}
          ListEmptyComponent={
            <Text className="py-12 text-center text-base text-muted">Nothing found</Text>
          }
          ListFooterComponent={<Text className="py-3 text-center text-xs text-muted">Powered by GIPHY</Text>}
        />
      )}
    </View>
  );
}
