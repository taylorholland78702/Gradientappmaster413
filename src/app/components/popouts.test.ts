import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExportPopout } from './ExportPopout';
import { AutoShufflePopout } from './AutoShufflePopout';

const noop = () => {};

const exportProps = (over: Partial<Parameters<typeof ExportPopout>[0]> = {}) => ({
  isMobile: false,
  exportSize: 'screen' as const, setExportSize: noop,
  exportAspect: 'screen' as const, setExportAspect: noop,
  exportAsPNG: noop, closePopover: noop,
  videoSize: 'screen' as const, setVideoSize: noop,
  videoLength: 'manual' as const, setVideoLength: noop,
  isRecording: false, startVideoTake: noop,
  copiedKey: null, copyText: noop, currentPlayerUrl: () => 'http://x/?display=1',
  gradientColors: [{ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }], paletteStops: null,
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

  it('shows 4K in the PNG size row as well as the video size row', () => {
    expect(groupLabels(html, 'Export size')).toEqual(['Screen', '1080p', '4K', '8K']);
    expect(groupLabels(html, 'Video size')).toEqual(['Screen', '720p', '1080p', '4K']);
  });

  it('shows the PNG aspect and video length rows', () => {
    expect(groupLabels(html, 'Export aspect')).toEqual(['Screen', '1:1', '4:5', '16:9', '9:16']);
    expect(groupLabels(html, 'Video length')).toEqual(['Until I stop', '5s', '10s', '30s']);
  });

  it('has Save PNG, the recording button, embed and palette copy buttons, and no loop export', () => {
    expect(html).toContain('Save PNG');
    expect(html).toContain('Start recording');
    expect(html).toContain('Box 16:9');
    for (const f of ['Hex', 'CSS', 'Tailwind', 'JSON']) expect(html).toContain(`>${f}<`);
    expect(html.toLowerCase()).not.toContain('seamless loop');
  });

  it('marks the selected sizes pressed', () => {
    const h = renderToStaticMarkup(createElement(ExportPopout, exportProps({ exportSize: '4k', videoSize: '4k' })));
    expect(h.match(/aria-pressed="true"[^>]*>(4K)</g)?.length).toBe(2);
    expect(h).toContain('4K is heavy');
  });

  it('shows the key hint only on desktop, and disables the video choices while recording', () => {
    expect(html).toContain('The S key saves');
    const mobile = renderToStaticMarkup(createElement(ExportPopout, exportProps({ isMobile: true })));
    expect(mobile).not.toContain('The S key saves');
    const rec = renderToStaticMarkup(createElement(ExportPopout, exportProps({ isRecording: true })));
    expect(rec).toContain('Stop recording');
    expect(groupLabels(rec, 'Video size').length).toBe(4);
    expect(rec).toMatch(/disabled=""[^>]*>720p/);
  });

  it('shows Copied on the palette format that was just copied', () => {
    const h = renderToStaticMarkup(createElement(ExportPopout, exportProps({ copiedKey: 'palette-css' })));
    expect(h).toContain('>Copied<');
  });
});

describe('AutoShufflePopout', () => {
  const base = {
    isAutoShuffleOn: false, setIsAutoShuffleOn: vi.fn(),
    autoShuffleIntervalSec: 7, setAutoShuffleIntervalSec: vi.fn(),
    autoShuffleScope: 'all' as const, setAutoShuffleScope: vi.fn(),
  };

  it('lists the scopes and interval presets', () => {
    const html = renderToStaticMarkup(createElement(AutoShufflePopout, base));
    expect(groupLabels(html, 'What Auto Shuffle changes')).toEqual(['All', 'Gradient', 'Effects', 'Colors']);
    expect(groupLabels(html, 'Auto Shuffle interval presets')).toEqual(['5s', '15s', '1m', '5m']);
    expect(html).toContain('Remix every 7s');
  });

  it('reflects on/off state and the chosen scope', () => {
    const on = renderToStaticMarkup(createElement(AutoShufflePopout, { ...base, isAutoShuffleOn: true, autoShuffleScope: 'colors' }));
    expect(on).toContain('Turn off Auto Shuffle');
    expect(on).toMatch(/aria-pressed="true"[^>]*title="Only roll a new palette"/);
    const off = renderToStaticMarkup(createElement(AutoShufflePopout, base));
    expect(off).toContain('Turn on Auto Shuffle');
  });
});
