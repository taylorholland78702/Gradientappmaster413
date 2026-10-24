import { useEffect, type MutableRefObject } from 'react';

// Manual touch-drag scrolling for the mobile control drawer (a fallback for an iOS Safari native-gesture quirk). Moved out of InteractiveGradient unchanged.
export interface UseDrawerTouchScrollParams {
  activeTab: "color" | "gradients" | "effects" | "audio" | "presets";
  drawerRef: MutableRefObject<HTMLDivElement>;
  isMobile: boolean;
}

export function useDrawerTouchScroll(p: UseDrawerTouchScrollParams) {
  const { activeTab, drawerRef, isMobile } = p;
  // Manual touch-drag scroll for the mobile control panel — a fallback
  // that doesn't depend on native momentum-scroll/touch-action behavior at
  // all. Three rounds of CSS-only fixes (touchAction:'pan-y', separating
  // transform off the scrolling element, removing a poisoning
  // touchAction:'none' ancestor) all produced textbook-correct computed
  // styles yet still failed to scroll on a real device, which points at an
  // iOS Safari native-gesture quirk this couldn't pin down further without
  // device access. This bypasses that entirely: touchmove deltas are read
  // directly and applied to scrollTop by hand, so it can't be silently
  // eaten by whatever's blocking the native gesture.
  //
  // Disambiguates by gesture DIRECTION rather than fully excluding drags
  // that start on a range input — the first version excluded any touch
  // starting on input/select, which worked fine on the Gradients tab
  // (few, sparse sliders, easy to grab a gap) but effectively disabled
  // scrolling on Effects/Multi-FX, which is dense with range sliders, so
  // almost any drag started on or right next to one and fell through to
  // the (broken) native path. Now every touch is allowed to become a
  // scroll: once movement exceeds a small threshold, a mostly-vertical
  // drag scrolls the panel (even if it started on a slider — the user is
  // clearly trying to scroll, not drag it sideways), a mostly-horizontal
  // drag is left alone so the slider's own native dragging still works.
  useEffect(() => {
    if (!isMobile) return;
    const el = drawerRef.current;
    if (!el) return;
    const DIRECTION_THRESHOLD = 6; // px of movement before committing to scroll vs. slider-drag
    let startX = 0;
    let startY = 0;
    let startScrollTop = 0;
    let scrolling = false;
    const onTouchStart = (e: TouchEvent) => {
      scrolling = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startScrollTop = el.scrollTop;
    };
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (!scrolling) {
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (absDx < DIRECTION_THRESHOLD && absDy < DIRECTION_THRESHOLD) {
          return;
        }
        // Re-evaluated on every move rather than decided once and locked —
        // real touch gestures are noisy in the first few pixels (the
        // finger hasn't "settled" into a direction yet), so a one-shot
        // decision on an early ambiguous/diagonal wobble could permanently
        // misread a genuine vertical scroll as a horizontal slider-drag for
        // the rest of that gesture. Biased toward scroll (0.8 ratio, not
        // 1:1) since scrolling the panel is the much more common intent
        // here and a slightly-diagonal scroll swipe shouldn't get read as
        // "trying to drag the slider".
        if (absDy < absDx * 0.8) {
          return; // stays undecided — let native/slider handle this move, re-check next one
        }
        scrolling = true;
      }
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll <= 0) return;
      el.scrollTop = Math.max(0, Math.min(maxScroll, startScrollTop - dy));
      e.preventDefault();
    };
    const onTouchEnd = () => { scrolling = false; };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
    // activeTab included: the drawer only exists in the DOM while a tab is
    // open, so drawerRef.current is a different (or null) node each time
    // one opens/closes — this needs to re-run and re-attach listeners to
    // whatever the current node actually is, not just once per isMobile.
  }, [isMobile, activeTab]);
}
