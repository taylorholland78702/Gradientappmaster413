import React, { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ColorTab, type ColorTabProps } from './ColorTab';
import { GradientsTab, type GradientsTabProps } from './GradientsTab';
import { EffectsTab, type EffectsTabProps } from './EffectsTab';
import type { PresetsPanelProps } from './PresetsPanel';
import type { AudioPanelState, AudioPanelActions } from './AudioPanel';
import { LearnProvider, useLearn, BAND_LABELS, BAND_COLORS } from './LearnContext';

const AudioPanel = lazy(() => import('./AudioPanel').then((m) => ({ default: m.AudioPanel })));
const PresetsPanel = lazy(() => import('./PresetsPanel').then((m) => ({ default: m.PresetsPanel })));

type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';

const TAB_LABELS: Record<TabId, string> = {
  gradients: 'Gradients',
  effects: 'Effects',
  audio: 'Audio',
  color: 'Color',
  presets: 'Presets',
};

// Desktop drawer content is rendered at its normal (mobile-matching) size,
// then scaled up 30% as a whole via CSS transform — same technique and
// reasoning as ControlRail's DESKTOP_RAIL_SCALE: the outer (ref/scroll)
// container gets an explicit width equal to the scaled footprint since a
// transform doesn't otherwise affect how much layout space a sibling
// (the canvas area) sees it take up.
const DESKTOP_DRAWER_SCALE = 1.3;
const DESKTOP_DRAWER_CONTENT_W = 248;
// Exported so other popouts (e.g. the Auto Shuffle popover in
// InteractiveGradient.tsx) can match this exact width instead of using
// their own guessed number.
export const DESKTOP_DRAWER_SCALED_W = Math.round(DESKTOP_DRAWER_CONTENT_W * DESKTOP_DRAWER_SCALE);

export interface ControlDrawerProps {
  activeTab: TabId | null;
  isMobile: boolean;
  // Visible-viewport-aware height budget for the mobile sheet — see its
  // computation in InteractiveGradient.tsx (mobilePanelMaxHeight) for why
  // this isn't just a CSS vh unit (a dvh-staleness bug on iOS Safari).
  mobileMaxHeight: number;
  // The union of every prop ColorTab/GradientsTab/EffectsTab/PresetsPanel need, passed through
  // unchanged from InteractiveGradient.tsx: each tab takes the names its own Props interface declares
  // and ignores the rest.
  tabProps: ColorTabProps & GradientsTabProps & EffectsTabProps & PresetsPanelProps;
  // AudioPanel takes pre-grouped state/actions objects rather than flat props.
  audioState: AudioPanelState;
  audioActions: AudioPanelActions;
}

// Shown under the title on every tab while a band is being learned: say what a tap will do, report what just
// happened, and offer a way out.
function LearnBanner() {
  const learn = useLearn();
  if (!learn?.band) return null;
  return (
    <div className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[10px] text-white" role="status" style={{ borderTop: `2px solid ${BAND_COLORS[learn.band]}` }}>
      <span className="min-w-0 truncate">{learn.notice ?? `Touch any slider to bind it to ${BAND_LABELS[learn.band]}`}</span>
      <button onClick={() => learn.setBand(null)} className="shrink-0 px-2 py-0.5 bg-white text-black font-bold">Done</button>
    </div>
  );
}

/**
 * The slide-out drawer replacing the old panel's tab content, which used to
 * render inline below the 3-row card and push it taller. A real docked
 * sidebar now (a flex sibling of the rail, both inside InteractiveGradient's
 * "dock" wrapper) rather than a floating overlay — opening it shrinks the
 * canvas area to share the frame instead of covering it, matching the
 * mockup's "Pinned" drawer behavior. Only closes via Escape (handled
 * globally, unchanged) or repressing its own tab's rail icon — no outside-
 * click dismiss and no close button.
 */
