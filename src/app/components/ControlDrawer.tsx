import React, { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useRef } from 'react';
import { ColorTab } from './ColorTab';
import { GradientsTab } from './GradientsTab';
import { EffectsTab } from './EffectsTab';

const AudioPanel = lazy(() => import('./AudioPanel').then((m) => ({ default: m.AudioPanel })));
const PresetsPanel = lazy(() => import('./PresetsPanel').then((m) => ({ default: m.PresetsPanel })));

type TabId = 'gradients' | 'effects' | 'audio' | 'color' | 'presets';

const TAB_LABELS: Record<TabId, string> = {
  gradients: 'Gradient',
  effects: 'Effects',
  audio: 'Audio',
  color: 'Color',
  presets: 'Presets',
};

export interface ControlDrawerProps {
  activeTab: TabId | null;
  isMobile: boolean;
  // Visible-viewport-aware height budget for the mobile sheet — see its
  // computation in InteractiveGradient.tsx (mobilePanelMaxHeight) for why
  // this isn't just a CSS vh unit (a dvh-staleness bug on iOS Safari).
  mobileMaxHeight: number;
  // The union of every prop ColorTab/GradientsTab/EffectsTab/PresetsPanel
  // need, passed through unchanged from InteractiveGradient.tsx — each tab
  // only destructures the names its own Props interface declares, so extra
  // unrelated keys here are harmless (same loosely-typed blob convention
  // useSnapshot.ts/useRandomization.ts already use for this exact problem).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tabProps: Record<string, any>;
  // AudioPanel takes pre-grouped state/actions objects rather than flat
  // props, so those are built and passed separately.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  audioState: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  audioActions: Record<string, any>;
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
    <div
      ref={drawerRef}
      role="dialog"
      aria-label={`${TAB_LABELS[activeTab]} panel`}
      style={isMobile ? { maxHeight: mobileMaxHeight } : undefined}
      className={
        isMobile
          ? 'flex-shrink-0 w-full pointer-events-auto bg-black rounded-t-2xl overflow-y-auto overflow-x-hidden'
          : 'flex-shrink-0 h-full pointer-events-auto bg-black rounded-r-2xl overflow-y-auto overflow-x-hidden w-[248px]'
      }
    >
      {/* No close button — repressing the tab's own rail icon (a toggle,
          see ControlRail's tab buttons) is the only way to close a drawer
          now, so there's nothing here needing its own dismiss control. */}
      <div className="flex items-center px-3 py-2 sticky top-0 bg-black border-b border-white/10 z-10">
        <span className="text-white/90 text-xs font-semibold">{TAB_LABELS[activeTab]}</span>
      </div>

      <div className="flex flex-col gap-[6px] px-1.5 pb-2">
        {/* `as any` on every spread below: tabProps/audioState/audioActions
            are intentionally loosely typed (see the props comment above) —
            TS's excess/missing-property checking on a JSX spread applies
            even against a Record<string, any> source (unlike a plain
            function param destructure, which is how useSnapshot.ts/
            useRandomization.ts get away with the same loose blob), so this
            cast is what actually lets that convention work here. */}
        {activeTab === 'color' && <ColorTab {...(tabProps as any)} />}
        {activeTab === 'gradients' && <GradientsTab {...(tabProps as any)} />}
        {activeTab === 'effects' && <EffectsTab {...(tabProps as any)} />}
        {activeTab === 'audio' && (
          <Suspense fallback={null}>
            <AudioPanel state={audioState as any} actions={audioActions as any} />
          </Suspense>
        )}
        {activeTab === 'presets' && (
          <Suspense fallback={null}>
            <PresetsPanel {...(tabProps as any)} />
          </Suspense>
        )}
      </div>
    </div>
  );
});
