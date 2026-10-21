import type { ColorRGB } from '../constants/gradientEffects';

// Draw mode: freehand strokes laid over the gradient (under the effects) that
// fade away on their own. A stroke is a trail of soft round "dabs"; each dab
// remembers its position (as a fraction of the canvas, so a resize keeps it),
// radius, color and birth time, and is drawn every frame with an alpha that
// falls to 0 over the fade time. Kept outside React: it changes every pointer
// event and every frame, and nothing in the UI needs to re-render for it.

export type BrushKind = 'soft' | 'glow' | 'spray' | 'ribbon' | 'chalk' | 'dots';
export const BRUSHES: { id: BrushKind; label: string; hint: string; usesSoftness: boolean }[] = [
  { id: 'soft', label: 'Soft', hint: 'Round brush, hard to feathered', usesSoftness: true },
  { id: 'glow', label: 'Glow', hint: 'Light that adds up where strokes overlap', usesSoftness: true },
  { id: 'spray', label: 'Spray', hint: 'A scatter of fine specks, like a spray can', usesSoftness: false },
  { id: 'ribbon', label: 'Ribbon', hint: 'Flat angled nib, like calligraphy', usesSoftness: true },
  { id: 'chalk', label: 'Chalk', hint: 'Gritty, broken edge', usesSoftness: false },
  { id: 'dots', label: 'Dots', hint: 'Separate round dots along the path', usesSoftness: false },
];

interface Dab { x: number; y: number; r: number; born: number; color: ColorRGB; kind: BrushKind }

const MAX_DABS = 2500;
let dabs: Dab[] = [];

export const drawSettings: { fadeMs: number; softness: number; brush: BrushKind } = { fadeMs: 4000, softness: 0.6, brush: 'soft' };

let last: { x: number; y: number; pressure: number } | null = null;
let colorPhase = 0;
let carry = 0;

export const hasLiveDabs = () => dabs.length > 0;
export const clearDabs = () => { dabs = []; last = null; };
export const endStroke = () => { last = null; carry = 0; };

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
  const kind = drawSettings.brush;
  const radiusFor = (p: number) => o.sizePx * (0.35 + 0.65 * Math.max(0, Math.min(1, p)));
  const px = nx * o.canvasW, py = ny * o.canvasH;
  const colorFor = () => {
    if (o.fixedColor) return o.fixedColor;
    // Ping-pong 0..1 so the palette runs forward then back instead of jumping at the end.
    const ph = colorPhase % 2;
    return o.colorAt(ph > 1 ? 2 - ph : ph);
  };
  // One brush stamp at a point. Spray scatters many tiny specks around it instead.
  const stamp = (x: number, y: number, r: number) => {
    if (kind === 'spray') {
      const count = Math.max(3, Math.round(r * 0.35));
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random()) * r;
        dabs.push({ x: x + (Math.cos(a) * d) / o.canvasW, y: y + (Math.sin(a) * d) / o.canvasH, r: 1 + Math.random() * 1.8, born: o.now, color: colorFor(), kind });
      }
    } else {
      dabs.push({ x, y, r, born: o.now, color: colorFor(), kind });
    }
  };
  // How far apart stamps sit: tight for continuous brushes, wide for dots.
  const spacingFor = (r: number) => (kind === 'dots' ? Math.max(8, r * 3.1) : kind === 'spray' ? Math.max(3, r * 0.5) : kind === 'glow' ? Math.max(3, r * 0.5) : Math.max(2, r * 0.3));
  if (!last) {
    stamp(nx, ny, radiusFor(pressure));
    carry = 0;
  } else {
    // Walk the segment, stamping each time the brush has traveled `step`. The leftover
    // distance carries into the next pointer event, so the spacing stays even however
    // fast or slow the pointer reports (matters most for Dots, whose gaps are visible).
    const lx = last.x * o.canvasW, ly = last.y * o.canvasH;
    const dist = Math.hypot(px - lx, py - ly);
    const r0 = radiusFor(last.pressure), r1 = radiusFor(pressure);
    let pos = 0;
    while (true) {
      const t0 = dist > 0 ? pos / dist : 1;
      const r = r0 + (r1 - r0) * Math.min(1, t0);
      const step = spacingFor(r);
      const need = step - carry;
      if (pos + need > dist) { carry += dist - pos; break; }
      pos += need;
      carry = 0;
      const t = dist > 0 ? pos / dist : 1;
      colorPhase += step / (o.sizePx * 10);
      stamp((lx + (px - lx) * t) / o.canvasW, (ly + (py - ly) * t) / o.canvasH, r0 + (r1 - r0) * t);
    }
  }
  last = { x: nx, y: ny, pressure };
  if (dabs.length > MAX_DABS) dabs.splice(0, dabs.length - MAX_DABS);
}

// One soft disc per quantized color and softness, drawn scaled: much cheaper than
// building a radial gradient for every dab every frame.
const sprites = new Map<string, HTMLCanvasElement>();
const SPRITE = 64;
function spriteFor(c: ColorRGB, softness: number, kind: BrushKind): HTMLCanvasElement {
  const q = (v: number) => Math.min(255, (Math.round(v / 8) * 8));
  const rq = q(c.r), gq = q(c.g), bq = q(c.b);
  // Brushes that don't expose Softness use a fixed edge, so they share sprites.
  const sq = kind === 'glow' ? 10 : kind === 'soft' || kind === 'ribbon' ? Math.round(softness * 10) : kind === 'spray' || kind === 'dots' ? 0 : 3;
  const key = `${kind},${rq},${gq},${bq},${sq}`;
  let s = sprites.get(key);
  if (!s) {
    if (sprites.size > 500) sprites.clear();
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
    if (kind === 'chalk') {
      // Knock a deterministic scatter of holes out of a near-hard disc for a gritty edge.
      g.globalCompositeOperation = 'destination-out';
      let seed = 1234567;
      const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
      for (let i = 0; i < 260; i++) {
        g.globalAlpha = 0.35 + rnd() * 0.65;
        g.fillRect(rnd() * SPRITE, rnd() * SPRITE, 1 + rnd() * 3, 1 + rnd() * 3);
      }
    }
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
  let currentOp: GlobalCompositeOperation = 'source-over';
  for (const d of dabs) {
    const u = (now - d.born) / fade;
    const alpha = Math.pow(1 - u, 1.4);
    if (alpha <= 0.004) continue;
    const op: GlobalCompositeOperation = d.kind === 'glow' ? 'lighter' : 'source-over';
    if (op !== currentOp) { ctx.globalCompositeOperation = op; currentOp = op; }
    ctx.globalAlpha = d.kind === 'glow' ? alpha * 0.16 : alpha;
    const sprite = spriteFor(d.color, drawSettings.softness, d.kind);
    const cx = d.x * w, cy = d.y * h;
    if (d.kind === 'ribbon') {
      // A flat nib held at a fixed angle: a long thin ellipse.
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.8);
      ctx.drawImage(sprite, -d.r, -d.r * 0.28, d.r * 2, d.r * 0.56);
      ctx.restore();
    } else if (d.kind === 'glow') {
      ctx.drawImage(sprite, cx - d.r * 1.3, cy - d.r * 1.3, d.r * 2.6, d.r * 2.6);
    } else {
      ctx.drawImage(sprite, cx - d.r, cy - d.r, d.r * 2, d.r * 2);
    }
  }
  ctx.restore();
}
