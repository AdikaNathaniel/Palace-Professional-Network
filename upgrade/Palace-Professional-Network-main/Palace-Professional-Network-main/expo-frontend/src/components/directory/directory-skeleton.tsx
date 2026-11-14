import { ScrollView, View } from 'react-native';

import { Skeleton } from '@/components/ui/skeleton';
import type { DirectoryLayout } from '@/stores/directory-layout';

function RowSkeleton() {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3">
      <Skeleton style={{ width: 48, height: 48, borderRadius: 24 }} />
      <View className="flex-1 gap-2">
        <Skeleton style={{ width: '55%', height: 14 }} />
        <Skeleton style={{ width: '75%', height: 12 }} />
        <Skeleton style={{ width: '40%', height: 12 }} />
      </View>
    </View>
  );
}

function CardSkeleton({ height }: { height: number }) {
  return (
    <View className="flex-1 p-1.5" style={{ height }}>
      <View className="flex-1 items-center justify-center gap-2.5 rounded-2xl border border-border bg-surface">
        <Skeleton style={{ width: 76, height: 76, borderRadius: 38 }} />
        <Skeleton style={{ width: '65%', height: 14 }} />
        <Skeleton style={{ width: '50%', height: 12 }} />
        <Skeleton style={{ width: '40%', height: 10 }} />
      </View>
    </View>
  );
}

/** Placeholder rows or cards in the shape of the chosen layout, while the directory loads. */
export function DirectorySkeleton({
  layout,
  columns,
  cardHeight,
}: {
  layout: DirectoryLayout;
  columns: number;
  cardHeight: number;
}) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      scrollEnabled={false}
      className="flex-1 bg-background"
      accessible
      accessibilityLabel="Loading the directory"
      accessibilityState={{ busy: true }}>
      {layout === 'list' ? (
        Array.from({ length: 10 }, (_, i) => <RowSkeleton key={i} />)
      ) : (
        <View className="flex-row flex-wrap px-2.5 pt-2">
          {Array.from({ length: columns * 4 }, (_, i) => (
            <View key={i} style={{ width: `${100 / columns}%` }}>
              <CardSkeleton height={cardHeight} />
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
