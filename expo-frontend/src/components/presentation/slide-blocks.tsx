/**
 * The presentation's building blocks, drawn from the data in
 * lib/presentation.ts. Bullet markers are text in the body font, so they
 * stay on the first line of their item at any text size.
 */
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Icon, type IconName } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { BRAND_GRADIENT } from '@/constants/brand';
import type { Block, BulletStyle, SlideId } from '@/lib/presentation';

const BODY = 'text-[15px] leading-[22px] text-foreground';

/** Moves the deck to another slide; outline rows and the closing button use it. */
export type JumpHandler = (slide: SlideId) => void;

function useAccent() {
  return useCSSVariable('--color-accent') as string;
}

export function CoverCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 20, borderCurve: 'continuous', paddingHorizontal: 24, paddingTop: 32, paddingBottom: 36, alignItems: 'center' }}>
      {/* The logo is drawn for a white background in both themes. */}
      <View className="w-[180px] rounded-xl bg-white px-3 py-2" style={{ borderCurve: 'continuous' }}>
        <Image
          source={require('../../../assets/images/ipc_logo.png')}
          style={{ width: '100%', aspectRatio: 608 / 200 }}
          contentFit="contain"
          accessibilityLabel="International Palace Church"
        />
      </View>
      <Text accessibilityRole="header" className="mt-7 text-center text-[28px] font-extrabold leading-tight text-white">
        {title}
      </Text>
      <Text className="mt-2.5 text-center text-[15px] text-white/90">{subtitle}</Text>
    </LinearGradient>
  );
}

function Card({ heading, icon, blocks, onJump }: { heading?: string; icon?: IconName; blocks: Block[]; onJump: JumpHandler }) {
  const accent = useAccent();
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-surface" style={{ borderCurve: 'continuous' }}>
      {heading ? (
        <View className="flex-row items-center gap-2 bg-primary/10 px-3.5 py-2.5">
          {icon ? <Icon name={icon} size={18} color={accent} /> : null}
          <Text accessibilityRole="header" className="flex-1 text-[15px] font-bold text-accent">
            {heading}
          </Text>
        </View>
      ) : null}
      <View className="gap-2.5 p-3.5">
        {blocks.map((block, i) => (
          <BlockView key={i} block={block} first={i === 0} onJump={onJump} />
        ))}
      </View>
    </View>
  );
}

const MARKERS: Record<BulletStyle, (i: number) => string> = {
  number: (i) => `${i + 1}.`,
  dot: () => '•',
  hollow: () => '◦',
};

