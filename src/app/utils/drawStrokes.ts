import type { ColorRGB } from '../constants/gradientEffects';

// Draw mode: freehand strokes laid over the gradient (under the effects) that
// fade away on their own. A stroke is a trail of soft round "dabs"; each dab
// remembers its position (as a fraction of the canvas, so a resize keeps it),
// radius, color and birth time, and is drawn every frame with an alpha that
// falls to 0 over the fade time. Kept outside React: it changes every pointer
// event and every frame, and nothing in the UI needs to re-render for it.

interface Dab { x: number; y: number; r: number; born: number; color: ColorRGB }

const MAX_DABS = 2500;
let dabs: Dab[] = [];

export const drawSettings = { fadeMs: 4000, softness: 0.6 };

let last: { x: number; y: number; pressure: number } | null = null;
let colorPhase = 0;

export const hasLiveDabs = () => dabs.length > 0;
export const clearDabs = () => { dabs = []; last = null; };
export const endStroke = () => { last = null; };

export interface StrokeOptions {
  canvasW: number;
  canvasH: number;
  sizePx: number;
  now: number;
  // Fixed color, or undefined to cycle along the palette (colorAt gets 0..1).
  fixedColor?: ColorRGB;
  colorAt: (t: number) => ColorRGB;
}

// Adds the dabs between the previous pointer position and this one. Pressure is
// 0..1 (a mouse should pass 1): it scales the brush between 35% and 100%.
export function addStrokePoint(nx: number, ny: number, pressure: number, o: StrokeOptions) {
  const radiusFor = (p: number) => o.sizePx * (0.35 + 0.65 * Math.max(0, Math.min(1, p)));
  const px = nx * o.canvasW, py = ny * o.canvasH;
  const colorFor = () => {
    if (o.fixedColor) return o.fixedColor;
    // Ping-pong 0..1 so the palette runs forward then back instead of jumping at the end.
    const ph = colorPhase % 2;
    return o.colorAt(ph > 1 ? 2 - ph : ph);
  };
  if (!last) {
    dabs.push({ x: nx, y: ny, r: radiusFor(pressure), born: o.now, color: colorFor() });
  } else {
    const lx = last.x * o.canvasW, ly = last.y * o.canvasH;
    const dist = Math.hypot(px - lx, py - ly);
    const r0 = radiusFor(last.pressure), r1 = radiusFor(pressure);
    const step = Math.max(2, Math.min(r0, r1) * 0.3);
    const n = Math.max(1, Math.ceil(dist / step));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      colorPhase += (dist / n) / (o.sizePx * 10);
      dabs.push({
        x: (lx + (px - lx) * t) / o.canvasW,
        y: (ly + (py - ly) * t) / o.canvasH,
        r: r0 + (r1 - r0) * t,
        born: o.now,
        color: colorFor(),
      });
    }
  }
  last = { x: nx, y: ny, pressure };
  if (dabs.length > MAX_DABS) dabs.splice(0, dabs.length - MAX_DABS);
}

// One soft disc per quantized color and softness, drawn scaled: much cheaper than
// building a radial gradient for every dab every frame.
const sprites = new Map<string, HTMLCanvasElement>();
const SPRITE = 64;
function spriteFor(c: ColorRGB, softness: number): HTMLCanvasElement {
  const q = (v: number) => Math.min(255, (Math.round(v / 8) * 8));
  const rq = q(c.r), gq = q(c.g), bq = q(c.b);
  const sq = Math.round(softness * 10);
  const key = `${rq},${gq},${bq},${sq}`;
  let s = sprites.get(key);
  if (!s) {
    if (sprites.size > 400) sprites.clear();
    s = document.createElement('canvas');
    s.width = s.height = SPRITE;
    const g = s.getContext('2d')!;
    const hard = Math.max(0.05, Math.min(0.95, 1 - sq / 10));
    const grad = g.createRadialGradient(SPRITE / 2, SPRITE / 2, 0, SPRITE / 2, SPRITE / 2, SPRITE / 2);
    grad.addColorStop(0, `rgba(${rq},${gq},${bq},1)`);
    grad.addColorStop(hard, `rgba(${rq},${gq},${bq},1)`);
    grad.addColorStop(1, `rgba(${rq},${gq},${bq},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, SPRITE, SPRITE);
    sprites.set(key, s);
  }
  return s;
}

// Draws every live dab (oldest first) and drops the ones that have faded out.
export function renderDabs(ctx: CanvasRenderingContext2D, w: number, h: number, now: number) {
  if (dabs.length === 0) return;
  const fade = Math.max(200, drawSettings.fadeMs);
  let keepFrom = 0;
  while (keepFrom < dabs.length && now - dabs[keepFrom].born >= fade) keepFrom++;
  if (keepFrom > 0) dabs.splice(0, keepFrom);
  ctx.save();
  for (const d of dabs) {
    const u = (now - d.born) / fade;
    const alpha = Math.pow(1 - u, 1.4);
    if (alpha <= 0.004) continue;
    ctx.globalAlpha = alpha;
    const size = d.r * 2;
    ctx.drawImage(spriteFor(d.color, drawSettings.softness), d.x * w - d.r, d.y * h - d.r, size, size);
  }
  ctx.restore();
}
