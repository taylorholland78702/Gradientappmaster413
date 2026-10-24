import { useEffect, type MutableRefObject, type SetStateAction } from 'react';
import type { ColorRGB, GradientType } from '../constants/gradientEffects';

// Copies state into refs so the animation loop and draw code can read the latest values without restarting. Moved out of InteractiveGradient unchanged.
export interface UseRefMirrorsParams {
  animValuesRef: MutableRefObject<{ voronoiAnimTime: number; flowerAnimTime: number; auroraAnimTime: number; turrellAnimTime: number; causticsAnimTime: number; lavaAnimTime: number; marbleAnimTime: number; metaballAnimTime: number; flowAnimTime: number; liquidAnimTime: number; emojiAnimTime: number; attractorAnimTime: number; tilingAnimTime: number; hatchAnimTime: number; noiseAnimTime: number; radialAnimTime: number; waveInterferenceAnimTime: number; meshWireframeAnimTime: number; fieldAnimTime: number; fieldSpeedLive: number; audioSubBassLevel: number; audioMidsLevel: number; audioTrebleLevel: number; audioEnergy: number; gridRotation: number; }>;
  flowerAnimTime: number;
  gradientColorsRef: MutableRefObject<ColorRGB[]>;
  gradientType: GradientType;
  gridRotation: number;
  isAudioActiveRef: MutableRefObject<boolean>;
  isAudioEnabled: boolean;
  isAudioReactive: boolean;
  isAutoColor: boolean;
  isAutoColorRef: MutableRefObject<boolean>;
  isAutoMode: boolean;
  isAutoModeRef: MutableRefObject<boolean>;
  isMicActive: boolean;
  isVCRPlaying: boolean;
  isVCRPlayingRef: MutableRefObject<boolean>;
  rotationDirection: "clockwise" | "counter";
  rotationDirectionRef: MutableRefObject<"clockwise" | "counter">;
  setTargetColors: (value: SetStateAction<ColorRGB[]>) => void;
  targetAngle: number;
  targetAngleRef: MutableRefObject<number>;
  targetColors: ColorRGB[];
  targetColorsRef: MutableRefObject<ColorRGB[]>;
  targetZoom: number;
  targetZoomRef: MutableRefObject<number>;
  tilingAnimTime: number;
  vcrPlaybackSpeed: number;
  vcrPlaybackSpeedRef: MutableRefObject<number>;
  voronoiAnimTime: number;
}

export function useRefMirrors(p: UseRefMirrorsParams) {
  const { animValuesRef, flowerAnimTime, gradientColorsRef, gradientType, gridRotation, isAudioActiveRef, isAudioEnabled, isAudioReactive, isAutoColor, isAutoColorRef, isAutoMode, isAutoModeRef, isMicActive, isVCRPlaying, isVCRPlayingRef, rotationDirection, rotationDirectionRef, setTargetColors, targetAngle, targetAngleRef, targetColors, targetColorsRef, targetZoom, targetZoomRef, tilingAnimTime, vcrPlaybackSpeed, vcrPlaybackSpeedRef, voronoiAnimTime } = p;
  // Keep target/mode refs in sync with state so the master RAF loop can read them without restarts.
  useEffect(() => { targetColorsRef.current = targetColors; }, [targetColors]);
  useEffect(() => { targetAngleRef.current = targetAngle; }, [targetAngle]);
  useEffect(() => { targetZoomRef.current = targetZoom; }, [targetZoom]);
  // gridRotation/voronoiAnimTime/flowerAnimTime/tilingAnimTime:
  // same pattern as targetAngleRef above — the main loop now writes these
  // directly into animValuesRef every frame instead of calling setState (see
  // the loop below), so state only changes from EXTERNAL setters (shuffle
  // randomization, snapshot/undo restore) or the loop's own periodic
  // ref→state sync (every 15 frames, for UI/snapshot freshness). Either way
  // this effect only fires a few times a second, not 60x/sec, and syncing
  // the ref back to a value it may already hold (when triggered by the
  // loop's own periodic sync) is a harmless no-op, not a feedback loop.
  useEffect(() => { animValuesRef.current.gridRotation = gridRotation; }, [gridRotation]);
  useEffect(() => { animValuesRef.current.voronoiAnimTime = voronoiAnimTime; }, [voronoiAnimTime]);
  useEffect(() => { animValuesRef.current.flowerAnimTime = flowerAnimTime; }, [flowerAnimTime]);
  useEffect(() => { animValuesRef.current.tilingAnimTime = tilingAnimTime; }, [tilingAnimTime]);
  useEffect(() => { vcrPlaybackSpeedRef.current = vcrPlaybackSpeed; }, [vcrPlaybackSpeed]);
  useEffect(() => { isAutoModeRef.current = isAutoMode; }, [isAutoMode]);
  useEffect(() => { rotationDirectionRef.current = rotationDirection; }, [rotationDirection]);
  useEffect(() => { isAutoColorRef.current = isAutoColor; }, [isAutoColor]);
  useEffect(() => { isVCRPlayingRef.current = isVCRPlaying; }, [isVCRPlaying]);

  useEffect(() => { isAudioActiveRef.current = isAudioEnabled && isAudioReactive; }, [isAudioEnabled, isAudioReactive]);


  // When mic activates on spiral (Windmill), freeze target colors so the lerp loop doesn't drift colors
  useEffect(() => {
    if (isMicActive && gradientType === 'windmill') {
      setTargetColors([...gradientColorsRef.current]);
    }
  }, [isMicActive, gradientType]);
}
