import { useEffect, useState } from 'react';

// Height budget for the mobile drawer, from the visual viewport (the dvh unit goes stale on iOS Safari). Moved out of InteractiveGradient unchanged.
export interface UseMobilePanelHeightParams {
  isMobile: boolean;
}

export function useMobilePanelHeight(p: UseMobilePanelHeightParams) {
  const { isMobile } = p;
  // Real bug found via the (now-removed) debug overlay: the mobile panel's height
  // cap used CSS `70dvh`, but this app never triggers a native document
  // scroll (everything scrolls inside this one fixed internal panel), which
  // is normally what prompts Safari to recalculate dvh as its toolbar
  // shows/hides. With no such scroll ever happening, the toolbar can stay
  // expanded while dvh remains sized for the toolbar-collapsed state — so
  // the panel's own content genuinely fit within its own (too-generous)
  // height cap (scrollHeight === clientHeight, confirmed via the debug
  // overlay), while visually extending past the actually-visible screen.
  // There was nothing to scroll; the cap itself was just wrong.
  // window.visualViewport.height doesn't have this staleness problem — it
  // updates live as the toolbar shows/hides regardless of page scrolling —
  // so it drives the cap instead of the dvh unit.
  const [visualViewportHeight, setVisualViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? (window.visualViewport?.height ?? window.innerHeight) : 800
  );
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      setVisualViewportHeight(vv.height);
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    onResize();
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, [isMobile]);
  // The mobile drawer isn't scaled (unlike its desktop counterpart's
  // scale-[1.15]), so this targets the visible height directly with no
  // divisor. Dropped from 0.7 to 0.55 of visible height for a much bigger
  // safety margin — on-device testing kept showing content visually
  // crowding the bottom edge even when scrollHeight didn't (yet) exceed
  // clientHeight, so this trades some drawer size for headroom rather than
  // continuing to chase the exact pixel-perfect budget on a device this
  // can't directly inspect.
  const mobilePanelMaxHeight = Math.floor(visualViewportHeight * 0.55);
  return { mobilePanelMaxHeight };
}
