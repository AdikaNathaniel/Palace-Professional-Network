import { FieldGroup, Host, RNHostView, useNativeState, type TextInputRef } from '@expo/ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { router, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';
import { ActivityIndicator, Alert, Pressable, Text as RNText, View } from 'react-native';
import { toast } from 'sonner-native';
import { useUniwind } from 'uniwind';

import { Avatar } from '@/components/avatar';
import { formModifiers, sectionModifiers } from '@/components/forms/form-modifiers';
import { ChoiceRow, PickerRow, SectionNote, TextRow, useFormColors } from '@/components/forms/form-rows';
import { Icon } from '@/components/ui/icon';
import { biodataApi } from '@/lib/api/endpoints';
import type { Biodata, BiodataOptions, LocalFile } from '@/lib/api/types';
import { needsTrade } from '@/lib/biodata';
import { openOptionPicker } from '@/lib/option-picker';
import { choosePhotoAction, pickProfilePhoto } from '@/lib/profile-photo';
import { queryClient, queryKeys } from '@/lib/query-client';
import { biodataSchema, type BiodataValues } from '@/lib/validation';

type FieldName = keyof BiodataValues;

const FIELD_LABELS: Record<FieldName, string> = {
  fullName: 'Full name',
  ageRange: 'Age',
  gender: 'Gender',
  maritalStatus: 'Marital status',
  email: 'Email',
  professionCategory: 'Profession',
  professionSubCategory: 'Trade or business',
  placeOfWork: 'Place of work',
};

function defaultsFrom(existing: Biodata | null): BiodataValues {
  return {
    fullName: existing?.fullName ?? '',
    ageRange: existing?.ageRange ?? '',
    gender: existing?.gender ?? '',
    maritalStatus: existing?.maritalStatus ?? '',
    email: existing?.email ?? '',
    professionCategory: existing?.professionCategory ?? '',
    professionSubCategory: existing?.professionSubCategory ?? '',
    placeOfWork: existing?.placeOfWork ?? '',
  };
}

/**
 * Create or edit the signed-in member's biodata. Mounted once the options
 * and their existing record have loaded, so the fields start pre-filled.
 */
