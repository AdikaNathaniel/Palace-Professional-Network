import { router } from 'expo-router';
import { useEffect } from 'react';

import { OptionList } from '@/components/biodata/option-list';
import { getOptionPickerRequest } from '@/lib/option-picker';

export default function SelectOptionScreen() {
  const request = getOptionPickerRequest();

  // Nothing to pick from (e.g. the app reloaded on this screen): back to the form.
  useEffect(() => {
    if (!request) router.back();
  }, [request]);

  return request ? <OptionList request={request} /> : null;
}
