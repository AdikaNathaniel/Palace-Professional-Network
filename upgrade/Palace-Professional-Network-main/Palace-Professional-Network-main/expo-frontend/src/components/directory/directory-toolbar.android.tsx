import { Host, RNHostView } from '@expo/ui';
import { DropdownMenu, DropdownMenuItem, Text } from '@expo/ui/jetpack-compose';
import { Stack } from 'expo-router/stack';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import type { DirectoryToolbarProps } from '@/components/directory/directory-toolbar';
import { Icon, type IconName } from '@/components/ui/icon';
import { professionShortLabel } from '@/lib/chat/rooms';
import { memberCountLabel } from '@/lib/directory';

function HeaderIcon({
  name,
  label,
  onPress,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
}) {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={4}
      className="size-12 items-center justify-center rounded-full active:opacity-60">
      <Icon name={name} size={24} color={accent} />
    </Pressable>
  );
}

/**
 * Android: the same controls as the iOS toolbar, as header icon buttons with
 * a Material dropdown for the profession filter.
 */
export function DirectoryToolbar(props: DirectoryToolbarProps) {
  return <Stack.Screen options={{ headerRight: () => <HeaderActions {...props} /> }} />;
}

function HeaderActions({
  categories,
  counts,
  category,
  onCategoryChange,
  layout,
  onLayoutChange,
}: DirectoryToolbarProps) {
  const [open, setOpen] = useState(false);
  const choose = (value: string | null) => {
    setOpen(false);
    onCategoryChange(value);
  };

  return (
    <View className="flex-row items-center">
      <Host matchContents>
        <DropdownMenu expanded={open} onDismissRequest={() => setOpen(false)}>
          <DropdownMenu.Trigger>
            <RNHostView matchContents>
              <HeaderIcon
                name={
                  category
                    ? { ios: 'line.3.horizontal.decrease.circle.fill', android: 'filter_alt' }
                    : { ios: 'line.3.horizontal.decrease.circle', android: 'filter_list' }
                }
                label={category ? `Filter: ${professionShortLabel(category)}` : 'Filter by profession'}
                onPress={() => setOpen(true)}
              />
            </RNHostView>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            <DropdownMenuItem onClick={() => choose(null)}>
              <DropdownMenuItem.Text>
                <Text>{`${category ? '' : '✓  '}All professions`}</Text>
              </DropdownMenuItem.Text>
            </DropdownMenuItem>
            {categories.map((c) => (
              <DropdownMenuItem key={c} onClick={() => choose(c)}>
                <DropdownMenuItem.Text>
                  <Text>{`${c === category ? '✓  ' : ''}${professionShortLabel(c)} (${memberCountLabel(counts.get(c) ?? 0)})`}</Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      </Host>
      <HeaderIcon
        name={
          layout === 'list'
            ? { ios: 'square.grid.2x2', android: 'grid_view' }
            : { ios: 'list.bullet', android: 'view_list' }
        }
        label={layout === 'list' ? 'Show as grid' : 'Show as list'}
        onPress={() => onLayoutChange(layout === 'list' ? 'grid' : 'list')}
      />
    </View>
  );
}
