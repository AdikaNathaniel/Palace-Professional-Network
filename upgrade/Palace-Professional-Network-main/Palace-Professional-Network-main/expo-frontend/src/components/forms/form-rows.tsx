/**
 * Rows for native grouped forms built with @expo/ui (a SwiftUI Form on iOS,
 * Compose on Android). Each row reads "Label … value", like the Settings
 * app, so a menu picker or text field always sits next to what it's for.
 */
import { FieldGroup, ListItem, Picker, Row, Spacer, Text, TextInput } from '@expo/ui';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { a11y } from '@/components/forms/form-modifiers';
import { Icon } from '@/components/ui/icon';

export function useFormColors() {
  const [background, surface, foreground, muted, danger, primary, accent] = useCSSVariable([
    '--color-background',
    '--color-surface',
    '--color-foreground',
    '--color-muted',
    '--color-danger',
    '--color-primary',
    '--color-accent',
  ]) as string[];
  return {
    background: background!,
    surface: surface!,
    foreground: foreground!,
    muted: muted!,
    danger: danger!,
    primary: primary!,
    accent: accent!,
  };
}

export type FormColors = ReturnType<typeof useFormColors>;

const LABEL_SIZE = 17;

function Label({ children, colors }: { children: string; colors: FormColors }) {
  return <Text textStyle={{ fontSize: LABEL_SIZE, color: colors.foreground }}>{children}</Text>;
}

type TextRowProps = Pick<
  ComponentProps<typeof TextInput>,
  | 'value'
  | 'placeholder'
  | 'keyboardType'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'autoComplete'
  | 'returnKeyType'
  | 'maxLength'
  | 'onBlur'
  | 'onFocus'
  | 'onChangeText'
  | 'onSubmitEditing'
  | 'ref'
> & {
  label: string;
  colors: FormColors;
  /** Read-only rows show the value in the muted colour and can't be edited. */
  readOnly?: boolean;
  invalid?: boolean;
};

/** A labelled single-line text field; the text is right-aligned after the label. */
export function TextRow({ label, colors, readOnly, invalid, ...input }: TextRowProps) {
  return (
    <Row alignment="center" spacing={12}>
      <Label colors={colors}>{label}</Label>
      <TextInput
        {...input}
        readOnly={readOnly}
        textAlign="right"
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        textStyle={{ fontSize: LABEL_SIZE, color: readOnly ? colors.muted : invalid ? colors.danger : colors.foreground }}
        modifiers={a11y(label, readOnly ? 'Read only' : undefined)}
      />
    </Row>
  );
}

/**
 * A labelled menu picker for short lists. While nothing is chosen it shows
 * `placeholder`, which disappears from the menu once a real value is picked.
 */
export function PickerRow({
  label,
  value,
  options,
  placeholder = 'Select',
  onChange,
  colors,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  colors: FormColors;
  disabled?: boolean;
}) {
  return (
    <Row alignment="center" spacing={12} modifiers={a11y(label, value ? undefined : 'Required')}>
      <Label colors={colors}>{label}</Label>
      <Spacer />
      <Picker selectedValue={value} onValueChange={onChange} enabled={!disabled}>
        {value ? null : <Picker.Item label={placeholder} value="" />}
        {options.map((option) => (
          <Picker.Item key={option} label={option} value={option} />
        ))}
      </Picker>
    </Row>
  );
}

/**
 * A row that opens a separate picker screen, for long lists and long option
 * names: the label on top, the current choice (or a prompt) underneath, and
 * a disclosure chevron.
 */
export function ChoiceRow({
  label,
  value,
  placeholder,
  onPress,
  colors,
  invalid,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  colors: FormColors;
  invalid?: boolean;
}) {
  return (
    <ListItem
      onPress={onPress}
      modifiers={a11y(`${label}: ${value || 'not chosen'}`, `Opens a searchable list`)}
      supportingText={
        <Text
          textStyle={{ fontSize: 15, color: value ? colors.muted : invalid ? colors.danger : colors.primary }}>
          {value || placeholder}
        </Text>
      }
      trailing={
        <View className="size-5 items-center justify-center">
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={14} weight="semibold" color={colors.muted} />
        </View>
      }>
      <Label colors={colors}>{label}</Label>
    </ListItem>
  );
}

/** A section footer: guidance in the muted colour, or an error in red. */
export function SectionNote({ children, colors, error }: { children: string; colors: FormColors; error?: boolean }) {
  return (
    <FieldGroup.SectionFooter>
      <Text textStyle={{ fontSize: 13, color: error ? colors.danger : colors.muted }}>{children}</Text>
    </FieldGroup.SectionFooter>
  );
}
