import { router } from 'expo-router';
import { Stack } from 'expo-router/stack';

import { BiodataForm } from '@/components/biodata/biodata-form';
import { BiodataFormSkeleton } from '@/components/biodata/biodata-form-skeleton';
import { QueryState } from '@/components/query-state';
import { useBiodataOptions, useMyBiodata } from '@/hooks/queries';
import { useSession } from '@/stores/session';

export default function BiodataFormScreen() {
  const phoneNumber = useSession((s) => s.session?.phoneNumber ?? '');
  const options = useBiodataOptions();
  const mine = useMyBiodata();

  // Both load together; the form only mounts with its starting values.
  const error = options.error ?? mine.error;
  if (error && !(options.data && mine.isSuccess)) {
    return (
      <>
        <CancelOnly />
        <QueryState
          error={error}
          onRetry={() => {
            if (options.isError) void options.refetch();
            if (mine.isError) void mine.refetch();
          }}
        />
      </>
    );
  }
  if (!options.data || !mine.isSuccess) {
    return (
      <>
        <CancelOnly />
        <BiodataFormSkeleton />
      </>
    );
  }

  return <BiodataForm options={options.data} existing={mine.data} phoneNumber={phoneNumber} />;
}

/** Header for the loading and error states: a way out, and the title. */
function CancelOnly() {
  return (
    <>
      <Stack.Screen.Title>My Biodata</Stack.Screen.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>Cancel</Stack.Toolbar.Button>
      </Stack.Toolbar>
    </>
  );
}
