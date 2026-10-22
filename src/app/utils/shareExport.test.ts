import { describe, it, expect } from 'vitest';
import { formatPalette, embedSnippet } from './shareExport';

const colors = [{ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }, { r: 0, g: 0, b: 255 }];

describe('palette formats', () => {
  it('lists hex colors', () => {
    expect(formatPalette(colors, null, 'hex')).toBe('#ff0000, #00ff00, #0000ff');
  });
  it('builds a CSS gradient, using custom stop positions when given', () => {
    expect(formatPalette(colors, null, 'css')).toBe('linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)');
    expect(formatPalette(colors, [0, 0.2, 1], 'css')).toContain('#00ff00 20%');
  });
  it('writes Tailwind and JSON shapes', () => {
    expect(formatPalette(colors, null, 'tailwind')).toContain("100: '#ff0000'");
    expect(JSON.parse(formatPalette(colors, null, 'json'))[1]).toEqual({ color: '#00ff00', position: 0.5 });
  });
});

describe('embed snippet', () => {
  it('escapes the URL for an attribute and picks the layout', () => {
    const url = 'https://x.test/?display=1&preset=abc';
    expect(embedSnippet(url, 'box')).toContain('src="https://x.test/?display=1&amp;preset=abc"');
    expect(embedSnippet(url, 'box')).toContain('aspect-ratio:16/9');
    expect(embedSnippet(url, 'background')).toContain('position:fixed');
  });
});
