import { useState, type Ref } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useCSSVariable } from 'uniwind';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  ref?: Ref<TextInput>;
};

export function TextField({ label, error, onFocus, onBlur, ref, ...rest }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const muted = useCSSVariable('--color-muted') as string | undefined;

  const border = error ? 'border-danger' : focused ? 'border-primary' : 'border-border';

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={muted}
        className={`h-14 rounded-2xl border-2 bg-surface px-4 text-base text-foreground ${border}`}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
      />
      {error ? <Text className="text-sm text-danger">{error}</Text> : null}
    </View>
  );
}
