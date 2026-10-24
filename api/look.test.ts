// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import zlib from 'node:zlib';
import handlerOg from './og';
import handlerShare, { injectMeta } from './share';
import { crc32, encodePng } from './_png';
import { parseHexList, renderCard, toHexList, DEFAULT_PALETTE } from './_card';
import { cardPath, decodePreset, describeLook, readLook } from './_look';
import names from './_lookNames.json';
import { GRADIENT_DISPLAY_NAMES } from '../src/app/constants/gradientEffects';
import { EFFECT_LABELS } from '../src/app/constants/effectRegistry';

const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sorted = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));

describe('look names', () => {
  it('match the app (regenerate with: UPDATE_LOOK_NAMES=1 npx vitest run api/look.test.ts)', () => {
    const fresh = { gradients: sorted(GRADIENT_DISPLAY_NAMES), effects: sorted(EFFECT_LABELS) };
    if (process.env.UPDATE_LOOK_NAMES) fs.writeFileSync(new URL('./_lookNames.json', import.meta.url), JSON.stringify(fresh, null, 1) + '\n');
    else expect(names).toEqual(fresh);
  });
});

describe('png writer', () => {
  it('crc32 of "IEND" is the standard value', () => {
    expect(crc32(new TextEncoder().encode('IEND')).toString(16)).toBe('ae426082');
  });
  it('writes a PNG that a real decoder reads back exactly', async () => {
    const w = 7, h = 5, rgb = new Uint8Array(w * h * 3).map((_, i) => (i * 37) % 256);
    const png = Buffer.from(await encodePng(w, h, rgb));
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.readUInt32BE(16)).toBe(w); expect(png.readUInt32BE(20)).toBe(h);
    // pull the IDAT out, inflate, and undo the Sub filter
    let at = 8, idat = Buffer.alloc(0);
    while (at < png.length) { const len = png.readUInt32BE(at); const type = png.subarray(at + 4, at + 8).toString(); if (type === 'IDAT') idat = Buffer.concat([idat, png.subarray(at + 8, at + 8 + len)]); at += 12 + len; }
    const raw = zlib.inflateSync(idat); const stride = w * 3; const back = new Uint8Array(w * h * 3);
    for (let y = 0; y < h; y++) { expect(raw[y * (stride + 1)]).toBe(1); for (let i = 0; i < stride; i++) back[y * stride + i] = (raw[y * (stride + 1) + 1 + i] + (i >= 3 ? back[y * stride + i - 3] : 0)) & 255; }
    expect(Array.from(back)).toEqual(Array.from(rgb));
  });
});

describe('card', () => {
  it('parses hex lists and ignores junk', () => {
    expect(parseHexList('2b1055-zzzz-7597de,#ff5e7e')).toEqual([{ r: 0x2b, g: 0x10, b: 0x55 }, { r: 0x75, g: 0x97, b: 0xde }, { r: 0xff, g: 0x5e, b: 0x7e }]);
    expect(parseHexList(null)).toEqual([]);
    expect(parseHexList('a'.repeat(6) + ('-' + 'b'.repeat(6)).repeat(20)).length).toBe(8);
  });
  it('round-trips a palette through the URL form', () => {
    expect(parseHexList(toHexList(DEFAULT_PALETTE))).toEqual(DEFAULT_PALETTE);
  });
  it('draws the palette: every pixel is a valid colour, and different palettes give different pictures', () => {
    const a = renderCard(DEFAULT_PALETTE, 120, 63), b = renderCard([{ r: 255, g: 0, b: 0 }, { r: 0, g: 0, b: 255 }], 120, 63);
    expect(a.length).toBe(120 * 63 * 3);
    expect(Array.from(a)).not.toEqual(Array.from(b));
  });
});