export const ControlDrawer = forwardRef<HTMLDivElement, ControlDrawerProps>(function ControlDrawer(
  { activeTab, isMobile, mobileMaxHeight, tabProps, audioState, audioActions },
  forwardedRef
) {
  const drawerRef = useRef<HTMLDivElement>(null);
  // The 1.3x scale below is a transform, which grows what you can scroll to but not
  // the wrapper's layout height — and the sticky title only stays pinned inside that
  // wrapper's layout box, so it let go partway down a long list. Adding the scaled
  // growth as bottom margin makes the wrapper as tall as it looks.
  const scaledRef = useRef<HTMLDivElement>(null);
  const [scaleGrowth, setScaleGrowth] = useState(0);
  useEffect(() => {
    const el = scaledRef.current;
    if (!el || isMobile || typeof ResizeObserver === 'undefined') { setScaleGrowth(0); return; }
    const ro = new ResizeObserver(() => setScaleGrowth(el.offsetHeight * (DESKTOP_DRAWER_SCALE - 1)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile, activeTab]);
  // Exposes the scrollable root so InteractiveGradient.tsx can attach its
  // existing manual touch-drag-scroll workaround (iOS Safari quirk — see
  // that effect's own comment) to whichever element actually scrolls now
  // that tab content lives here instead of inside the old shared panel.
  useImperativeHandle(forwardedRef, () => drawerRef.current as HTMLDivElement);

  // Reset scroll position on every tab switch — closing/switching a tab
  // shrinks the content height, but the browser doesn't reset scroll on its
  // own, which could otherwise leave a shorter tab's content scrolled past
  // its own end. Same fix the old single shared panel scroll container had.
  useEffect(() => {
    drawerRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  if (!activeTab) return null;

  // In-flow now (a flex child of the dock wrapper, next to the rail) rather
  // than a floating card positioned off the rail's measured rect. Corners
  // are only rounded on the edge that's actually exposed to the canvas —
  // the edge touching the rail stays square so the two read as one
  // continuous docked unit, not two stacked cards.
  return (
    <LearnProvider bindings={audioState.audioBindings} setBindings={audioActions.setAudioBindings}>
    <div
      ref={drawerRef}
      role="dialog"
      aria-label={`${TAB_LABELS[activeTab]} panel`}
      style={isMobile ? { maxHeight: mobileMaxHeight } : { width: DESKTOP_DRAWER_SCALED_W }}
      className={
        isMobile
          ? 'wav-mobile flex-shrink-0 w-full pointer-events-auto bg-wav-surface rounded-none overflow-y-auto overflow-x-hidden'
          : 'flex-shrink-0 h-full pointer-events-auto bg-wav-surface rounded-none overflow-y-auto overflow-x-hidden'
      }
    >
    {/* The title lives OUTSIDE the scaled wrapper: a sticky element inside a
        transformed one is positioned in unscaled coordinates, so it drifted off the
        top by 30% of however far you'd scrolled. Sized by hand to match what the
        scale would have made it. */}
    <div
      className="flex items-center justify-center sticky top-0 bg-wav-surface border-b border-wav-line-strong z-10"
      style={isMobile ? { padding: '6px 12px' } : { padding: `${6 * DESKTOP_DRAWER_SCALE}px ${12 * DESKTOP_DRAWER_SCALE}px` }}
    >
      <span className="text-white font-semibold" style={{ fontSize: isMobile ? 15 : 15 * DESKTOP_DRAWER_SCALE }}>{TAB_LABELS[activeTab]}</span>
    </div>
    <div className="sticky z-10 bg-wav-surface" style={{ top: isMobile ? 30 : 30 * DESKTOP_DRAWER_SCALE }}><LearnBanner /></div>
    {/* Desktop-only 1.3x scale wrapper — see DESKTOP_DRAWER_SCALE comment
        above. Mobile renders this content directly at natural size. */}
    <div
      ref={scaledRef}
      className={isMobile ? '' : 'origin-top-left'}
      style={!isMobile ? { transform: `scale(${DESKTOP_DRAWER_SCALE})`, width: DESKTOP_DRAWER_CONTENT_W, marginBottom: scaleGrowth } : undefined}
    >
      {/* No close button — repressing the tab's own rail icon (a toggle,
          see ControlRail's tab buttons) is the only way to close a drawer
          now, so there's nothing here needing its own dismiss control.
          Compact fixed padding now (was a much taller box sized to match
          the wordmark's 3-line stack height for vertical-center alignment
          — traded away in favor of a drastically tighter header). */}
      <div className="flex flex-col gap-[6px] px-1.5 pb-2">
        {activeTab === 'color' && <ColorTab {...tabProps} />}
        {activeTab === 'gradients' && <GradientsTab {...tabProps} />}
        {activeTab === 'effects' && <EffectsTab {...tabProps} />}
        {activeTab === 'audio' && (
          <Suspense fallback={null}>
            <AudioPanel state={audioState} actions={audioActions} />
          </Suspense>
        )}
        {activeTab === 'presets' && (
          <Suspense fallback={null}>
            <PresetsPanel {...tabProps} />
          </Suspense>
        )}
      </div>
    </div>
    </div>
    </LearnProvider>
  );
});