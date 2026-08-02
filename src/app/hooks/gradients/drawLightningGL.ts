// WebGL2 renderer for Lightning — see the CPU version (drawLightning.ts)
// for the reference implementation and the exact recursive midpoint-
// displacement bolt geometry this reuses unchanged (buildBolt is pure CPU
// math, copied verbatim — generating a bolt's segment list is cheap; only
// the CPU version's per-segment ctx.stroke() calls are what this replaces).
//
// WebGL's gl.LINES does not reliably support variable line width across
// browsers/GPUs (many implementations silently clamp to 1px regardless of
// gl.lineWidth) — so each segment is built as a small screen-space quad
// (2 triangles) with the desired width instead, both for the CPU version's
// thick low-alpha glow pass and its thin bright core pass. Same persistent
// fade-trail buffer technique as Fireworks GL (glParticleShared.ts).
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { initPersistentGL, detectParticleGLSupport, drawFadeQuad, drawTriangles, toClipSpace, PersistentGLState } from './glParticleShared';

interface Segment { x1: number; y1: number; x2: number; y2: number; w: number }

function buildBolt(x1: number, y1: number, x2: number, y2: number, displacement: number, branchiness: number, depth: number, segments: Segment[], seed: { v: number }, weight: number) {
  if (depth <= 0 || displacement < 1) {
    segments.push({ x1, y1, x2, y2, w: weight });
    return;
  }
  const rand = () => {
    seed.v = (seed.v * 9301 + 49297) % 233280;
    return seed.v / 233280;
  };
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const offset = (rand() - 0.5) * 2 * displacement;
  const ox = mx + nx * offset;
  const oy = my + ny * offset;

  buildBolt(x1, y1, ox, oy, displacement * 0.55, branchiness, depth - 1, segments, seed, weight);
  buildBolt(ox, oy, x2, y2, displacement * 0.55, branchiness, depth - 1, segments, seed, weight);

  if (rand() < branchiness && depth > 1) {
    const branchAngle = Math.atan2(dy, dx) + (rand() - 0.5) * 1.6;
    const branchLen = len * (0.2 + rand() * 0.3);
    const bx = ox + Math.cos(branchAngle) * branchLen;
    const by = oy + Math.sin(branchAngle) * branchLen;
    buildBolt(ox, oy, bx, by, displacement * 0.4, branchiness * 0.6, depth - 2, segments, seed, weight * 0.6);
  }
}

let state: PersistentGLState | null = null;
let stateW = 0, stateH = 0;

export function detectLightningGLSupport(): boolean {
  return detectParticleGLSupport();
}

// Appends one segment's quad (2 triangles, 6 vertices) in clip space to
// the position/color arrays at the given vertex offset. widthPx is in CPU
// pixels; converted to clip-space half-width per axis since a fixed pixel
// offset maps to a different clip-space delta on X vs Y for non-square
// canvases.
function appendSegmentQuad(
  positions: Float32Array, colors: Float32Array, offset: number,
  seg: Segment, widthPx: number, r: number, g: number, b: number, alpha: number,
  displayWidth: number, displayHeight: number,
) {
  const dx = seg.x2 - seg.x1, dy = seg.y2 - seg.y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const hw = widthPx / 2;
  const ax = seg.x1 + nx * hw, ay = seg.y1 + ny * hw;
  const bx = seg.x2 + nx * hw, by = seg.y2 + ny * hw;
  const cx = seg.x2 - nx * hw, cy = seg.y2 - ny * hw;
  const dxp = seg.x1 - nx * hw, dyp = seg.y1 - ny * hw;
  const corners = [
    toClipSpace(ax, ay, displayWidth, displayHeight),
    toClipSpace(bx, by, displayWidth, displayHeight),
    toClipSpace(cx, cy, displayWidth, displayHeight),
    toClipSpace(ax, ay, displayWidth, displayHeight),
    toClipSpace(cx, cy, displayWidth, displayHeight),
    toClipSpace(dxp, dyp, displayWidth, displayHeight),
  ];
  for (let i = 0; i < 6; i++) {
    positions[(offset + i) * 2] = corners[i][0];
    positions[(offset + i) * 2 + 1] = corners[i][1];
    colors[(offset + i) * 4] = r;
    colors[(offset + i) * 4 + 1] = g;
    colors[(offset + i) * 4 + 2] = b;
    colors[(offset + i) * 4 + 3] = alpha;
  }
}

