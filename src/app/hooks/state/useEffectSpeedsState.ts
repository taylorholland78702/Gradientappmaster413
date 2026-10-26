import { useState, useCallback } from 'react';
import { DEFAULT_EFFECT_SPEEDS, type EffectSpeedKey, type EffectSpeeds } from '../../constants/effectSpeeds';

export function useEffectSpeedsState() {
  const [effectSpeeds, setEffectSpeeds] = useState<EffectSpeeds>({ ...DEFAULT_EFFECT_SPEEDS });
  const setEffectSpeed = useCallback((key: EffectSpeedKey, v: number) => setEffectSpeeds(prev => ({ ...prev, [key]: v })), []);
  return { effectSpeeds, setEffectSpeed };
}
