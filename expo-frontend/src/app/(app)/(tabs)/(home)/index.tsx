import { Link, useIsFocused } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { toast } from 'sonner-native';
import { useCSSVariable } from 'uniwind';

import { CategoryGrid, categoryColumns } from '@/components/home/category-grid';
import { HeroBackdrop, HeroTitle } from '@/components/home/home-hero';
import { CompleteProfileCard, Greeting, QuickLinks, SectionHeading } from '@/components/home/home-sections';
import { useBiodataOptions, useDirectory, useMyBiodata } from '@/hooks/queries';
import { professionLine } from '@/lib/biodata';
import { countByCategory } from '@/lib/directory';
import { useSession } from '@/stores/session';

function AccountButton() {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <Link href="/account" asChild>
      <Pressable accessibilityLabel="Account" hitSlop={8} className="active:opacity-60">
        <SymbolView
          name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
          tintColor={accent}
          size={26}
        />
      </Pressable>
    </Link>
  );
}

/** Where the hero has scrolled under the header, so the bar takes over. */
function useHeaderReveal(scrollY: SharedValue<number>, heroHeight: number, headerHeight: number) {
  const end = heroHeight - headerHeight;
  return useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [end - 48, end], [0, 1], 'clamp'),
  }));
}

/** "Home", faded in once the hero (which carries the app name) has scrolled away. */
function HeaderTitle({ scrollY, heroHeight, headerHeight }: { scrollY: SharedValue<number>; heroHeight: number; headerHeight: number }) {
  const style = useHeaderReveal(scrollY, heroHeight, headerHeight);
  return (
    <Animated.Text
      style={style}
      className="text-[17px] font-semibold text-foreground"
      // Native bar titles barely grow with text size; neither does this one.
      maxFontSizeMultiplier={1.3}
      accessibilityRole="header">
      Home
    </Animated.Text>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { width, fontScale } = useWindowDimensions();
  const isFocused = useIsFocused();
  const sessionName = useSession((s) => s.session?.fullName);
  const options = useBiodataOptions();
  const directory = useDirectory();
  const mine = useMyBiodata();
  const [refreshing, setRefreshing] = useState(false);

  const minHeroHeight = Math.round(Math.min(width, 700) * 0.62) + insets.top;
  const [titleHeight, setTitleHeight] = useState(0);
  const heroHeight = Math.max(minHeroHeight, titleHeight);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });
  const backdropStyle = useHeaderReveal(scrollY, heroHeight, headerHeight);

  // Light status bar text over the photo; the theme's once the bar takes over.
  const [overHero, setOverHero] = useState(true);
  useAnimatedReaction(
    () => scrollY.get() < heroHeight - headerHeight,
    (now, before) => {
      if (now !== before) scheduleOnRN(setOverHero, now);
    },
  );

  const counts = useMemo(() => (directory.data ? countByCategory(directory.data) : undefined), [directory.data]);
  const name = mine.data?.fullName?.trim() || sessionName?.trim() || null;
  const needsProfile = mine.isSuccess && !mine.data;

  const contentWidth = Math.min(width, 1000) - 32;
  const columns = categoryColumns(width, fontScale);

  const refresh = async () => {
    setRefreshing(true);
    const results = await Promise.all([options.refetch(), directory.refetch(), mine.refetch()]);
    setRefreshing(false);
    const failed = results.find((r) => r.isError);
    if (failed) toast.error('Couldn’t refresh', { description: failed.error?.message });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerLargeTitleEnabled: false,
          headerTitle: () => <HeaderTitle scrollY={scrollY} heroHeight={heroHeight} headerHeight={headerHeight} />,
          headerRight: () => <AccountButton />,
        }}
      />
      {isFocused ? <StatusBar style={overHero ? 'light' : 'auto'} animated /> : null}
      <View className="flex-1 bg-background">
        <HeroBackdrop scrollY={scrollY} height={heroHeight} />
        <Animated.ScrollView
          onScroll={onScroll}
          scrollEventThrottle={16}
          // The hero runs under the status bar and the transparent header.
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          scrollIndicatorInsets={{ top: headerHeight, bottom: insets.bottom + 49 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#ffffff" progressViewOffset={headerHeight} />
          }>
          <HeroTitle minHeight={minHeroHeight} onHeight={setTitleHeight} />
          {/* The page slides up over the bottom of the photo. */}
          <View
            className="-mt-5 items-center rounded-t-3xl bg-background pt-6"
            style={{ borderCurve: 'continuous' }}>
            <View className="gap-7" style={{ width: contentWidth }}>
              <Greeting name={name} detail={mine.data ? professionLine(mine.data) : null} />
              {needsProfile ? <CompleteProfileCard /> : null}
              <QuickLinks />
              <View className="gap-3">
                <SectionHeading title="Browse by Profession" subtitle="Tap a profession to see everyone in it" />
                <CategoryGrid
                  categories={options.data?.professionCategories}
                  counts={counts}
                  isLoading={options.isLoading}
                  error={options.error}
                  onRetry={() => void options.refetch()}
                  contentWidth={contentWidth}
                  columns={columns}
                />
              </View>
            </View>
          </View>
        </Animated.ScrollView>
        {/* Fades in behind the transparent header once the hero has gone. */}
        <Animated.View
          pointerEvents="none"
          className="absolute inset-x-0 top-0 border-b border-border bg-background"
          style={[{ height: headerHeight }, backdropStyle]}
        />
      </View>
    </>
  );
}
