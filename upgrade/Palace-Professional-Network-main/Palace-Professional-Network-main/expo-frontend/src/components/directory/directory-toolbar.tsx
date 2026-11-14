import type { DirectoryLayout } from '@/stores/directory-layout';

export type DirectoryToolbarProps = {
  /** Every profession category, in the order the form lists them. */
  categories: string[];
  counts: Map<string, number>;
  category: string | null;
  onCategoryChange: (category: string | null) => void;
  layout: DirectoryLayout;
  onLayoutChange: (layout: DirectoryLayout) => void;
};

/**
 * The header's filter menu and list/grid switch are native: a toolbar on iOS
 * (directory-toolbar.ios.tsx), a Material dropdown on Android
 * (directory-toolbar.android.tsx). Web has neither; the filter chip and
 * search still work there.
 */
export function DirectoryToolbar(_props: DirectoryToolbarProps) {
  return null;
}
