import type { DrawCtx } from '../canvasDrawTypes';

// A night sky that the music builds. Each hit in the low end adds a star at a new spot and draws a thread from it to
// its nearest neighbours; the oldest stars fade away so the picture keeps growing and turning over. With no audio it
// keeps its own slow pulse, so it is never an empty frame. It has no settings of its own: colours come from the palette.
interface Star { x: number; y: number; vx: number; vy: number; born: number; hue: number; links: number[] }

const MAX_STARS = 56;
const LIFE_MS = 26000;
const LINK_DRAW_MS = 520;
const COOLDOWN_MS = 170;
const IDLE_PULSE_MS = 950;

let stars: Star[] = [];
let nextId = 0;
const ids = new WeakMap<Star, number>();
let lastHitAt = 0;
let lastLevel = 0;
let average = 0;
let lastFrameAt = 0;

function addStar(w: number, h: number, now: number, colorCount: number) {
  const margin = 0.08;
  const star: Star = {
    x: (margin + Math.random() * (1 - 2 * margin)) * w,
    y: (margin + Math.random() * (1 - 2 * margin)) * h,
    vx: (Math.random() - 0.5) * 0.012, vy: (Math.random() - 0.5) * 0.012,
    born: now, hue: Math.floor(Math.random() * Math.max(1, colorCount)), links: [],
  };
  ids.set(star, nextId++);
  // Thread to the two nearest stars still alive.
  const near = stars
    .map(s => ({ s, d: (s.x - star.x) ** 2 + (s.y - star.y) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  star.links = near.map(n => ids.get(n.s) ?? -1).filter(i => i >= 0);
  stars.push(star);
  if (stars.length > MAX_STARS) stars.shift();
}

export function drawConstellation(P: DrawCtx): CanvasGradient | undefined {
  const { ctx, canvas, displayWidth: w, displayHeight: h, gradientColors, isAudioEnabled, isAudioReactive, audioSubBassLevel, audioEnergy } = P;
  if (canvas.width === 0 || canvas.height === 0) return undefined;
  if (!gradientColors || gradientColors.length === 0) return undefined;
  const now = performance.now();
  const dt = Math.min(64, lastFrameAt ? now - lastFrameAt : 16);
  lastFrameAt = now;

  // A hit: the low end jumps well above its recent average. The average follows slowly so a loud track does not
  // fire constantly and a quiet one still can.
  const audioActive = isAudioEnabled && isAudioReactive;
  const level = audioActive ? Math.max(audioSubBassLevel || 0, (audioEnergy || 0) * 0.8) : 0;
  const hit = audioActive && level > average * 1.35 + 0.12 && level > lastLevel && now - lastHitAt > COOLDOWN_MS;
  average += (level - average) * 0.04;
  lastLevel = level;
  // With no hits (no audio, or a silent moment) a star still appears now and then, so the sky is never empty.
  if (hit || now - lastHitAt > (audioActive ? IDLE_PULSE_MS * 2.8 : IDLE_PULSE_MS)) {
    lastHitAt = now;
    addStar(w, h, now, gradientColors.length);
    // A big hit adds a second star so a drop visibly fills the sky.
    if (hit && level > average * 2.2 + 0.4) addStar(w, h, now, gradientColors.length);
  }
  stars = stars.filter(s => now - s.born < LIFE_MS);

  // Sky: near black, tinted by the palette's darkest colour.
  const dark = gradientColors.reduce((a, c) => (c.r + c.g + c.b < a.r + a.g + a.b ? c : a), gradientColors[0]);
  ctx.fillStyle = `rgb(${Math.round(dark.r * 0.18)}, ${Math.round(dark.g * 0.18)}, ${Math.round(dark.b * 0.18)})`;
  ctx.fillRect(0, 0, w, h);

  const scale = Math.min(w, h) / 700;
  const byId = new Map<number, Star>();
  for (const s of stars) byId.set(ids.get(s) ?? -1, s);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  // Threads first, so the stars sit on top.
  for (const s of stars) {
    s.x += s.vx * dt; s.y += s.vy * dt;
    const age = now - s.born;
    const fade = Math.min(1, (LIFE_MS - age) / 5000);
    const c = gradientColors[s.hue % gradientColors.length];
    for (const lid of s.links) {
      const o = byId.get(lid);
      if (!o) continue;
      const drawn = Math.min(1, age / LINK_DRAW_MS);
      const alpha = (0.28 + 0.55 * Math.max(0, 1 - age / 2500)) * fade * Math.min(1, (LIFE_MS - (now - o.born)) / 5000);
      ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.max(0, alpha).toFixed(3)})`;
      ctx.lineWidth = Math.max(1.2, 1.8 * scale);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + (o.x - s.x) * drawn, s.y + (o.y - s.y) * drawn);
      ctx.stroke();
    }
  }
  for (const s of stars) {
    const age = now - s.born;
    const fade = Math.min(1, (LIFE_MS - age) / 5000);
    const c = gradientColors[s.hue % gradientColors.length];
    // A new star flares and settles.
    const flare = Math.max(0, 1 - age / 900);
    const r = (4.6 + 12 * flare) * scale;
    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 4);
    g.addColorStop(0, `rgba(255, 255, 255, ${(0.9 * fade).toFixed(3)})`);
    g.addColorStop(0.18, `rgba(${c.r}, ${c.g}, ${c.b}, ${(0.75 * fade).toFixed(3)})`);
    g.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  return undefined;
}
