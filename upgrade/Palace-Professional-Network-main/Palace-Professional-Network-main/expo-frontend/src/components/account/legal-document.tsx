import type { ReactNode } from 'react';
import { ScrollView, Text, View } from 'react-native';

import type { LegalDocument } from '@/lib/legal';

/** A policy page: intro, then headed sections of paragraphs and bullet lists. */
export function LegalDocumentView({ document, children }: { document: LegalDocument; children?: ReactNode }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background"
      contentContainerClassName="gap-6 px-5 pb-12 pt-4">
      <View className="gap-2">
        {document.meta ? <Text className="text-[13px] text-muted">{document.meta}</Text> : null}
        <Text selectable className="text-base leading-6 text-foreground">
          {document.intro}
        </Text>
      </View>
      {document.sections.map((section) => (
        <View key={section.heading} className="gap-2">
          <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
            {section.heading}
          </Text>
          {section.paragraphs?.map((paragraph) => (
            <Text key={paragraph} selectable className="text-base leading-6 text-foreground">
              {paragraph}
            </Text>
          ))}
          {section.bullets ? (
            <View className="gap-1.5">
              {section.bullets.map((bullet) => (
                <View key={bullet} className="flex-row gap-2.5 pl-1">
                  <Text
                    className="text-base leading-6 text-accent"
                    accessibilityElementsHidden
                    importantForAccessibility="no">
                    •
                  </Text>
                  <Text selectable className="flex-1 text-base leading-6 text-foreground">
                    {bullet}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
      {children}
    </ScrollView>
  );
}
