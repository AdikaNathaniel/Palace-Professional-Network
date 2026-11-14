import { Stack } from 'expo-router/stack';

/**
 * The biodata form is a modal with its own stack, so the long pickers
 * (profession, trade) push inside it like a Settings detail screen.
 */
export default function BiodataFormLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="select" />
    </Stack>
  );
}
