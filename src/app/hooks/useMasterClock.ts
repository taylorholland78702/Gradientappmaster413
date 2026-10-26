import { liveSpeed } from '../constants/liveSpeeds';
import { useEffect, type MutableRefObject, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE, IS_STANDALONE_DISPLAY } from '../constants/displayMode';
import type { ColorRGB, GradientType, EffectType } from '../constants/gradientEffects';

// The master animation clock: one requestAnimationFrame loop that advances rotation, zoom, color easing and every self-animating gradient's time. Moved out of InteractiveGradient unchanged.
export interface UseMasterClockParams {
  activeEffectsRef: MutableRefObject<EffectType[]>;
  analyzeAudioRef: MutableRefObject<() => void>;
  animValuesRef: MutableRefObject<{ voronoiAnimTime: number; flowerAnimTime: number; auroraAnimTime: number; turrellAnimTime: number; causticsAnimTime: number; lavaAnimTime: number; marbleAnimTime: number; metaballAnimTime: number; flowAnimTime: number; liquidAnimTime: number; emojiAnimTime: number; attractorAnimTime: number; tilingAnimTime: number; hatchAnimTime: number; noiseAnimTime: number; radialAnimTime: number; waveInterferenceAnimTime: number; meshWireframeAnimTime: number; fieldAnimTime: number; fieldSpeedLive: number; liveSpeeds: Record<string, number>; audioSubBassLevel: number; audioMidsLevel: number; audioTrebleLevel: number; audioEnergy: number; gridRotation: number; }>;
  audioMidsLevelRef: MutableRefObject<number>;
  audioSubBassLevelRef: MutableRefObject<number>;
  drawParamsDirtyRef: MutableRefObject<boolean>;
  drawRef: MutableRefObject<() => void>;
  gradientAngleRef: MutableRefObject<number>;
  gradientColorsRef: MutableRefObject<ColorRGB[]>;
  gradientTypeRef: MutableRefObject<GradientType>;
  gridRotationDirectionRef: MutableRefObject<"clockwise" | "none" | "counterclockwise">;
  halftoneMoveRef: MutableRefObject<boolean>;
  halftoneTimeRef: MutableRefObject<number>;
  isAudioActiveRef: MutableRefObject<boolean>;
  isAutoModeRef: MutableRefObject<boolean>;
  // A getter: the ref comes from useAutoShuffle, which is called later in the component.
  getIsAutoShuffleOn: () => boolean;
  isMicActiveRef: MutableRefObject<boolean>;
  isVCRPlayingRef: MutableRefObject<boolean>;
  lerpSyncFrameRef: MutableRefObject<number>;
  rotationDirectionRef: MutableRefObject<"clockwise" | "counter">;
  setFlowerAnimTime: (value: SetStateAction<number>) => void;
  setGradientAngle: (value: SetStateAction<number>) => void;
  setGradientColors: (value: SetStateAction<ColorRGB[]>) => void;
  setGridRotation: (value: SetStateAction<number>) => void;
  setMeshWireframeAnimTime: (value: SetStateAction<number>) => void;
  setTargetAngle: (value: SetStateAction<number>) => void;
  setTilingAnimTime: (value: SetStateAction<number>) => void;
  setVoronoiAnimTime: (value: SetStateAction<number>) => void;
  setWaveInterferenceAnimTime: (value: SetStateAction<number>) => void;
  setZoom: (value: SetStateAction<number>) => void;
  targetAngleRef: MutableRefObject<number>;
  targetColorsRef: MutableRefObject<ColorRGB[]>;
  targetZoomRef: MutableRefObject<number>;
  vcrPlaybackSpeedRef: MutableRefObject<number>;
  // The active gradient's own Speed slider (1 when it has none), kept current by InteractiveGradient.
  gradientSpeedRef: MutableRefObject<number>;
  windmillModeRef: MutableRefObject<"blades" | "helix">;
  zoomRef: MutableRefObject<number>;
}

const ROTATION_SPEED_TYPES: GradientType[] = ['stack', 'truchet', 'shapes', 'julia'];