function Bullets({
  items,
  style = 'dot',
  spacious,
  indent,
}: {
  items: string[];
  style?: BulletStyle;
  spacious?: boolean;
  indent?: boolean;
}) {
  const { fontScale } = useWindowDimensions();
  // Wide enough for "12." so numbered items line up.
  const markerWidth = Math.round((style === 'number' ? 26 : 16) * fontScale);
  return (
    <View className={`${spacious ? 'gap-3.5' : 'gap-2'} ${indent ? 'pl-4' : ''}`}>
      {items.map((item, i) => (
        <View key={item} className="flex-row" accessible accessibilityLabel={style === 'number' ? `${i + 1}. ${item}` : item}>
          <Text
            className={`${BODY} ${style === 'number' ? 'font-bold text-accent' : 'text-primary'}`}
            style={{ width: markerWidth }}>
            {MARKERS[style](i)}
          </Text>
          <Text className={`flex-1 ${BODY}`}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function Highlight({ icon, text }: { icon: IconName; text: string }) {
  return (
    <LinearGradient
      colors={BRAND_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderRadius: 16, borderCurve: 'continuous', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Icon name={icon} size={24} color="#ffffff" />
      <Text className="flex-1 text-[15px] font-semibold leading-[21px] text-white">{text}</Text>
    </LinearGradient>
  );
}

function IconLines({ lines }: { lines: { icon: IconName; text: string }[] }) {
  const accent = useAccent();
  return (
    <View className="gap-3.5">
      {lines.map((line) => (
        <View key={line.text} className="flex-row items-center gap-3.5">
          <View className="size-11 items-center justify-center rounded-full bg-primary/10">
            <Icon name={line.icon} size={22} color={accent} />
          </View>
          <Text className="flex-1 text-base font-bold text-foreground">{line.text}</Text>
        </View>
      ))}
    </View>
  );
}

function Quote({ text, reference }: { text: string; reference: string }) {
  const accent = useAccent();
  return (
    <View className="gap-3.5">
      <Icon name={{ ios: 'quote.opening', android: 'format_quote' }} size={32} color={accent} />
      <Text className="text-base italic leading-[26px] text-foreground">{text}</Text>
      <Text className="self-end font-bold text-accent">{reference}</Text>
    </View>
  );
}

function Outline({ items, onJump }: { items: { label: string; slide: SlideId }[]; onJump: JumpHandler }) {
  const [accent, muted] = useCSSVariable(['--color-accent', '--color-muted']) as string[];
  return (
    <View>
      {items.map((item, i) => (
        <Pressable
          key={item.label}
          onPress={() => onJump(item.slide)}
          accessibilityRole="button"
          accessibilityLabel={`${i + 1}. ${item.label}`}
          accessibilityHint="Goes to this topic's slide"
          className="-mx-1.5 flex-row items-center gap-3 rounded-xl px-1.5 py-2 active:bg-background">
          <View className="size-7 items-center justify-center rounded-full bg-primary/10">
            <Text allowFontScaling={false} className="text-[13px] font-bold text-accent">
              {i + 1}
            </Text>
          </View>
          <Text className={`flex-1 ${BODY}`}>{item.label}</Text>
          <Icon name={{ ios: 'chevron.right', android: 'chevron_right' }} size={13} weight="semibold" color={muted ?? accent} />
        </Pressable>
      ))}
    </View>
  );
}

function DownArrow() {
  const muted = useCSSVariable('--color-muted') as string;
  return (
    <View className="py-1" importantForAccessibility="no" accessibilityElementsHidden>
      <Icon name={{ ios: 'arrow.down', android: 'arrow_downward' }} size={18} weight="semibold" color={muted} />
    </View>
  );
}

/** Top-down chart: one box per level joined by arrows, with optional groups side by side underneath. */
function Hierarchy({ levels, branches }: { levels: { icon: IconName; label: string }[]; branches?: string[] }) {
  const accent = useAccent();
  const description = [...levels.map((l) => l.label), ...(branches?.length ? [branches.join(', ')] : [])].join(', then ');
  return (
    <View className="items-center" accessible accessibilityLabel={`Chart, top to bottom: ${description}`}>
      {levels.map((level, i) => (
        <View key={level.label} className="items-center">
          {i > 0 ? <DownArrow /> : null}
          <View
            className="max-w-full flex-row items-center gap-2 rounded-xl border-[1.5px] border-primary bg-background px-3.5 py-2.5"
            style={{ borderCurve: 'continuous' }}>
            <Icon name={level.icon} size={19} color={accent} />
            <Text className="shrink text-center text-[15px] font-semibold text-foreground">{level.label}</Text>
          </View>
        </View>
      ))}
      {branches?.length ? (
        <>
          <DownArrow />
          <View className="flex-row flex-wrap justify-center gap-2">
            {branches.map((branch) => (
              <View
                key={branch}
                className="flex-row items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5">
                <Icon name={{ ios: 'person.3.fill', android: 'groups' }} size={15} color={accent} />
                <Text className="text-[15px] font-semibold text-accent">{branch}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function JumpButton({ label, icon, onPress }: { label: string; icon: IconName; onPress: () => void }) {
  const accent = useAccent();
  return (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      hitSlop={6}
      className="flex-row items-center gap-2 self-center rounded-full px-4 py-3 active:opacity-60">
      <Icon name={icon} size={18} color={accent} />
      <Text className="text-base font-semibold text-accent">{label}</Text>
    </Pressable>
  );
}

/** Draws one block of slide content. `first` drops the space above a subheading at the top of a card. */
export function BlockView({ block, first = false, onJump }: { block: Block; first?: boolean; onJump: JumpHandler }) {
  switch (block.kind) {
    case 'cover':
      return <CoverCard title={block.title} subtitle={block.subtitle} />;
    case 'hint':
      return <Text className="text-center text-[13px] text-muted">{block.text}</Text>;
    case 'card':
      return <Card heading={block.heading} icon={block.icon} blocks={block.blocks} onJump={onJump} />;
    case 'text':
      return (
        <Text className={`${BODY} ${block.weight === 'semibold' ? 'font-semibold' : block.weight === 'medium' ? 'font-medium' : ''}`}>
          {block.text}
        </Text>
      );
    case 'lead':
      return <Text className="text-[15px] font-bold leading-[22px] text-accent">{block.text}</Text>;
    case 'subheading':
      return (
        <Text accessibilityRole="header" className={`text-[15px] font-bold text-foreground ${first ? '' : 'pt-2'}`}>
          {block.text}
        </Text>
      );
    case 'bullets':
      return <Bullets items={block.items} style={block.style} spacious={block.spacious} indent={block.indent} />;
    case 'note':
      return <Text className="px-1 text-[13px] italic text-muted">{block.text}</Text>;
    case 'highlight':
      return <Highlight icon={block.icon} text={block.text} />;
    case 'icon-lines':
      return <IconLines lines={block.lines} />;
    case 'quote':
      return <Quote text={block.text} reference={block.reference} />;
    case 'outline':
      return <Outline items={block.items} onJump={onJump} />;
    case 'hierarchy':
      return <Hierarchy levels={block.levels} branches={block.branches} />;
    case 'jump':
      return <JumpButton label={block.label} icon={block.icon} onPress={() => onJump(block.slide)} />;
  }
}