describe('reading a shared look', () => {
  const preset = { gradientType: 'bokeh', activeEffects: ['bloom', 'grain', 'not-an-effect', 'bloom'], gradientColors: [{ r: 10, g: 20, b: 30 }, { r: 300, g: -5, b: 99.6 }, { r: 'x' }] };
  it('keeps known ids, clamps colours, drops the rest', () => {
    const look = readLook(preset);
    expect(look.gradient).toBe('bokeh');
    expect(look.effects).toEqual(['bloom', 'grain']);
    expect(look.colors).toEqual([{ r: 10, g: 20, b: 30 }, { r: 255, g: 0, b: 100 }]);
  });
  it('names the look from the tables', () => {
    const d = describeLook(readLook(preset));
    expect(d.title).toContain('Bokeh');
    expect(d.title).toContain('Bloom');
    expect(d.description).toContain('Bokeh look with Bloom, Grain');
  });
  it('copes with a missing, broken or hostile preset', () => {
    expect(describeLook(readLook(null)).title).toBe('A look made in WĀV');
    expect(decodePreset('!!!not base64')).toBeNull();
    expect(decodePreset('x'.repeat(30000))).toBeNull();
    expect(readLook({ gradientType: '<script>', activeEffects: ['<img onerror=1>'], gradientColors: 'nope' }).gradient).toBeNull();
    expect(readLook(decodePreset(enc([1, 2, 3])))).toEqual({ gradient: null, effects: [], colors: [] });
  });
  it('reads the short (compressed) link form too, with hex palette colors', () => {
    const json = JSON.stringify({ gradientType: 'waves', activeEffects: ['grain'], gradientColors: ['2b1055', '#ff5e7e'] });
    const link = '~' + zlib.deflateRawSync(Buffer.from(json)).toString('base64url');
    const look = readLook(decodePreset(link));
    expect(look.gradient).toBe('waves');
    expect(look.effects).toEqual(['grain']);
    expect(look.colors).toEqual([{ r: 0x2b, g: 0x10, b: 0x55 }, { r: 0xff, g: 0x5e, b: 0x7e }]);
  });
  it('refuses a short link that would inflate to something huge', () => {
    expect(decodePreset('~' + zlib.deflateRawSync(Buffer.alloc(5_000_000, 32)).toString('base64url'))).toBeNull();
    expect(decodePreset('~not-a-real-link')).toBeNull();
  });
  it('uses the default card when the link has no usable palette', () => {
    expect(cardPath(readLook(null))).toBe('/og-default.png');
    expect(cardPath(readLook(preset))).toBe('/api/og?c=0a141e-ff0064');
  });
});

describe('injectMeta', () => {
  const html = '<html><head><title>WĀV</title><meta name="description" content="old" /><meta property="og:title" content="WĀV" /><meta name="twitter:card" content="summary" /></head><body></body></html>';
  const meta = { title: 'A "quoted" <b>title</b> · WĀV', description: 'd & d', image: 'https://x.test/api/og?c=aa', url: 'https://x.test/?preset=1' };
  const out = injectMeta(html, meta);
  it('replaces existing tags and adds the missing ones', () => {
    expect(out).toContain('<title>A &quot;quoted&quot; &lt;b&gt;title&lt;/b&gt; · WĀV</title>');
    expect(out).toContain('<meta property="og:image" content="https://x.test/api/og?c=aa" />');
    expect(out).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(out).not.toContain('content="summary"');
    expect(out).not.toContain('content="old"');
    expect(out.match(/og:title/g)?.length).toBe(1);
  });
  it('escapes everything it inserts', () => {
    expect(out).not.toContain('<b>title</b>');
    expect(out).toContain('d &amp; d');
  });
});

describe('handlers', () => {
  it('/api/og returns a 1200x630 PNG and caches it', async () => {
    const res = await handlerOg(new Request('https://x.test/api/og?c=2b1055-ff5e7e'));
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toContain('immutable');
    const png = Buffer.from(await res.arrayBuffer());
    expect(png.readUInt32BE(16)).toBe(1200); expect(png.readUInt32BE(20)).toBe(630);
    expect(png.length).toBeLessThan(400_000);
  });
  it('/api/share returns the page with the look in its preview tags', async () => {
    const page = '<html><head><title>WĀV</title></head><body><div id="root"></div></body></html>';
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL) => { expect(String(input)).toBe('https://x.test/index.html'); return new Response(page, { status: 200 }); }) as typeof fetch;
    try {
      const link = `https://x.test/?display=1&preset=${enc({ gradientType: 'smoke', activeEffects: ['vignette'], gradientColors: [{ r: 1, g: 2, b: 3 }, { r: 4, g: 5, b: 6 }] })}`;
      const res = await handlerShare(new Request(link));
      const html = await res.text();
      expect(html).toContain('<title>Smoke + Vignette · WĀV</title>');
      expect(html).toContain('content="https://x.test/api/og?c=010203-040506"');
      expect(html).toContain('<div id="root">');
      expect(res.headers.get('cross-origin-embedder-policy')).toBe('require-corp');
    } finally { globalThis.fetch = realFetch; }
  });
});
