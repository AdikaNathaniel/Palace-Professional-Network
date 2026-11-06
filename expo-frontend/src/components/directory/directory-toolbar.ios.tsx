import { Stack } from 'expo-router/stack';
import { useCSSVariable } from 'uniwind';

import type { DirectoryToolbarProps } from '@/components/directory/directory-toolbar';
import { professionShortLabel } from '@/lib/chat/rooms';
import { memberCountLabel } from '@/lib/directory';

/** Filter-by-profession menu and the list/grid switch, as native header items. */
export function DirectoryToolbar({
  categories,
  counts,
  category,
  onCategoryChange,
  layout,
  onLayoutChange,
}: DirectoryToolbarProps) {
  const accent = useCSSVariable('--color-accent') as string;
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Menu
        icon={category ? 'line.3.horizontal.decrease.circle.fill' : 'line.3.horizontal.decrease.circle'}
        accessibilityLabel={
          category ? `Filter: ${professionShortLabel(category)}` : 'Filter by profession'
        }
        title="Filter by Profession"
        tintColor={accent}>
        <Stack.Toolbar.MenuAction
          icon="person.2"
          isOn={!category}
          onPress={() => onCategoryChange(null)}>
          All Professions
        </Stack.Toolbar.MenuAction>
        <Stack.Toolbar.Menu inline>
          {categories.map((c) => (
            <Stack.Toolbar.MenuAction
              key={c}
              isOn={c === category}
              subtitle={memberCountLabel(counts.get(c) ?? 0)}
              onPress={() => onCategoryChange(c)}>
              {professionShortLabel(c)}
            </Stack.Toolbar.MenuAction>
          ))}
        </Stack.Toolbar.Menu>
      </Stack.Toolbar.Menu>
      <Stack.Toolbar.Button
        icon={layout === 'list' ? 'square.grid.2x2' : 'list.bullet'}
        accessibilityLabel={layout === 'list' ? 'Show as grid' : 'Show as list'}
        onPress={() => onLayoutChange(layout === 'list' ? 'grid' : 'list')}
        tintColor={accent}
      />
    </Stack.Toolbar>
  );
}