export function BiodataForm({
  options,
  existing,
  phoneNumber,
}: {
  options: BiodataOptions;
  existing: Biodata | null;
  phoneNumber: string;
}) {
  const colors = useFormColors();
  const { theme } = useUniwind();
  const navigation = useNavigation();
  const [defaults] = useState(() => defaultsFrom(existing));
  // The text lives in native state owned here, so a field keeps what was
  // typed even if its row remounts (e.g. when the trade row appears above it).
  const fullNameText = useNativeState(defaults.fullName);
  const emailText = useNativeState(defaults.email);
  const placeText = useNativeState(defaults.placeOfWork);
  const phoneText = useNativeState(phoneNumber);
  const emailRef = useRef<TextInputRef>(null);
  const placeRef = useRef<TextInputRef>(null);

  const { control, setValue, getValues, trigger, handleSubmit } = useForm<BiodataValues>({
    resolver: zodResolver(biodataSchema(options)),
    mode: 'onChange',
    defaultValues: defaults,
  });
  const values = useWatch({ control }) as BiodataValues;
  const { errors, touchedFields, isDirty, isValid } = useFormState({ control });

  const [photo, setPhoto] = useState<LocalFile | null>(null);
  const [saved, setSaved] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);

  const changed = isDirty || !!photo;
  const showTrade = needsTrade(values.professionCategory);

  const set = (name: FieldName, value: string) =>
    setValue(name, value, { shouldDirty: true, shouldValidate: true });
  // Text fields only complain once the member has left them.
  const touch = (name: FieldName) =>
    setValue(name, getValues(name), { shouldTouch: true, shouldValidate: true });
  const errorFor = (name: FieldName) =>
    touchedFields[name] || showAllErrors ? errors[name]?.message : undefined;

  const save = useMutation({
    mutationFn: (input: BiodataValues) =>
      biodataApi.submit({ ...input, phoneNumber }, photo ?? undefined),
    onSuccess: (record) => {
      // The account screen, home banner and inbox (which watches the
      // profession group chat) read this, so update it before it refetches.
      queryClient.setQueryData(queryKeys.myBiodata, record);
      void queryClient.invalidateQueries({ queryKey: queryKeys.myBiodata });
      void queryClient.invalidateQueries({ queryKey: queryKeys.directory });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success(existing ? 'Biodata updated successfully' : 'Biodata submitted successfully', {
        description: 'Other members can find you in the Professional Directory.',
      });
      setSaved(true);
    },
    onError: (error) => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Your biodata wasn’t saved', { description: error.message });
    },
  });

  // Leave once the save has lifted the unsaved-changes guard below.
  useEffect(() => {
    if (saved) router.dismissTo('/directory');
  }, [saved]);

  usePreventRemove(changed && !saved, ({ data }) => {
    Alert.alert('Discard changes?', 'Your changes to your biodata haven’t been saved.', [
      { text: 'Keep Editing', style: 'cancel' },
      {
        text: 'Discard Changes',
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const submit = handleSubmit(
    (input) => save.mutate(input),
    () => setShowAllErrors(true),
  );
  const canSave = changed && isValid && !save.isPending;

  const changePhoto = async () => {
    const action = await choosePhotoAction(!!photo);
    if (action === 'remove') setPhoto(null);
    else if (action) {
      const picked = await pickProfilePhoto(action);
      if (picked) setPhoto(picked);
    }
  };

  const chooseProfession = () =>
    openOptionPicker({
      title: 'Profession',
      searchPlaceholder: 'Search professions',
      groups: [{ title: '', items: options.professionCategories }],
      selected: getValues('professionCategory'),
      onSelect: (category) => {
        // A trade only belongs to the category it was picked under.
        if (category !== getValues('professionCategory')) set('professionSubCategory', '');
        set('professionCategory', category);
        // Whether a trade is required depends on the category, so recheck both.
        void trigger(['professionCategory', 'professionSubCategory']);
      },
    });

  const chooseTrade = () =>
    openOptionPicker({
      title: 'Trade or Business',
      searchPlaceholder: 'Search trades, e.g. tailor, phones',
      groups: Object.entries(options.professionSubCategories).map(([title, items]) => ({ title, items })),
      selected: getValues('professionSubCategory'),
      onSelect: (trade) => set('professionSubCategory', trade),
    });

  const missing = (Object.keys(errors) as FieldName[]).map((name) => FIELD_LABELS[name]);
  const workError =
    errorFor('professionCategory') ?? errorFor('professionSubCategory') ?? errorFor('placeOfWork');
  // The API leaves out empty fields, so a saved email can't be cleared yet.
  const emailKept = !!existing?.email && !values.email.trim();

  return (
    <>
      <Stack.Screen.Title>{existing ? 'Edit Biodata' : 'My Biodata'}</Stack.Screen.Title>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button onPress={() => router.back()}>Cancel</Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        {save.isPending ? (
          <Stack.Toolbar.View>
            <View className="h-8 w-12 items-center justify-center" accessibilityLabel="Saving">
              <ActivityIndicator />
            </View>
          </Stack.Toolbar.View>
        ) : (
          <Stack.Toolbar.Button variant="done" disabled={!canSave} onPress={submit}>
            Save
          </Stack.Toolbar.Button>
        )}
      </Stack.Toolbar>

      <View className="flex-1 bg-background">
        <Host style={{ flex: 1 }} colorScheme={theme === 'dark' ? 'dark' : 'light'}>
          <FieldGroup modifiers={formModifiers(colors.accent)} disabled={save.isPending}>
            <FieldGroup.Section modifiers={sectionModifiers(colors.surface)}>
              <FieldGroup.SectionHeader>
                <RNHostView matchContents={{ vertical: true }}>
                  <PhotoPicker
                    name={values.fullName}
                    imageUrl={photo?.uri ?? existing?.imageUrl}
                    hasPhoto={!!(photo || existing?.imageUrl)}
                    onPress={changePhoto}
                  />
                </RNHostView>
              </FieldGroup.SectionHeader>
              <TextRow
                key="fullName"
                label="Full Name"
                colors={colors}
                placeholder="Required"
                value={fullNameText}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                returnKeyType="next"
                maxLength={100}
                invalid={!!errorFor('fullName')}
                onChangeText={(text) => set('fullName', text)}
                onBlur={() => touch('fullName')}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <PickerRow
                key="ageRange"
                label="Age"
                colors={colors}
                value={values.ageRange}
                options={options.ageRanges}
                onChange={(v) => set('ageRange', v)}
              />
              <PickerRow
                key="gender"
                label="Gender"
                colors={colors}
                value={values.gender}
                options={options.genders}
                onChange={(v) => set('gender', v)}
              />
              <PickerRow
                key="maritalStatus"
                label="Marital Status"
                colors={colors}
                value={values.maritalStatus}
                options={options.maritalStatuses}
                onChange={(v) => set('maritalStatus', v)}
              />
              {errorFor('fullName') ? (
                <SectionNote colors={colors} error>
                  {errorFor('fullName')!}
                </SectionNote>
              ) : null}
            </FieldGroup.Section>

            <FieldGroup.Section title="Contact" modifiers={sectionModifiers(colors.surface)}>
              <TextRow
                key="email"
                ref={emailRef}
                label="Email"
                colors={colors}
                placeholder="Optional"
                value={emailText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="next"
                maxLength={254}
                invalid={!!errorFor('email')}
                onChangeText={(text) => set('email', text)}
                onBlur={() => touch('email')}
                onSubmitEditing={() => placeRef.current?.focus()}
              />
              <TextRow key="phone" label="Phone" colors={colors} value={phoneText} readOnly />
              <SectionNote colors={colors} error={!!errorFor('email')}>
                {errorFor('email') ??
                  (emailKept
                    ? 'Your saved email stays on your profile until you enter a new one.'
                    : 'Your phone number is your login, so it can’t be changed here.')}
              </SectionNote>
            </FieldGroup.Section>

            <FieldGroup.Section title="Work" modifiers={sectionModifiers(colors.surface)}>
              <ChoiceRow
                key="professionCategory"
                label="Profession"
                colors={colors}
                value={values.professionCategory}
                placeholder="Choose your profession"
                invalid={!!errorFor('professionCategory')}
                onPress={chooseProfession}
              />
              {showTrade ? (
                <ChoiceRow
                  key="professionSubCategory"
                  label="Trade or Business"
                  colors={colors}
                  value={values.professionSubCategory}
                  placeholder="Choose your trade or business"
                  invalid={!!errorFor('professionSubCategory')}
                  onPress={chooseTrade}
                />
              ) : null}
              <TextRow
                key="placeOfWork"
                ref={placeRef}
                label="Place of Work"
                colors={colors}
                placeholder="Required"
                value={placeText}
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={150}
                invalid={!!errorFor('placeOfWork')}
                onChangeText={(text) => set('placeOfWork', text)}
                onBlur={() => touch('placeOfWork')}
              />
              <SectionNote colors={colors} error={!!workError || (changed && missing.length > 0)}>
                {workError ??
                  (changed && missing.length
                    ? `To save, complete or fix: ${missing.join(', ')}.`
                    : 'Members find you in the Directory by your profession.')}
              </SectionNote>
            </FieldGroup.Section>
          </FieldGroup>
        </Host>
      </View>
    </>
  );
}

function PhotoPicker({
  name,
  imageUrl,
  hasPhoto,
  onPress,
}: {
  name: string;
  imageUrl?: string | null;
  hasPhoto: boolean;
  onPress: () => void;
}) {
  return (
    <View className="items-center pb-4 pt-2">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? 'Profile photo' : 'Add a profile photo'}
        accessibilityHint="Take a photo or choose one from your library"
        className="items-center gap-2 active:opacity-70">
        <View>
          <Avatar name={name} imageUrl={imageUrl} size={96} />
          <View className="absolute bottom-0 right-0 size-8 items-center justify-center rounded-full border-2 border-background bg-primary">
            <Icon name={{ ios: 'camera.fill', android: 'photo_camera' }} size={14} color="#ffffff" />
          </View>
        </View>
        <RNText className="text-[15px] font-medium text-accent">{hasPhoto ? 'Edit Photo' : 'Add Photo'}</RNText>
      </Pressable>
    </View>
  );
}
