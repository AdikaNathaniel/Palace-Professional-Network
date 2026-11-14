import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { StatusMessage } from '@/components/status-message';
import { Image } from '@/components/ui/image';
import { Skeleton } from '@/components/ui/skeleton';
import { professionShortLabel } from '@/lib/chat/rooms';
import { memberCountLabel } from '@/lib/directory';
import { professionImage } from '@/lib/profession-images';

const GAP = 12;

/**
 * Two columns on phones, more on wider screens, and one fewer at very large
 * text sizes so long profession names don't break mid-word.
 */
export function categoryColumns(width: number, fontScale: number) {
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  return fontScale > 1.4 ? columns - 1 : columns;
}

/** Height relative to width; a full-width card would be far too tall at the grid's ratio. */
const cardRatio = (columns: number) => (columns === 1 ? 0.5 : 0.95);

/**
 * A profession's illustration with its name and member count over it. Opens
 * the Directory filtered to that profession; the filter is a route param, so
 * it works even if the Directory tab hasn't been opened yet.
 */
const CategoryCard = memo(function CategoryCard({
  category,
  count,
  width,
  ratio,
}: {
  category: string;
  /** Undefined while the directory is still loading. */
  count: number | undefined;
  width: number;
  ratio: number;
}) {
  const label = professionShortLabel(category);
  const countText = count === undefined ? null : count ? memberCountLabel(count) : 'No members yet';
  return (
    <Link href={{ pathname: '/directory', params: { category } }} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={countText ? `${label}, ${countText}` : label}
        accessibilityHint="Shows them in the Directory"
        className="overflow-hidden rounded-2xl bg-surface active:opacity-80"
        // A minimum, not a fixed height: the card grows with large text.
        style={{ width, minHeight: width * ratio, borderCurve: 'continuous' }}>
        <Image
          source={professionImage(category)}
          contentFit="cover"
          transition={200}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={['rgba(16,10,36,0)', 'rgba(16,10,36,0.45)', 'rgba(16,10,36,0.92)']}
          locations={[0.15, 0.5, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="flex-1 justify-end gap-0.5 p-3">
          <Text
            className="text-base font-bold leading-tight text-white"
            style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 6 }}
            numberOfLines={3}>
            {label}
          </Text>
          {countText ? (
            <Text className="text-[13px] font-medium text-white/80" style={{ fontVariant: ['tabular-nums'] }}>
              {countText}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
});

/** The "Browse by Profession" grid, with its loading, error and empty states. */
export function CategoryGrid({
  categories,
  counts,
  isLoading,
  error,
  onRetry,
  contentWidth,
  columns,
}: {
  categories: string[] | undefined;
  counts: Map<string, number> | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  contentWidth: number;
  columns: number;
}) {
  const cardWidth = Math.floor((contentWidth - GAP * (columns - 1)) / columns);

  if (!categories) {
    if (error && !isLoading) {
      return (
        <StatusMessage
          icon={{ ios: 'wifi.exclamationmark', android: 'cloud_off' }}
          title="Couldn’t load professions"
          message={error.message}
          actionTitle="Try Again"
          onAction={onRetry}
          className="py-8"
        />
      );
    }
    return (
      <View
        className="flex-row flex-wrap"
        style={{ gap: GAP }}
        accessible
        accessibilityLabel="Loading professions"
        accessibilityState={{ busy: true }}>
        {Array.from({ length: columns * 3 }, (_, i) => (
          <Skeleton key={i} style={{ width: cardWidth, height: cardWidth * cardRatio(columns), borderRadius: 16 }} />
        ))}
      </View>
    );
  }

  if (!categories.length) {
    return (
      <StatusMessage
        icon={{ ios: 'briefcase', android: 'work' }}
        title="No professions yet"
        className="py-8"
      />
    );
  }

  return (
    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
      {categories.map((category) => (
        <CategoryCard
          key={category}
          category={category}
          count={counts?.get(category) ?? (counts ? 0 : undefined)}
          width={cardWidth}
          ratio={cardRatio(columns)}
        />
      ))}
    </View>
  );
}