export function useMasterClock(p: UseMasterClockParams) {
  const { activeEffectsRef, analyzeAudioRef, animValuesRef, audioMidsLevelRef, audioSubBassLevelRef, drawParamsDirtyRef, drawRef, gradientAngleRef, gradientColorsRef, gradientTypeRef, gridRotationDirectionRef, halftoneMoveRef, halftoneTimeRef, isAudioActiveRef, isAutoModeRef, getIsAutoShuffleOn, isMicActiveRef, isVCRPlayingRef, lerpSyncFrameRef, rotationDirectionRef, setFlowerAnimTime, setGradientAngle, setGradientColors, setGridRotation, setMeshWireframeAnimTime, setTargetAngle, setTilingAnimTime, setVoronoiAnimTime, setWaveInterferenceAnimTime, setZoom, targetAngleRef, targetColorsRef, targetZoomRef, vcrPlaybackSpeedRef, gradientSpeedRef, windmillModeRef, zoomRef } = p;
  useEffect(() => {
    let rafId: number;
    let lastFrameTime = performance.now();
    const loop = () => {
      const now = performance.now();
      // Every per-frame constant below (0.025, 0.1, 0.5, 2, 0.03125, etc.)
      // was originally tuned assuming a steady 60fps tick, so motion speed
      // silently varied with actual frame rate — faster on a 120Hz display,
      // slower under load. dtScale converts real elapsed time into "how
      // many 60fps-frame-equivalents this tick represents" so multiplying
      // any of those constants by it keeps speed constant regardless of
      // frame rate, while leaving every tuned value unchanged at a steady
      // 60fps (dtScale ≈ 1 there). Clamped to 3 so a long stall — tab
      // backgrounded, GC pause — doesn't cause a single catastrophic jump
      // when the loop resumes; it just catches up over a few frames instead.
      const dtScale = Math.min(3, Math.max(0, (now - lastFrameTime) / (1000 / 60)));
      lastFrameTime = now;

      // Drive the audio-analysis tick from this same loop instead of it
      // self-scheduling its own requestAnimationFrame (see analyzeAudioRef's
      // declaration in useAudioReactivity.ts) — one rAF registration and one
      // clock for both draw and analysis instead of two independently-timed
      // ones. Called first so any freshly-analyzed levels this tick (bass,
      // mids, treble, zoom pulses, etc.) are available to the draw-related
      // logic below in the same frame rather than lagging by one.
      analyzeAudioRef.current?.();

      const spd = vcrPlaybackSpeedRef.current;
      // The active gradient's Speed as last drawn (slider plus any audio binding), else the saved slider.
      const activeGradientSpeed = () => liveSpeed(animValuesRef.current.liveSpeeds, `${gradientTypeRef.current}Speed`, gradientSpeedRef.current);

      // Lerp colors directly in ref, track max channel diff for convergence check.
      // Skipped in Display mode — that ref is instead written directly from the
      // controller's live value every frame (see the anim-sync receiver below),
      // since this ~2-second ease was previously always restarting from the
      // Display tab's own stale ref position instead of tracking the
      // controller's actual current color.
      const colors = gradientColorsRef.current;
      const targets = targetColorsRef.current;
      let maxColorDiff = 0;
      // Longer, more overlapping cross-fade while auto-shuffle is running —
      // see isAutoShuffleOnRef above.
      const fadeMultiplier = getIsAutoShuffleOn() ? 0.25 : 1;
      if (!IS_DISPLAY_MODE) {
        // Clamped to 1 — a lerp rate above 1 overshoots past the target
        // instead of easing toward it, which dtScale could otherwise
        // produce during a low-frame-rate stretch (dtScale > 1).
        const colorSpd = Math.min(1, 0.025 * spd * fadeMultiplier * dtScale);
        for (let i = 0; i < colors.length; i++) {
          const c = colors[i];
          const t = targets[i];
          if (!c || !t) continue;
          const nr = c.r + (t.r - c.r) * colorSpd;
          const ng = c.g + (t.g - c.g) * colorSpd;
          const nb = c.b + (t.b - c.b) * colorSpd;
          colors[i] = (isNaN(nr) || isNaN(ng) || isNaN(nb)) ? t : { r: nr, g: ng, b: nb };
          maxColorDiff = Math.max(maxColorDiff, Math.abs(t.r - nr), Math.abs(t.g - ng), Math.abs(t.b - nb));
        }
      }

      const angleDiff = Math.abs(targetAngleRef.current - gradientAngleRef.current);
      const angleSpd = Math.min(1, 0.1 * spd * fadeMultiplier * dtScale);
      gradientAngleRef.current += (targetAngleRef.current - gradientAngleRef.current) * angleSpd;

      const zoomSpd = Math.min(1, (isAutoModeRef.current ? 0.1 : 0.3) * spd * fadeMultiplier * dtScale);
      const zoomDiff = Math.abs(targetZoomRef.current - zoomRef.current);
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * zoomSpd;

      // Skip draw when idle: nothing is actively animating and all values have settled.
      // Reaction-Diffusion/Fireworks/Lightning are standing exceptions — each is a live
      // simulation that keeps evolving on its own (feed/kill drift and perpetual
      // sprinkling for Reaction-Diffusion; spawning/aging particles or bolts into a
      // persistent fading buffer for the other two) rather than easing toward a fixed
      // target, so without this they'd only ever get the handful of draw calls needed
      // for colors/angle/zoom to converge and then freeze solid — the sim being alive
      // under the hood is meaningless if this loop stops calling draw() at all.
      const isAnimating = isAutoModeRef.current || isVCRPlayingRef.current || isAudioActiveRef.current
        || gradientTypeRef.current === 'reaction-diffusion' || gradientTypeRef.current === 'fireworks' || gradientTypeRef.current === 'lightning';
      const hasConverged = maxColorDiff < 0.5 && angleDiff < 0.05 && zoomDiff < 0.001;

      if (isAnimating || !hasConverged || drawParamsDirtyRef.current) {
        // A throw here (e.g. from a malformed preset value) must not kill the
        // rest of this function — requestAnimationFrame(loop) below is what
        // keeps the animation alive, and an uncaught exception would skip it,
        // permanently freezing the canvas until a full page reload.
        try {
          drawRef.current();
        } catch (err) {
          console.error('Draw failed, will retry next frame:', err);
        }
        if (hasConverged && !isAnimating) drawParamsDirtyRef.current = false;
      }

      // Sync back to state every 15 frames (~4fps) for undo snapshots.
      // The canvas itself reads live values straight from refs (see drawRef), so this
      // sync is only for keeping React state fresh for buildSnapshot/undo — it does not
      // need to run at animation framerate, and doing so was forcing a full re-render of
      // the entire panel tree ~20x/sec during any animation, causing jank on lower-end GPUs.
      lerpSyncFrameRef.current++;
      if (lerpSyncFrameRef.current % 15 === 0) {
        setGradientColors([...gradientColorsRef.current]);
        setGradientAngle(gradientAngleRef.current);
        setZoom(zoomRef.current);
        // targetAngle/gridRotation/voronoiAnimTime/
        // flowerAnimTime/tilingAnimTime: same batched sync, now that the
        // blocks below write these into their refs directly every frame
        // instead of calling setState. One frame of staleness here (these
        // refs update later in this same loop iteration) is negligible at
        // 15-frame granularity.
        setTargetAngle(targetAngleRef.current);
        setGridRotation(animValuesRef.current.gridRotation);
        setVoronoiAnimTime(animValuesRef.current.voronoiAnimTime);
        setFlowerAnimTime(animValuesRef.current.flowerAnimTime);
        setTilingAnimTime(animValuesRef.current.tilingAnimTime);
        setWaveInterferenceAnimTime(animValuesRef.current.waveInterferenceAnimTime);
        setMeshWireframeAnimTime(animValuesRef.current.meshWireframeAnimTime);
      }

      // Halftone Move animation. The trigger still fires on both windows (it's
      // just a redraw nudge), but the actual halftoneTimeRef VALUE is only
      // ever advanced on the controller — Display's copy is overwritten by
      // the anim-sync receiver below instead, so both windows show the same
      // dot phase instead of two independently-advancing clocks.
      if (activeEffectsRef.current.includes('halftone') && halftoneMoveRef.current) {
        if (!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) halftoneTimeRef.current += 0.5 * spd * dtScale * liveSpeed(animValuesRef.current.liveSpeeds, 'halftoneMoveSpeed', 1);
        // Was setHalftoneAnimTrigger(prev => prev + 1) — a setState-every-
        // frame redraw nudge. drawParamsDirtyRef is the same nudge without
        // the re-render cost; the main loop already checks it below.
        drawParamsDirtyRef.current = true;
      }

      // Grid rotation animation. Skipped in Display mode; see the Voronoi
      // comment above — that value is pushed from the controller instead.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && activeEffectsRef.current.includes('grid-effect') && gridRotationDirectionRef.current !== 'none') {
        const increment = (gridRotationDirectionRef.current === 'clockwise' ? 2 : -2) * dtScale * liveSpeed(animValuesRef.current.liveSpeeds, 'gridEffectSpeed', 1);
        animValuesRef.current.gridRotation = (animValuesRef.current.gridRotation + increment) % 360;
      }

      // Slit-scan animation — no real per-frame value to advance (the
      // actual frame buffer lives in slitScanBufferRef), this was purely a
      // redraw nudge. drawParamsDirtyRef is the same nudge without the
      // setState-every-frame cost — the main loop already checks it below.
      if (activeEffectsRef.current.includes('slit-scan')) {
        drawParamsDirtyRef.current = true;
      }

      const isPlayActive = isAutoModeRef.current || isVCRPlayingRef.current || isMicActiveRef.current;

      // Voronoi morphing — PLAY or mic active. Skipped in Display mode:
      // that clock is pushed from the controller instead, so both windows
      // stay frame-locked rather than drifting apart over time.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'voronoi' && isPlayActive) {
        animValuesRef.current.voronoiAnimTime += 0.01 * (isAutoModeRef.current || isVCRPlayingRef.current ? spd : 1) * activeGradientSpeed() * dtScale;
      }

      // Auto-rotate the gradient angle — PLAY active. Ticks every frame (like the radar
      // sweep below) instead of jumping once per 800ms: a big jump followed by the lerp
      // catching up in ~100ms meant the gradient sat still for most of every 800ms window,
      // which reads as stepped/incremental motion no matter how fast the draw call is.
      // Skipped in Display mode; see the Voronoi comment above — targetAngle is pushed
      // from the controller instead, so both windows converge on the same rotation
      // instead of each advancing their own independently and drifting apart (this was
      // the actual cause of the Display tab's angle/pattern slowly falling out of sync).
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && isAutoModeRef.current) {
        let rotationAmountPerFrame;
        rotationAmountPerFrame = rotationDirectionRef.current === 'clockwise' ? 0.03125 : -0.03125;
        // audioMidsLevel's natural range depends on the Mids multiplier
        // slider (0-5) and master sensitivity, not a fixed 0-1 — clamping
        // to 1 here keeps the speed boost within its documented "up to 3x"
        // intent regardless of how those are set, instead of autonomous
        // rotation occasionally spinning up to 20x+ on loud mids content.
        // Was up to 5x — loud mids-heavy passages spun the gradient hard
        // enough to feel out of control rather than reactive, so this is
        // capped lower.
        const midsBoost = isAudioActiveRef.current ? 1 + Math.min(1, audioMidsLevelRef.current) * 2 : 1;
        // These types rotate at 2x across every speed step. (Noise and Radial are
        // intentionally excluded — neither uses the rotation angle at all, so there's
        // no existing motion for them to speed up; see conversation for details.)
        const doubleSpeedTypes = ['angle', 'fade', 'radial-burst'];
        const isWindmillHelixMode = gradientTypeRef.current === 'windmill' && windmillModeRef.current === 'helix';
        const angleSpeedBoost = (doubleSpeedTypes.includes(gradientTypeRef.current) || isWindmillHelixMode) ? 2 : 1;
        // Stack, Truchet, Shapes and Julia move only by this rotation, so their Speed slider scales it.
        const rotateSpeed = ROTATION_SPEED_TYPES.includes(gradientTypeRef.current) ? activeGradientSpeed() : 1;
        targetAngleRef.current += rotationAmountPerFrame * spd * angleSpeedBoost * midsBoost * rotateSpeed * dtScale;
      }

      // Flower rotation — only when PLAY is active. Skipped in Display
      // mode; see the Voronoi comment above.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'flower' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        animValuesRef.current.flowerAnimTime += 0.5 * spd * activeGradientSpeed() * dtScale;
      }

      // Tiling rotation — only while the playhead is engaged (PLAY or
      // Auto mode), same gating as Flower above. Adds on top of the
      // static tilingRotation slider rather than replacing it.
      if ((!IS_DISPLAY_MODE || IS_STANDALONE_DISPLAY) && gradientTypeRef.current === 'tiling' && (isAutoModeRef.current || isVCRPlayingRef.current)) {
        animValuesRef.current.tilingAnimTime += 0.3 * spd * dtScale;
      }

      rafId = requestAnimationFrame(loop);
    };
    // Explicitly stop scheduling new frames while the tab is backgrounded
    // instead of just leaving it to the browser's own rAF throttling —
    // that throttling still burns some CPU/battery on a hidden tab (and
    // varies by browser), whereas cancelling here stops it completely.
    // lastFrameTime is reset on resume so dtScale doesn't have to eat a
    // multi-second gap on the very next frame — it's already clamped to 3
    // so this isn't required for correctness, just avoids the pointless
    // computation.
    let isPaused = false;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(rafId);
      } else if (isPaused) {
        isPaused = false;
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    rafId = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Generate random color (memoized as it doesn't depend on state). Uses
  // HSL with a floor on saturation/lightness rather than uniform RGB —
  // uniform RGB has a real chance of landing near-black (or near-white/
  // muddy-gray), which is invisible for solid-fill types like Shapes and
  // Polar Grid (flat rgb() fills straight onto a #000 background, no
  // gradient blending to soften a dark hit) and reads as a near-black
  // shuffle result.
}
