import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExportPopout } from './ExportPopout';
import { AutoShufflePopout } from './AutoShufflePopout';
import { IntensityPopout } from './IntensityPopout';

const noop = () => {};

const exportProps = (over: Partial<Parameters<typeof ExportPopout>[0]> = {}) => ({
  isMobile: false,
  closePopover: noop,
  copiedKey: null, copyText: noop, currentPlayerUrl: () => 'http://x/?display=1',
  saveWallpaper: noop,
  videoSize: '4k' as const, setVideoSize: noop,
  ...over,
});

// Pulls the button labels out of the group with the given aria-label.
const groupLabels = (html: string, label: string) => {
  const start = html.indexOf(`aria-label="${label}"`);
  expect(start).toBeGreaterThan(-1);
  const end = html.indexOf('</div>', start);
  return [...html.slice(start, end).matchAll(/>([^<>]+)<\/button>/g)].map(m => m[1]);
};

describe('ExportPopout', () => {
  const html = renderToStaticMarkup(createElement(ExportPopout, exportProps()));

  it('has one Save PNG button and the embed buttons', () => {
    expect(html).toContain('Save PNG');
    expect(html).not.toContain('Export size');
    expect(html).not.toContain('Export aspect');
    expect(html).not.toContain('Save as wallpaper');
    expect(html).toContain('Box 16:9');
    expect(html).toContain('Background');
    expect(html).not.toContain('recording');
    expect(html).not.toContain('Copy palette');
  });

  it('shows the key hint only on desktop', () => {
    expect(html).toContain('The S key saves it too');
    const mobile = renderToStaticMarkup(createElement(ExportPopout, exportProps({ isMobile: true })));
    expect(mobile).not.toContain('The S key saves it too');
  });

  it('has no looping clip, GIF or MP4 controls; the only video setting is the size of the Record button\'s take', () => {
    for (const word of ['Looping clip', 'Record loop', 'Loop length', 'Loop format', 'MP4', 'GIF']) expect(html).not.toContain(word);
  });

  it('offers a 4K / 8K video size on desktop only, with the chosen one pressed', () => {
    expect(groupLabels(html, 'Video size')).toEqual(['4K', '8K']);
    expect(html).toMatch(/aria-pressed="true"[^>]*title="Up to 4K, with a higher bitrate"/);
    const eight = renderToStaticMarkup(createElement(ExportPopout, exportProps({ videoSize: '8k' })));
    expect(eight).toMatch(/aria-pressed="true"[^>]*title="Needs a computer that can encode 8K/);
    const mobile = renderToStaticMarkup(createElement(ExportPopout, exportProps({ isMobile: true })));
    expect(mobile).not.toContain('Video size');
  });

  it('shows Copied on the embed button that was just copied', () => {
    const h = renderToStaticMarkup(createElement(ExportPopout, exportProps({ copiedKey: 'embed-box' })));
    expect(h).toContain('>Copied<');
  });
});

describe('AutoShufflePopout', () => {
  const base = {
    isAutoShuffleOn: false, setIsAutoShuffleOn: vi.fn(),
    autoShuffleIntervalSec: 7, setAutoShuffleIntervalSec: vi.fn(),
    autoShuffleScope: 'all' as const, setAutoShuffleScope: vi.fn(),
  };

  it('lists the scopes, with the interval in seconds and no preset buttons', () => {
    const html = renderToStaticMarkup(createElement(AutoShufflePopout, base));
    expect(groupLabels(html, 'What Auto Shuffle changes')).toEqual(['All', 'Gradient', 'Effects', 'Colors']);
    expect(html).not.toContain('Auto Shuffle interval presets');
    expect(html).toMatch(/aria-label="Auto Shuffle interval in seconds"[^>]*\/?>\s*<span[^>]*>sec</);
  });

  it('reflects on/off state and the chosen scope', () => {
    const on = renderToStaticMarkup(createElement(AutoShufflePopout, { ...base, isAutoShuffleOn: true, autoShuffleScope: 'colors' }));
    expect(on).toContain('Turn off Auto Shuffle');
    expect(on).toMatch(/aria-pressed="true"[^>]*title="Only roll a new palette"/);
    const off = renderToStaticMarkup(createElement(AutoShufflePopout, base));
    expect(off).toContain('Turn on Auto Shuffle');
  });
});

describe('IntensityPopout', () => {
  const base = { shuffleIntensity: 0.5, setShuffleIntensity: vi.fn(), reduceFlash: false };

  it('offers Intensity as a slider and three presets, with the matching one pressed', () => {
    const html = renderToStaticMarkup(createElement(IntensityPopout, base));
    expect(html).toContain('aria-label="Shuffle intensity"');
    expect(groupLabels(html, 'Shuffle intensity presets')).toEqual(['Calm', 'Lively', 'Wild']);
    expect(html).toMatch(/aria-pressed="true"[^>]*title="The usual mix"/);
    const wild = renderToStaticMarkup(createElement(IntensityPopout, { ...base, shuffleIntensity: 0.9, reduceFlash: true }));
    expect(wild).toMatch(/aria-pressed="true"[^>]*title="Fast, busy looks with many effects"/);
    expect(wild).toContain('Held back while Reduce flashing is on.');
  });
});
