import { describe, it, expect } from 'vitest';
import { AUTO_SHUFFLE_MIN_SEC, AUTO_SHUFFLE_MAX_SEC } from '../constants/autoShuffle';
import { autoShuffleSliderMax, autoShuffleSecToSlider, autoShuffleSliderToSec, formatAutoShuffleInterval } from './autoShuffle';

describe('auto shuffle interval slider', () => {
  it('maps the ends of the range to the ends of the slider', () => {
    expect(autoShuffleSecToSlider(AUTO_SHUFFLE_MIN_SEC)).toBe(0);
    expect(autoShuffleSecToSlider(AUTO_SHUFFLE_MAX_SEC)).toBe(autoShuffleSliderMax);
    expect(autoShuffleSliderToSec(0)).toBe(AUTO_SHUFFLE_MIN_SEC);
    expect(autoShuffleSliderToSec(autoShuffleSliderMax)).toBe(AUTO_SHUFFLE_MAX_SEC);
  });

  it('clamps values below the minimum', () => {
    expect(autoShuffleSecToSlider(0)).toBe(0);
    expect(autoShuffleSecToSlider(-5)).toBe(0);
  });

  it('is monotonic and round-trips the preset values', () => {
    let last = -1;
    for (let s = 1; s <= 3600; s += 7) {
      const v = autoShuffleSecToSlider(s);
      expect(v).toBeGreaterThanOrEqual(last);
      last = v;
    }
    for (const sec of [5, 15, 60, 300]) {
      expect(Math.abs(autoShuffleSliderToSec(autoShuffleSecToSlider(sec)) - sec) / sec).toBeLessThan(0.05);
    }
  });

  it('gives short values more of the track than long ones', () => {
    expect(autoShuffleSecToSlider(60)).toBeGreaterThan(autoShuffleSliderMax / 2 - 200);
    expect(autoShuffleSecToSlider(10)).toBeGreaterThan(autoShuffleSecToSlider(3600) - autoShuffleSecToSlider(600));
  });
});

describe('formatAutoShuffleInterval', () => {
  it('formats seconds, minutes, and minutes with a remainder', () => {
    expect(formatAutoShuffleInterval(7)).toBe('7s');
    expect(formatAutoShuffleInterval(59)).toBe('59s');
    expect(formatAutoShuffleInterval(60)).toBe('1m');
    expect(formatAutoShuffleInterval(300)).toBe('5m');
    expect(formatAutoShuffleInterval(90)).toBe('1m 30s');
  });
});
