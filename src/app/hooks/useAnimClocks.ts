import { liveSpeed } from '../constants/liveSpeeds';
import { useEffect, type MutableRefObject, type SetStateAction } from 'react';
import { IS_DISPLAY_MODE } from '../constants/displayMode';
import { IS_STANDALONE_DISPLAY } from '../constants/displayMode';
import { STYLE_FIELD_GRADIENT_TYPES } from '../constants/gradientEffects';
import type { EffectType, GradientType } from '../constants/gradientEffects';

// The per-gradient animation clocks (one interval each) and the mirror that copies their values into animValuesRef for the render loop. Moved out of InteractiveGradient unchanged.
export interface UseAnimClocksParams {
  activeEffects: EffectType[];
  animValuesRef: MutableRefObject<{ voronoiAnimTime: number; flowerAnimTime: number; auroraAnimTime: number; turrellAnimTime: number; causticsAnimTime: number; lavaAnimTime: number; marbleAnimTime: number; metaballAnimTime: number; flowAnimTime: number; liquidAnimTime: number; emojiAnimTime: number; attractorAnimTime: number; tilingAnimTime: number; hatchAnimTime: number; noiseAnimTime: number; radialAnimTime: number; waveInterferenceAnimTime: number; meshWireframeAnimTime: number; fieldAnimTime: number; fieldSpeedLive: number; liveSpeeds: Record<string, number>; audioSubBassLevel: number; audioMidsLevel: number; audioTrebleLevel: number; audioEnergy: number; gridRotation: number; }>;
  attractorAnimTime: number;
  attractorSpeed: number;
  audioEnergy: number;
  audioMidsLevel: number;
  audioSubBassLevel: number;
  audioTrebleLevel: number;
  auroraAnimTime: number;
  causticsAnimTime: number;
  emojiAnimTime: number;
  emojiRotateSpeed: number;
  flowAnimTime: number;
  flowSpeed: number;
  gradientType: GradientType;
  gradientTypeRef: MutableRefObject<GradientType>;
  hatchAnimTime: number;
  hatchSpeed: number;
  isAutoMode: boolean;
  isAutoModeRef: MutableRefObject<boolean>;
  isMicActive: boolean;
  isMicActiveRef: MutableRefObject<boolean>;
  isVCRPlaying: boolean;
  isVCRPlayingRef: MutableRefObject<boolean>;
  lavaAnimTime: number;
  liquidAnimTime: number;
  marbleAnimTime: number;
  metaballAnimTime: number;
  metaballSpeed: number;
  noiseAnimTime: number;
  noiseSpeed: number;
  causticsSpeed: number;
  marbleSpeed: number;
  particlesMode: "drift" | "flow-field" | "marks";
  radialAnimTime: number;
  radialSpeed: number;
  setAttractorAnimTime: (value: SetStateAction<number>) => void;
  setCausticsAnimTime: (value: SetStateAction<number>) => void;
  setEmojiAnimTime: (value: SetStateAction<number>) => void;
  setFlowAnimTime: (value: SetStateAction<number>) => void;
  setHatchAnimTime: (value: SetStateAction<number>) => void;
  setLavaAnimTime: (value: SetStateAction<number>) => void;
  setLiquidAnimTime: (value: SetStateAction<number>) => void;
  setMarbleAnimTime: (value: SetStateAction<number>) => void;
  setMetaballAnimTime: (value: SetStateAction<number>) => void;
  setNoiseAnimTime: (value: SetStateAction<number>) => void;
  setRadialAnimTime: (value: SetStateAction<number>) => void;
  turrellAnimTime: number;
  vcrPlaybackSpeed: number;
  vcrPlaybackSpeedRef: MutableRefObject<number>;
}

