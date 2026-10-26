import { useCallback, useState } from 'react';
import { type EffectSpeedKey, type EffectSpeeds } from '../../constants/effectSpeeds';

// Speed for the effects that animate on a clock of their own. One state per effect so each can be saved in a look
// (they are saved as crtSpeed, ditherSpeed, ...); `effectSpeeds` and `setEffectSpeed` are the same values by key.
export function useEffectSpeedsState() {
  const [crtSpeed, setCrtSpeed] = useState(1);
  const [ditherSpeed, setDitherSpeed] = useState(1);
  const [dadaSpeed, setDadaSpeed] = useState(1);
  const [asciiSpeed, setAsciiSpeed] = useState(1);
  const [watercolorSpeed, setWatercolorSpeed] = useState(1);
  const [impastoSpeed, setImpastoSpeed] = useState(1);
  const effectSpeeds: EffectSpeeds = { crt: crtSpeed, dither: ditherSpeed, dada: dadaSpeed, ascii: asciiSpeed, watercolor: watercolorSpeed, impasto: impastoSpeed };
  const setters = { crt: setCrtSpeed, dither: setDitherSpeed, dada: setDadaSpeed, ascii: setAsciiSpeed, watercolor: setWatercolorSpeed, impasto: setImpastoSpeed };
  const setEffectSpeed = useCallback((key: EffectSpeedKey, v: number) => setters[key](v), []); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    effectSpeeds, setEffectSpeed,
    crtSpeed, setCrtSpeed, ditherSpeed, setDitherSpeed, dadaSpeed, setDadaSpeed,
    asciiSpeed, setAsciiSpeed, watercolorSpeed, setWatercolorSpeed, impastoSpeed, setImpastoSpeed,
  };
}
