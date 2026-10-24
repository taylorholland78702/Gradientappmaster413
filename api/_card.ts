// The share-card picture: the look's palette blended like a mesh gradient (each color pulls on the pixels
// near its anchor), with a soft vignette. It is drawn on the server, which cannot run the app's shaders, so it is
// the palette and the general feel of the look, not a screenshot of it.

export interface Rgb { r: number; g: number; b: number }
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export const DEFAULT_PALETTE: Rgb[] = [
  { r: 0x2b, g: 0x10, b: 0x55 }, { r: 0x75, g: 0x97, b: 0xde }, { r: 0xff, g: 0x5e, b: 0x7e }, { r: 0xff, g: 0xd1, b: 0x66 },
];

export function parseHexList(list: string | null | undefined, max = 8): Rgb[] {
  if (!list) return [];
  const out: Rgb[] = [];
  for (const part of list.split(/[-,]/)) {
    const m = /^#?([0-9a-f]{6})$/i.exec(part.trim());
    if (m) { const n = parseInt(m[1], 16); out.push({ r: n >> 16, g: (n >> 8) & 255, b: n & 255 }); }
    if (out.length >= max) break;
  }
  return out;
}

export const toHexList = (colors: Rgb[]) => colors.map(c => [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('')).join('-');

export function renderCard(colors: Rgb[], width = CARD_WIDTH, height = CARD_HEIGHT): Uint8Array {
  const palette = colors.length >= 2 ? colors.slice(0, 8) : DEFAULT_PALETTE;
  const n = palette.length;
  const aspect = width / height;
  // anchors spiral out from the centre, so the order of the palette decides the layout
  const anchors = palette.map((c, i) => {
    const angle = i * 2.399963 + 0.6;
    const radius = 0.16 + 0.3 * ((i * 0.618034) % 1);
    return { x: 0.5 + Math.cos(angle) * radius * 1.5, y: 0.5 + Math.sin(angle) * radius, c };
  });
  const out = new Uint8Array(width * height * 3);
  let p = 0;
  for (let py = 0; py < height; py++) {
    const y = py / height;
    for (let px = 0; px < width; px++) {
      const x = px / width;
      let sr = 0, sg = 0, sb = 0, sw = 0;
      for (let i = 0; i < n; i++) {
        const dx = (x - anchors[i].x) * aspect, dy = y - anchors[i].y;
        const w = 1 / Math.pow(dx * dx + dy * dy + 0.025, 1.3);
        sr += anchors[i].c.r * w; sg += anchors[i].c.g * w; sb += anchors[i].c.b * w; sw += w;
      }
      const cx = (x - 0.5) * aspect, cy = y - 0.5;
      const vignette = 1 - 0.32 * Math.min(1, (cx * cx + cy * cy) * 1.1);
      out[p++] = Math.max(0, Math.min(255, Math.round((sr / sw) * vignette)));
      out[p++] = Math.max(0, Math.min(255, Math.round((sg / sw) * vignette)));
      out[p++] = Math.max(0, Math.min(255, Math.round((sb / sw) * vignette)));
    }
  }
  return out;
}
