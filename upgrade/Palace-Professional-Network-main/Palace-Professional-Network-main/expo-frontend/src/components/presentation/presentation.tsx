import { useRef, useState } from 'react';
import { View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useReducedMotion } from 'react-native-reanimated';

import { PresentationControls } from '@/components/presentation/presentation-controls';
import { PresentationHeader } from '@/components/presentation/presentation-header';
import { SlideListSheet } from '@/components/presentation/slide-list-sheet';
import { SlideView } from '@/components/presentation/slide-view';
import { slideIndex, SLIDES, type SlideId } from '@/lib/presentation';

/** Roughly how long the native sheet takes to slide away. */
const SHEET_DISMISS_MS = 450;

/** The slide last shown, so reopening the deck in the same session picks up there. */
let lastViewed = 0;

/**
 * The PPN Sunday presentation: swipe or use the arrows to move between
 * slides, or jump from the slide list. Each slide scrolls on its own so
 * nothing is cut off at large text sizes. With Reduce Motion, jumps don't
 * animate.
 */
export function Presentation() {
  const pager = useRef<PagerView>(null);
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(lastViewed);
  const [listOpen, setListOpen] = useState(false);
  const total = SLIDES.length;

  const goTo = (target: number) => {
    const next = Math.max(0, Math.min(total - 1, target));
    if (reduced) pager.current?.setPageWithoutAnimation(next);
    else pager.current?.setPage(next);
  };
  const jump = (id: SlideId) => goTo(slideIndex(id));

  return (
    <View className="flex-1 bg-background">
      <PresentationHeader index={index} total={total} onShowSlides={() => setListOpen(true)} />
      <PagerView
        ref={pager}
        style={{ flex: 1 }}
        initialPage={lastViewed}
        onPageSelected={(e) => {
          const position = e.nativeEvent.position;
          lastViewed = position;
          setIndex(position);
        }}>
        {SLIDES.map((slide) => (
          <View key={slide.id} collapsable={false} style={{ flex: 1 }}>
            <SlideView slide={slide} onJump={jump} />
          </View>
        ))}
      </PagerView>
      <PresentationControls
        index={index}
        total={total}
        title={SLIDES[index]!.title}
        onStep={(delta) => goTo(index + delta)}
        onShowSlides={() => setListOpen(true)}
      />
      <SlideListSheet
        isPresented={listOpen}
        current={index}
        onDismiss={() => setListOpen(false)}
        onSelect={(i) => {
          // Paging while the sheet is still closing sends the pager back
          // to where it was, so wait until it's off screen.
          setListOpen(false);
          setTimeout(() => goTo(i), SHEET_DISMISS_MS);
        }}
      />
    </View>
  );
}
