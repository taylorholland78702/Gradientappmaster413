// Paint splotches: drawn as actual vector shapes (not a per-pixel distance
// field like the other new gradients) on a white canvas, matching real
// paint-splatter reference photos -- irregular spiky-edged blobs, small
// satellite droplets flung nearby, and thin tapered drip trails, all in
// flat saturated color. Each splotch's shape/droplets/drips come from a
// seeded PRNG keyed off its index so they stay fixed frame to frame (only
// the splotch's center drifts via time) -- re-rolling Math.random() every
// frame would make the jagged edges crawl/flicker instead of read as
// static dried paint.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawSplatShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, roughness: number,
  color: { r: number; g: number; b: number }, rng: () => number,
) {
  const points = 10 + Math.floor(rng() * 6);
  // A handful of low-frequency components (smooth bulges) plus one
  // high-frequency component (spiky jitter) reads as an irregular splat
  // outline rather than either a smooth blob or pure noise.
  const f1 = 2 + Math.floor(rng() * 2), f2 = 4 + Math.floor(rng() * 3), f3 = 9 + Math.floor(rng() * 5);
  const p1 = rng() * Math.PI * 2, p2 = rng() * Math.PI * 2, p3 = rng() * Math.PI * 2;

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wobble = 1 + roughness * (
      0.45 * Math.sin(angle * f1 + p1) +
      0.3 * Math.sin(angle * f2 + p2) +
      0.25 * Math.sin(angle * f3 + p3)
    );
    const r = radius * Math.max(0.15, wobble);
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  // Curve through the midpoint of each edge, using the actual vertex as the
  // quadratic control point -- turns the polygon into a smooth-but-irregular
  // blob outline instead of a faceted one, closer to how dried paint pools.
  ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
  ctx.beginPath();
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const startMid = mid(pts[points - 1], pts[0]);
  ctx.moveTo(startMid.x, startMid.y);
  for (let i = 0; i < points; i++) {
    const next = pts[(i + 1) % points];
    const m = mid(pts[i], next);
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, m.x, m.y);
  }
  ctx.closePath();
  ctx.fill();
}

export function drawSplotches(P: any): CanvasGradient | undefined {
  const {
    ctx, centerX, centerY, displayWidth, displayHeight,
    gradientColors,
    splotchesAnimTime, splotchCount, splotchSize, splotchEdgeRoughness,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel,
  } = P;

  const audioActive = isAudioEnabled && isAudioReactive;
  const bassBoost = audioActive ? 1 + (audioSubBassLevel / 5) * 0.6 : 1;
  const driftBoost = audioActive ? 1 + (audioMidsLevel / 5) * 1.2 : 1;

  const t = splotchesAnimTime * driftBoost;
  const numSplotches = Math.max(2, Math.min(Math.round(splotchCount), 20));
  const baseRadius = Math.min(displayWidth, displayHeight) * splotchSize * bassBoost;

  // Off-white canvas, like a painted card/paper rather than a flat white fill.
  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  for (let i = 0; i < numSplotches; i++) {
    const rng = mulberry32(i * 92821 + 17);
    const angle = (i / numSplotches) * Math.PI * 2 + t * (0.08 + (i % 3) * 0.03);
    const orbitR = 0.18 + 0.24 * Math.sin(t * 0.15 + i * 1.7);
    const cx = centerX + displayWidth * orbitR * Math.cos(angle);
    const cy = centerY + displayHeight * orbitR * Math.sin(angle * 0.8 + t * 0.05);
    const color = gradientColors[i % gradientColors.length] || { r: 40, g: 40, b: 40 };
    const radius = baseRadius * (0.55 + rng() * 0.9);

    drawSplatShape(ctx, cx, cy, radius, splotchEdgeRoughness, color, rng);

    // Satellite droplets flung out from the main splat.
    const dropletCount = 3 + Math.floor(rng() * 5);
    for (let d = 0; d < dropletCount; d++) {
      const dAngle = rng() * Math.PI * 2;
      const dDist = radius * (1.1 + rng() * 1.8);
      const dr = radius * (0.04 + rng() * 0.14);
      const dx = cx + Math.cos(dAngle) * dDist;
      const dy = cy + Math.sin(dAngle) * dDist;
      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thin tapered drip trails flicked out from the splat edge.
    const dripCount = 1 + Math.floor(rng() * 3);
    for (let dr2 = 0; dr2 < dripCount; dr2++) {
      const dripAngle = rng() * Math.PI * 2;
      const dripLen = radius * (1.5 + rng() * 2.5);
      const bend = (rng() - 0.5) * 0.6;
      const startX = cx + Math.cos(dripAngle) * radius * 0.8;
      const startY = cy + Math.sin(dripAngle) * radius * 0.8;
      const midX = cx + Math.cos(dripAngle + bend) * dripLen * 0.5;
      const midY = cy + Math.sin(dripAngle + bend) * dripLen * 0.5;
      const endX = cx + Math.cos(dripAngle + bend * 1.6) * dripLen;
      const endY = cy + Math.sin(dripAngle + bend * 1.6) * dripLen;
      const startWidth = radius * 0.12;

      ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.lineCap = 'round';
      // Taper by stroking the same curve multiple times with shrinking width.
      const taperSteps = 5;
      for (let s = 0; s < taperSteps; s++) {
        const tt = s / (taperSteps - 1);
        ctx.lineWidth = Math.max(0.5, startWidth * (1 - tt) * 0.9);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, startX + (endX - startX) * (0.3 + tt * 0.7), startY + (endY - startY) * (0.3 + tt * 0.7));
        ctx.stroke();
      }
    }
  }

  return undefined;
}
