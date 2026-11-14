import * as WebBrowser from 'expo-web-browser';
import { memo } from 'react';
import { Linking, Text, type TextProps } from 'react-native';

// URLs (with or without a scheme), emails and phone numbers.
const LINK_PATTERN =
  /(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]|www\.[^\s<]+[^\s<.,:;"')\]!?]|[\w.+-]+@[\w-]+\.[\w.-]+\w|\+?\d[\d\s-]{7,}\d)/gi;

type Part = { text: string; href?: string };

function split(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const value = match[0];
    const start = match.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    let href: string;
    if (value.includes('@') && !value.includes('/')) href = `mailto:${value}`;
    else if (/^\+?\d[\d\s-]+$/.test(value)) href = `tel:${value.replace(/[\s-]/g, '')}`;
    else href = value.startsWith('http') ? value : `https://${value}`;
    parts.push({ text: value, href });
    last = start + value.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

function open(href: string) {
  if (href.startsWith('http')) void WebBrowser.openBrowserAsync(href);
  else void Linking.openURL(href);
}

/** Message text with tappable links, emails and phone numbers. */
export const LinkedText = memo(function LinkedText({
  text,
  linkClassName,
  ...props
}: TextProps & { text: string; linkClassName?: string }) {
  const parts = split(text);
  return (
    <Text {...props}>
      {parts.map((part, i) =>
        part.href ? (
          <Text
            key={i}
            className={linkClassName}
            style={{ textDecorationLine: 'underline' }}
            suppressHighlighting={false}
            onPress={() => open(part.href!)}>
            {part.text}
          </Text>
        ) : (
          part.text
        ),
      )}
    </Text>
  );
});
