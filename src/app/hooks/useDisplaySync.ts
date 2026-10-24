import { useCallback, useEffect } from 'react';
import { IS_DISPLAY_MODE, IS_STANDALONE_DISPLAY, DISPLAY_SYNC_KEY, DISPLAY_ANIM_SYNC_KEY } from '../constants/displayMode';
import type { useMiscState } from './state/useMiscState';
import type { useHalftoneState } from './state/useHalftoneState';
import type { useReactionDiffusionGridState } from './state/useReactionDiffusionGridState';
import type { Snapshot } from './snapshotTypes';

type MiscState = ReturnType<typeof useMiscState>;

// Live-performance Display window: the controller broadcasts its snapshot and animation clocks, and a
// ?display=1 tab applies them.
export function useDisplaySync({
  applySnapshot, buildSnapshot, animValuesRef, gradientColorsRef, halftoneTimeRef, reactionDiffusionGridRef,
  lastBroadcastSnapshotRef, syncChannelRef, animSyncChannelRef, setIsDisplayLinkCopied,
}: {
  applySnapshot: (snapshot: Snapshot) => void;
  buildSnapshot: () => unknown;
  animValuesRef: MiscState['animValuesRef'];
  gradientColorsRef: MiscState['gradientColorsRef'];
  halftoneTimeRef: ReturnType<typeof useHalftoneState>['halftoneTimeRef'];
  reactionDiffusionGridRef: ReturnType<typeof useReactionDiffusionGridState>['reactionDiffusionGridRef'];
  lastBroadcastSnapshotRef: MiscState['lastBroadcastSnapshotRef'];
  syncChannelRef: MiscState['syncChannelRef'];
  animSyncChannelRef: MiscState['animSyncChannelRef'];
  setIsDisplayLinkCopied: MiscState['setIsDisplayLinkCopied'];
}) {
  // Display-window sync: the controller tab periodically diffs its own
  // buildSnapshot() and pushes changes out to any ?display=1 tab. Sent over
  // BOTH BroadcastChannel and localStorage — redundant on purpose. Neither
  // is bulletproof alone: BroadcastChannel can be isolated across a
  // window.open() popup/opener pair in some browsers (the reason we moved
  // off window.open entirely), while localStorage's 'storage' event has
  // been reported unreliable between fully independent top-level windows
  // (as opposed to tabs) in at least one real setup. Between two ordinary,
  // independently-opened tabs/windows of the same origin — which is what
  // the copy-link flow produces — BroadcastChannel is the more standard
  // mechanism, so it's primary; localStorage is the fallback. Polling
  // (rather than wiring into every setter) reuses the existing snapshot
  // machinery instead of duplicating its huge dependency surface a third
  // time.
  useEffect(() => {
    // Standalone playback has no controller to receive from, and must not
    // let a stale DISPLAY_SYNC_KEY value from some earlier, unrelated
    // controller session (or a real one that happens to be open in another
    // tab) stomp the preset this window was opened to play.
    if (!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) return;
    const applyRaw = (raw: string | null | undefined) => {
      if (!raw) return;
      try {
        applySnapshot(JSON.parse(raw));
      } catch {
        // Ignore a partial/corrupt write — the next tick will overwrite it.
      }
    };

    try { applyRaw(localStorage.getItem(DISPLAY_SYNC_KEY)); } catch { /* storage blocked: rely on BroadcastChannel */ }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === DISPLAY_SYNC_KEY) applyRaw(e.newValue);
    };
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(DISPLAY_SYNC_KEY);
      channel.onmessage = (e) => applyRaw(e.data);
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, [applySnapshot]);

  // Receive the anim-time fields (Display mode only) — written straight into
  // animValuesRef, the same ref draw() actually reads (see useCanvasDraw.ts),
  // instead of through their React state setters. This used to call a
  // setState per field per incoming message (~60/sec while the controller is
  // animating), forcing this whole component to re-render every single
  // message; a state→ref mirror effect further down used to be what
  // actually got those state updates into animValuesRef for rendering. Both
  // sides now write the ref directly — the controller's main loop writes it
  // every frame locally, this receiver writes it every message here — so
  // neither needs the state round-trip, and the mirror effect is gone.
  useEffect(() => {
    if (!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY || typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(DISPLAY_ANIM_SYNC_KEY);
    channel.onmessage = (e) => {
      const v = e.data;
      if (!v) return;
      const av = animValuesRef.current;
      if (typeof v.voronoiAnimTime === 'number') av.voronoiAnimTime = v.voronoiAnimTime;
      if (typeof v.flowerAnimTime === 'number') av.flowerAnimTime = v.flowerAnimTime;
      if (typeof v.tilingAnimTime === 'number') av.tilingAnimTime = v.tilingAnimTime;
      if (typeof v.auroraAnimTime === 'number') av.auroraAnimTime = v.auroraAnimTime;
      if (typeof v.turrellAnimTime === 'number') av.turrellAnimTime = v.turrellAnimTime;
      if (typeof v.causticsAnimTime === 'number') av.causticsAnimTime = v.causticsAnimTime;
      if (typeof v.lavaAnimTime === 'number') av.lavaAnimTime = v.lavaAnimTime;
      if (typeof v.marbleAnimTime === 'number') av.marbleAnimTime = v.marbleAnimTime;
      if (typeof v.fieldAnimTime === 'number') av.fieldAnimTime = v.fieldAnimTime;
      if (typeof v.metaballAnimTime === 'number') av.metaballAnimTime = v.metaballAnimTime;
      if (typeof v.flowAnimTime === 'number') av.flowAnimTime = v.flowAnimTime;
      if (typeof v.liquidAnimTime === 'number') av.liquidAnimTime = v.liquidAnimTime;
      if (typeof v.emojiAnimTime === 'number') av.emojiAnimTime = v.emojiAnimTime;
      if (typeof v.attractorAnimTime === 'number') av.attractorAnimTime = v.attractorAnimTime;
      if (typeof v.hatchAnimTime === 'number') av.hatchAnimTime = v.hatchAnimTime;
      if (typeof v.noiseAnimTime === 'number') av.noiseAnimTime = v.noiseAnimTime;
      if (typeof v.radialAnimTime === 'number') av.radialAnimTime = v.radialAnimTime;
      if (typeof v.waveInterferenceAnimTime === 'number') av.waveInterferenceAnimTime = v.waveInterferenceAnimTime;
      if (typeof v.meshWireframeAnimTime === 'number') av.meshWireframeAnimTime = v.meshWireframeAnimTime;
      if (typeof v.gridRotation === 'number') av.gridRotation = v.gridRotation;
      if (typeof v.radarSweepAngle === 'number') av.radarSweepAngle = v.radarSweepAngle;
      av.audioSubBassLevel = v.audioSubBassLevel ?? 0;
      av.audioMidsLevel = v.audioMidsLevel ?? 0;
      av.audioTrebleLevel = v.audioTrebleLevel ?? 0;
      av.audioEnergy = v.audioEnergy ?? 0;
      // Write the live, already-eased color straight into the ref the draw
      // loop actually reads (see gradientColorsRef above) — not through
      // setGradientColors/applySnapshot, which only update React state and
      // would leave this tab re-easing from its own stale ref position.
      if (v.gradientColors) gradientColorsRef.current = v.gradientColors;
      if (typeof v.halftoneTime === 'number') halftoneTimeRef.current = v.halftoneTime;
      // Same idea as gradientColorsRef above, but for Reaction-Diffusion's
      // whole simulation grid — overwrite the ref's `v` array directly
      // rather than restarting the sim locally, so Display renders the
      // controller's actual field instead of an independently-seeded one.
      // The step loop itself is skipped in Display mode (see the
      // IS_DISPLAY_MODE guard in drawReactionDiffusion.ts), so nothing
      // fights this update the way it would if Display kept stepping too.
      if (v.reactionDiffusionV) {
        if (!reactionDiffusionGridRef.current) {
          const RD_W = 220, RD_H = 140;
          const gridCanvas = document.createElement('canvas');
          gridCanvas.width = RD_W;
          gridCanvas.height = RD_H;
          reactionDiffusionGridRef.current = {
            u: new Float32Array(RD_W * RD_H).fill(1),
            v: v.reactionDiffusionV,
            u2: new Float32Array(RD_W * RD_H),
            v2: new Float32Array(RD_W * RD_H),
            canvas: gridCanvas,
            time: 0,
          };
        } else {
          reactionDiffusionGridRef.current.v = v.reactionDiffusionV;
        }
      }
    };
    return () => channel.close();
  }, []);

  // Broadcast the anim-time fields (controller only) on every
  // requestAnimationFrame tick rather than setInterval — rAF keeps running
  // for a visible-but-unfocused window in every major browser, unlike
  // setInterval, which is exactly the throttling that broke the main config
  // sync before it was switched to an event-driven broadcast. Was throttled
  // to every 3rd frame (~20fps) to keep messaging light, but that meant the
  // Display tab was always trailing by roughly that interval — a small,
  // constant, noticeable-in-a-live-performance-context lag. A same-origin
  // BroadcastChannel message is cheap enough to just send every frame.
  useEffect(() => {
    if (IS_DISPLAY_MODE || typeof BroadcastChannel === 'undefined') return;
    animSyncChannelRef.current = new BroadcastChannel(DISPLAY_ANIM_SYNC_KEY);
    let rafId: number;
    const tick = () => {
      animSyncChannelRef.current?.postMessage({
        ...animValuesRef.current,
        gradientColors: gradientColorsRef.current,
        halftoneTime: halftoneTimeRef.current,
        // Reaction-Diffusion's whole Gray-Scott field (not just a scalar
        // clock) — without this, Display seeds its own grid with
        // Math.random() on mount and runs an entirely independent
        // simulation from frame one, not just a phase-drifted one like the
        // other clocks here. Sending only `v` (what's actually rendered,
        // see getMappedColor(t = v[i] * 3, ...) in drawReactionDiffusion.ts)
        // keeps this to one Float32Array (~123KB) per frame instead of two.
        reactionDiffusionV: reactionDiffusionGridRef.current?.v,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      animSyncChannelRef.current?.close();
      animSyncChannelRef.current = null;
    };
  }, []);

  // Open the broadcast channel once for the controller's lifetime.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    syncChannelRef.current = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(DISPLAY_SYNC_KEY) : null;
    return () => { syncChannelRef.current?.close(); syncChannelRef.current = null; };
  }, []);

  // Broadcast immediately whenever buildSnapshot's identity changes (i.e.
  // on every real state change), rather than polling on a setInterval.
  // Chrome (and others) throttle setInterval/setTimeout in windows that
  // aren't OS-focused — even if fully visible on screen — which silently
  // stalled the old polling loop the moment the user's focus moved to the
  // newly-opened Display window. An effect fired off React's commit phase,
  // itself triggered synchronously by the user's click in the controller,
  // isn't subject to that same timer throttling.
  useEffect(() => {
    if (IS_DISPLAY_MODE) return;
    try {
      const snapshot = buildSnapshot();
      const serialized = JSON.stringify(snapshot);
      if (serialized === lastBroadcastSnapshotRef.current) return;
      lastBroadcastSnapshotRef.current = serialized;
      localStorage.setItem(DISPLAY_SYNC_KEY, serialized);
      syncChannelRef.current?.postMessage(serialized);
    } catch (err) {
      // A bad snapshot must not permanently break future broadcasts.
      console.error('wāv display sync failed:', err);
    }
  }, [buildSnapshot]);

  // Shift+P: copy the Display link — a second, always-fully-hidden-UI tab
  // that mirrors this one, for live/projector use. Deliberately does NOT
  // call window.open(): popup blockers treat keydown-triggered opens as
  // untrusted in several browsers (confirmed directly — even a real
  // keyboard-dispatched window.open() came back null), so the window would
  // silently fail to appear. Copying the link and letting the user open it
  // themselves (new tab, or drag to a second monitor) always works.
  const toggleDisplayWindow = useCallback(() => {
    if (IS_DISPLAY_MODE) return;
    const url = `${window.location.origin}${window.location.pathname}?display=1`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setIsDisplayLinkCopied(true);
    setTimeout(() => setIsDisplayLinkCopied(false), 2500);
  }, []);

  return { toggleDisplayWindow };
}
