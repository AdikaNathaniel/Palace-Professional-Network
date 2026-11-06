import { Stack } from 'expo-router/stack';
import { useDeferredValue, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { ChiefCard, ConcernsBanner, Intro, LeadershipExplainer } from '@/components/about/about-sections';
import { GroupCard } from '@/components/about/group-card';
import { SectionHeading } from '@/components/home/home-sections';
import { StatusMessage } from '@/components/status-message';
import { searchLeadership } from '@/lib/leadership';

export default function AboutScreen() {
  const { width, fontScale } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search).trim();
  // Groups the member has opened; while searching, every match is open.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const results = searchLeadership(query);
  const searching = !!query;
  const nothingFound = searching && !results.chief && !results.groups.length;

  const toggle = (name: string) =>
    setExpanded((open) => {
      const next = new Set(open);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  return (
    <>
      <Stack.SearchBar
        placeholder="Groups and leaders"
        autoCapitalize="none"
        onChangeText={(e) => setSearch(e.nativeEvent.text)}
        onCancelButtonPress={() => setSearch('')}
      />
      <ScrollView
        // React Native keeps text measured at the old size when the system
        // text size changes; a fresh layout fixes it.
        key={fontScale}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        className="flex-1 bg-background"
        contentContainerClassName="items-center pb-8 pt-2">
        {/* Comfortable reading width on tablets. */}
        <View className="gap-4 px-4" style={{ width: Math.min(width, 720) }}>
          {searching ? null : (
            <>
              <Intro />
              <LeadershipExplainer />
              <ConcernsBanner />
            </>
          )}

          {results.chief ? (
            <View className="mt-2 gap-2">
              <SectionHeading title="Chief Professional Coordinator" />
              <ChiefCard />
            </View>
          ) : null}

          {results.groups.length ? (
            <View className="mt-2 gap-2">
              <SectionHeading
                title="Professional Groups"
                subtitle={searching ? undefined : 'Tap a group to see its leaders'}
              />
              <View className="gap-2.5">
                {results.groups.map((group) => (
                  <GroupCard
                    key={group.name}
                    group={group}
                    expanded={searching || expanded.has(group.name)}
                    onToggle={searching ? undefined : () => toggle(group.name)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {nothingFound ? (
            <StatusMessage
              icon={{ ios: 'magnifyingglass', android: 'search_off' }}
              title="No matches"
              message={`No group or leader matches “${query}”.`}
            />
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
