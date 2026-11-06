import { useLocalSearchParams } from 'expo-router';

import { LeaderSheet } from '@/components/about/leader-sheet';

export default function LeaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LeaderSheet id={id} />;
}
