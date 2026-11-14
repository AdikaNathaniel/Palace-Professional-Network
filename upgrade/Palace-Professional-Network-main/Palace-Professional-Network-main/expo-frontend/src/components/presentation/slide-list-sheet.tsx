import { BottomSheet, FieldGroup, ListItem, Text } from '@expo/ui';
import { Text as RNText, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { sheetModifiers } from '@/components/chat/sheet-modifiers';
import { Icon } from '@/components/ui/icon';
import { SLIDES } from '@/lib/presentation';

/** Every slide by number and title; picking one jumps straight to it. */
export function SlideListSheet({
  isPresented,
  current,
  onDismiss,
  onSelect,
}: {
  isPresented: boolean;
  current: number;
  onDismiss: () => void;
  onSelect: (index: number) => void;
}) {
  const [surface, foreground, primary, accent] = useCSSVariable([
    '--color-surface',
    '--color-foreground',
    '--color-primary',
    '--color-accent',
  ]) as string[];

  return (
    <BottomSheet
      isPresented={isPresented}
      onDismiss={onDismiss}
      snapPoints={['half', 'full']}
      contentPadding={{ top: 16, left: 0, right: 0 }}
      containerColor={surface}
      modifiers={sheetModifiers(primary!)}>
      <FieldGroup>
        <FieldGroup.Section title="Slides">
          {SLIDES.map((slide, i) => {
            const isCurrent = i === current;
            return (
              <ListItem
                key={slide.id}
                onPress={() => onSelect(i)}
                leading={
                  <View className="w-7 items-end">
                    <RNText
                      className={`text-[15px] font-bold ${isCurrent ? 'text-primary' : 'text-muted'}`}
                      style={{ fontVariant: ['tabular-nums'] }}>
                      {i + 1}
                    </RNText>
                  </View>
                }
                trailing={
                  isCurrent ? (
                    <View className="size-6 items-center justify-center">
                      <Icon name={{ ios: 'checkmark', android: 'check' }} size={15} weight="semibold" color={accent} />
                    </View>
                  ) : undefined
                }>
                <Text
                  textStyle={{
                    fontSize: 16,
                    fontWeight: isCurrent ? '700' : '400',
                    color: isCurrent ? accent : foreground,
                  }}>
                  {slide.title}
                </Text>
              </ListItem>
            );
          })}
        </FieldGroup.Section>
      </FieldGroup>
    </BottomSheet>
  );
}
