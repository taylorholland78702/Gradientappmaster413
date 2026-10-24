// Auto Shuffle's interval controls: seconds <-> slider position on a log scale, and a short label.
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC } from '../constants/autoShuffle';

// Log-scale mapping so the slider gives useful precision across the whole
// 1s-3600s range instead of a linear scale where the first few seconds
// (the most commonly used values) would be squeezed into a sliver of the
// track.
export const autoShuffleSliderMax = 1000;
export const autoShuffleLogRange = Math.log(AUTO_SHUFFLE_MAX_SEC) - Math.log(AUTO_SHUFFLE_MIN_SEC);
export const autoShuffleSecToSlider = (sec: number) =>
  Math.round(autoShuffleSliderMax * (Math.log(Math.max(AUTO_SHUFFLE_MIN_SEC, sec)) - Math.log(AUTO_SHUFFLE_MIN_SEC)) / autoShuffleLogRange);
export const autoShuffleSliderToSec = (v: number) =>
  Math.round(Math.exp(Math.log(AUTO_SHUFFLE_MIN_SEC) + autoShuffleLogRange * (v / autoShuffleSliderMax)));
export const formatAutoShuffleInterval = (sec: number) => {
  if (sec < 60) return `${sec}s`;
  const minutes = Math.floor(sec / 60);
  const remainder = sec % 60;
  return remainder === 0 ? `${minutes}m` : `${minutes}m ${remainder}s`;
};