export function useAnimClocks(p: UseAnimClocksParams) {
  const { activeEffects, animValuesRef, causticsSpeed, marbleSpeed, attractorAnimTime, attractorSpeed, audioEnergy, audioMidsLevel, audioSubBassLevel, audioTrebleLevel, auroraAnimTime, causticsAnimTime, emojiAnimTime, emojiRotateSpeed, flowAnimTime, flowSpeed, gradientType, gradientTypeRef, hatchAnimTime, hatchSpeed, isAutoMode, isAutoModeRef, isMicActive, isMicActiveRef, isVCRPlaying, isVCRPlayingRef, lavaAnimTime, liquidAnimTime, marbleAnimTime, metaballAnimTime, metaballSpeed, noiseAnimTime, noiseSpeed, particlesMode, radialAnimTime, radialSpeed, setAttractorAnimTime, setCausticsAnimTime, setEmojiAnimTime, setFlowAnimTime, setHatchAnimTime, setLavaAnimTime, setLiquidAnimTime, setMarbleAnimTime, setMetaballAnimTime, setNoiseAnimTime, setRadialAnimTime, turrellAnimTime, vcrPlaybackSpeed, vcrPlaybackSpeedRef } = p;
  // Effects that animate inside the draw call (Aura Glow, Kaleido) have no clock of their own; publish the shared Speed for them.
  useEffect(() => { animValuesRef.current.liveSpeeds.playbackSpeed = vcrPlaybackSpeed; }, [animValuesRef, vcrPlaybackSpeed]);
  // Each of these local clocks is skipped entirely in Display mode — that
  // tab's copies are pushed from the controller instead (see the animation
  // sync effect below), so the two windows stay frame-locked instead of
  // drifting apart.


  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'hatch' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setHatchAnimTime(t => t + 0.05 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'hatchSpeed', hatchSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, hatchSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'noise' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setNoiseAnimTime(t => t + 0.01 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'noiseSpeed', noiseSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, noiseSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'radial' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setRadialAnimTime(t => t + 0.006 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'radialSpeed', radialSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, radialSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'caustics' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setCausticsAnimTime(t => t + 0.02 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'causticsSpeed', causticsSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, causticsSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'lava-lamp' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setLavaAnimTime(t => t + 0.008 * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  // Shared clock for the styled-field gradients (drawStyleFieldGL.ts). Gated exactly
  // like the older gradients' clocks above — it only advances while auto mode, VCR
  // playback or the mic is on, so pausing freezes these too (and editing a slider
  // while paused no longer makes the pattern jump) — and scaled by the playback speed
  // and the Speed the last frame drew with. Lives in the anim-values ref rather than
  // state, like gridRotation: advancing it must not re-render the panel tree 60x/sec.
  // Real elapsed time (not a fixed per-tick step) so a throttled timer can't slow it.
  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!STYLE_FIELD_GRADIENT_TYPES.includes(gradientTypeRef.current as GradientType)) return;
      if (!isAutoModeRef.current && !isVCRPlayingRef.current && !isMicActiveRef.current) return;
      const av = animValuesRef.current;
      av.fieldAnimTime += dt * vcrPlaybackSpeedRef.current * av.fieldSpeedLive;
    }, 16);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'marble' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMarbleAnimTime(t => t + 0.02 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'marbleSpeed', marbleSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, marbleSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'metaballs' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setMetaballAnimTime(t => t + 0.02 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'metaballSpeed', metaballSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, metaballSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'particles' || particlesMode !== 'flow-field' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setFlowAnimTime(t => t + 0.02 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'flowSpeed', flowSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, particlesMode, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, flowSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (gradientType !== 'attractor' || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setAttractorAnimTime(t => t + 0.01 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'attractorSpeed', attractorSpeed)), 16);
    return () => clearInterval(id);
  }, [gradientType, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, attractorSpeed]);

  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (!activeEffects.includes('liquid') || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setLiquidAnimTime(t => t + 0.02 * vcrPlaybackSpeed * liveSpeed(animValuesRef.current.liveSpeeds, 'liquidSpeed', 1)), 16);
    return () => clearInterval(id);
  }, [activeEffects, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive]);

  // Emoji cells only spin while Play is active — frozen in place otherwise
  useEffect(() => {
    if (IS_DISPLAY_MODE && !IS_STANDALONE_DISPLAY) return;
    if (!activeEffects.includes('emoji') || (!isAutoMode && !isVCRPlaying && !isMicActive)) return;
    const id = setInterval(() => setEmojiAnimTime(t => t + (liveSpeed(animValuesRef.current.liveSpeeds, 'emojiRotateSpeed', emojiRotateSpeed) / 60) * vcrPlaybackSpeed), 16);
    return () => clearInterval(id);
  }, [activeEffects, vcrPlaybackSpeed, isAutoMode, isVCRPlaying, isMicActive, emojiRotateSpeed]);

  // Keep a ref mirror of the anim-time fields so the rAF broadcast loop
  // below can read fresh values every frame without itself needing to be
  // torn down and recreated on every tick (which a dependency array would
  // force, since these change ~60x/sec while playing).
  //
  // voronoiAnimTime/flowerAnimTime/tilingAnimTime are intentionally NOT
  // included here anymore — the main loop now writes those directly into
  // animValuesRef every frame (see the loop below), so mirroring them from
  // state here as well would race with that direct write and periodically
  // stomp the fresh ref value with a stale state-derived one. The other
  // clocks below still only exist as state (each driven by its own
  // setInterval elsewhere), so they still need this mirror to reach
  // animValuesRef at all.
  useEffect(() => {
    const av = animValuesRef.current;
    av.auroraAnimTime = auroraAnimTime;
    av.turrellAnimTime = turrellAnimTime;
    av.causticsAnimTime = causticsAnimTime;
    av.lavaAnimTime = lavaAnimTime;
    av.marbleAnimTime = marbleAnimTime;
    av.metaballAnimTime = metaballAnimTime;
    av.flowAnimTime = flowAnimTime;
    av.liquidAnimTime = liquidAnimTime;
    av.emojiAnimTime = emojiAnimTime;
    av.attractorAnimTime = attractorAnimTime;
    av.hatchAnimTime = hatchAnimTime;
    av.noiseAnimTime = noiseAnimTime;
    av.radialAnimTime = radialAnimTime;
    av.audioSubBassLevel = audioSubBassLevel;
    av.audioMidsLevel = audioMidsLevel;
    av.audioTrebleLevel = audioTrebleLevel;
    av.audioEnergy = audioEnergy;
  }, [auroraAnimTime, turrellAnimTime, causticsAnimTime, lavaAnimTime, marbleAnimTime, metaballAnimTime, flowAnimTime, liquidAnimTime, emojiAnimTime, attractorAnimTime, hatchAnimTime, noiseAnimTime, radialAnimTime, audioSubBassLevel, audioMidsLevel, audioTrebleLevel, audioEnergy]);
}
