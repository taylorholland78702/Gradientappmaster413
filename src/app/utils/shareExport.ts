import type { ColorRGB } from '../constants/gradientEffects';
import { rgbToHex } from './color';

// Text a designer or developer can paste elsewhere: the palette in a few formats, and the
// snippet for dropping a live gradient into a web page.

export type PaletteFormat = 'hex' | 'css' | 'tailwind' | 'json';

const hexes = (colors: ColorRGB[]) => colors.map(c => rgbToHex({ r: Math.round(c.r), g: Math.round(c.g), b: Math.round(c.b) }));

export function formatPalette(colors: ColorRGB[], stops: number[] | null, format: PaletteFormat): string {
  const h = hexes(colors);
  const pos = stops && stops.length === h.length ? stops : h.map((_, i) => (h.length === 1 ? 0 : i / (h.length - 1)));
  switch (format) {
    case 'hex':
      return h.join(', ');
    case 'css':
      return `linear-gradient(90deg, ${h.map((c, i) => `${c} ${Math.round(pos[i] * 100)}%`).join(', ')})`;
    case 'tailwind':
      return `colors: {\n  wav: {\n${h.map((c, i) => `    ${(i + 1) * 100}: '${c}',`).join('\n')}\n  },\n}`;
    case 'json':
      return JSON.stringify(h.map((c, i) => ({ color: c, position: Math.round(pos[i] * 1000) / 1000 })), null, 2);
  }
}

export type EmbedKind = 'box' | 'background';

// An iframe pointing at the player link (the app's ?display=1&preset=… mode, which draws the
// look with no controls). "box" is a responsive 16:9 frame; "background" pins it behind the page.
export function embedSnippet(playerUrl: string, kind: EmbedKind): string {
  const src = playerUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  if (kind === 'background') {
    return `<iframe src="${src}" title="WĀV gradient" style="position:fixed;inset:0;width:100%;height:100%;border:0;z-index:-1;pointer-events:none" loading="lazy" aria-hidden="true"></iframe>`;
  }
  return `<iframe src="${src}" title="WĀV gradient" style="width:100%;aspect-ratio:16/9;border:0" loading="lazy" allow="autoplay"></iframe>`;
}
