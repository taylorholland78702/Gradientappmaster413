import { useEffect, useRef, useState, type MutableRefObject, type SetStateAction } from 'react';

type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';

// Where the rail's popouts (Auto Shuffle, Save & share) and the About panel open, and when they close. Moved out of InteractiveGradient unchanged.
export interface UsePopoutAnchorParams {
  panelRef: MutableRefObject<HTMLElement>;
  isMobile: boolean;
  activeTab: TabId | null;
  setActiveTab: (value: SetStateAction<TabId | null>) => void;
  setIsAboutOpen: (value: SetStateAction<boolean>) => void;
}

export function usePopoutAnchor(p: UsePopoutAnchorParams) {
  const { panelRef, isMobile, activeTab, setActiveTab, setIsAboutOpen } = p;
  // Which popout the shared anchor below is showing.
  const [popoverMode, setPopoverMode] = useState<'autoShuffle' | 'export'>('autoShuffle');
  const [autoShufflePopoverAnchor, setAutoShufflePopoverAnchor] = useState<{ top?: number; bottom?: number; left: number; width: number; height?: number } | null>(null);
  const autoShufflePopoverRef = useRef<HTMLDivElement>(null);
  // The button that opened the popover — excluded from the outside-click
  // dismiss check below (see that handler for why).
  const autoShuffleTriggerElRef = useRef<HTMLElement | null>(null);
  // Anchored to the rail's own rect (like the drawer/About panel) rather
  // than the trigger button — desktop opens it flush to the right of the
  // panel (matching the drawer's own width, not a separate guessed one),
  // mobile opens it flush above the (bottom-docked) panel at full width
  // (matching the mobile drawer), instead of floating just below whichever
  // button was clicked.
  const openAutoShufflePopover = (triggerEl?: HTMLElement | null, mode: 'autoShuffle' | 'export' = 'autoShuffle') => {
    // Pressing the button of the popout that's already open closes it (the other
    // button's popout swaps in instead of just closing).
    if (autoShufflePopoverAnchor && popoverMode === mode) { setAutoShufflePopoverAnchor(null); return; }
    setPopoverMode(mode);
    // Its own popout now — opening it closes whatever tab drawer/About
    // panel happened to be open instead of stacking on top of it.
    setActiveTab(null);
    setIsAboutOpen(false);
    autoShuffleTriggerElRef.current = triggerEl ?? null;
    const railEl = panelRef.current;
    const rect = railEl ? railEl.getBoundingClientRect() : { top: 16, left: 16, right: 60, bottom: 60, width: 240 } as DOMRect;
    if (isMobile) {
      setAutoShufflePopoverAnchor({ bottom: window.innerHeight - rect.top, left: 0, width: window.innerWidth });
    } else {
      // Unlike the tab drawer/About panel, this one pops out level with the
      // button that opened it rather than flush to the top of the rail —
      // fall back to the rail's own top if it was opened without a trigger
      // element (e.g. a future keyboard shortcut).
      // Much narrower than the tab drawer it pops out next to — its only
      // content is a toggle and one interval slider, not a full panel's
      // worth of controls, so there's no reason to match the drawer's width.
      const triggerRect = triggerEl ? triggerEl.getBoundingClientRect() : rect;
      // The export popout is tall and its button sits near the bottom of the rail, so
      // it grows upward from the button's bottom edge instead of downward off-screen.
      if (mode === 'export') setAutoShufflePopoverAnchor({ bottom: Math.max(8, window.innerHeight - triggerRect.bottom), left: rect.right, width: 240 });
      else setAutoShufflePopoverAnchor({ top: triggerRect.top, left: rect.right, width: 240 });
    }
  };
  const openExportPopover = (triggerEl?: HTMLElement | null) => {
    openAutoShufflePopover(triggerEl, 'export');
  };
  // Same "own popout" treatment as Auto Shuffle above — opening About
  // closes whatever tab drawer/Auto Shuffle popover happened to be open
  // instead of stacking on top of it.
  const openAboutPanel = () => {
    setActiveTab(null);
    setAutoShufflePopoverAnchor(null);
    setIsAboutOpen(true);
  };
  // The reverse direction of the "own popout" rule above — opening a tab
  // drawer (Gradient/Effects/Audio/Color/Presets) closes Auto Shuffle/
  // About too, so only one popout is ever showing at a time regardless of
  // which one was opened last.
  useEffect(() => {
    if (activeTab) {
      setAutoShufflePopoverAnchor(null);
      setIsAboutOpen(false);
    }
  }, [activeTab]);
  useEffect(() => {
    if (!autoShufflePopoverAnchor) return;
    const handleClick = (e: MouseEvent) => {
      // Excluding the trigger button itself, not just the popover, matters
      // because this listens on 'mousedown' (so it can close before an
      // outside click's own action fires) while the trigger's onClick
      // re-opens the popover on 'click' — mousedown fires first. Without
      // this exclusion, clicking the trigger again while open would close it
      // here on mousedown, then immediately reopen it when the same click's
      // onClick handler ran, making the button look like it never closes.
      const target = e.target as Node;
      if (autoShufflePopoverRef.current && !autoShufflePopoverRef.current.contains(target)
        && !(autoShuffleTriggerElRef.current && autoShuffleTriggerElRef.current.contains(target))) {
        setAutoShufflePopoverAnchor(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [autoShufflePopoverAnchor]);
  return { popoverMode, autoShufflePopoverAnchor, setAutoShufflePopoverAnchor, autoShufflePopoverRef, openAutoShufflePopover, openExportPopover, openAboutPanel };
}