export function drawLightningGL(P: any): CanvasGradient | undefined {
  const {
    ctx, canvas, displayWidth, displayHeight, gradientColors,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioTrebleLevel,
    lightningBoltCount, lightningJitter, lightningBranchiness,
    lightningBoltsRef,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  if (!state || stateW !== displayWidth || stateH !== displayHeight) {
    state = initPersistentGL(displayWidth, displayHeight);
    stateW = displayWidth;
    stateH = displayHeight;
    lightningBoltsRef.current = [];
  }

  const lgAudio = isAudioEnabled && isAudioReactive;
  const bassBoost = lgAudio ? audioSubBassLevel * 0.6 : 0;
  const trebleBoost = lgAudio ? audioTrebleLevel * 0.4 : 0;

  drawFadeQuad(state, 0.32);

  const bolts = lightningBoltsRef.current;
  const count = Math.max(1, Math.min(8, Math.round(lightningBoltCount)));
  const spawnChance = (count / 45) * (1 + bassBoost * 5) + (bassBoost > 0.35 ? 0.35 : 0);
  if (Math.random() < spawnChance && bolts.length < count * 2) {
    const x1 = displayWidth * (0.1 + Math.random() * 0.8);
    const y1 = 0;
    const x2 = displayWidth * (0.1 + Math.random() * 0.8);
    const y2 = displayHeight;
    bolts.push({ life: 0, maxLife: 4 + Math.floor(Math.random() * 4), x1, y1, x2, y2, seed: Math.floor(Math.random() * 1e6) });
  }

  const jitterPx = Math.max(4, lightningJitter * displayWidth * 0.18);
  const branchiness = Math.max(0, Math.min(0.85, lightningBranchiness));

  // Collect every live bolt's segments once, then build both the glow pass
  // (thick, low alpha) and core pass (thin, bright) quad buffers from that
  // same segment list — matches the CPU path's two ctx.stroke() passes per
  // bolt over the same path.
  const allSegments: { segs: Segment[]; color: { r: number; g: number; b: number }; alpha: number }[] = [];
  for (let i = bolts.length - 1; i >= 0; i--) {
    const bolt = bolts[i];
    bolt.life += 1;
    if (bolt.life >= bolt.maxLife) {
      bolts.splice(i, 1);
      continue;
    }
    const t = bolt.life / bolt.maxLife;
    const alpha = Math.max(0, 1 - t * t) * (1 + trebleBoost * 0.5);
    const color = gradientColors[i % gradientColors.length] || { r: 200, g: 220, b: 255 };
    const segments: Segment[] = [];
    const seed = { v: (bolt.seed + bolt.life * 7919) % 233280 || 1 };
    buildBolt(bolt.x1, bolt.y1, bolt.x2, bolt.y2, jitterPx, branchiness, 7, segments, seed, 1);
    allSegments.push({ segs: segments, color, alpha });
  }

  const totalSegs = allSegments.reduce((sum, b) => sum + b.segs.length, 0);
  if (totalSegs > 0) {
    // Glow pass
    const glowPos = new Float32Array(totalSegs * 6 * 2);
    const glowCol = new Float32Array(totalSegs * 6 * 4);
    let off = 0;
    for (const b of allSegments) {
      for (const s of b.segs) {
        appendSegmentQuad(glowPos, glowCol, off, s, 10, b.color.r / 255, b.color.g / 255, b.color.b / 255, b.alpha * 0.4, displayWidth, displayHeight);
        off += 6;
      }
    }
    drawTriangles(state, glowPos, glowCol, totalSegs * 6);

    // Core pass
    const corePos = new Float32Array(totalSegs * 6 * 2);
    const coreCol = new Float32Array(totalSegs * 6 * 4);
    off = 0;
    for (const b of allSegments) {
      const cr = Math.min(255, b.color.r + 90) / 255;
      const cg = Math.min(255, b.color.g + 90) / 255;
      const cb = Math.min(255, b.color.b + 90) / 255;
      for (const s of b.segs) {
        appendSegmentQuad(corePos, coreCol, off, s, 2.2, cr, cg, cb, b.alpha, displayWidth, displayHeight);
        off += 6;
      }
    }
    drawTriangles(state, corePos, coreCol, totalSegs * 6);
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(state.canvas, 0, 0);
  return gradient;
}
