// Recursive midpoint-displacement bolts — classic fractal-lightning
// construction: split a segment at its midpoint, offset that midpoint
// perpendicular to the segment by a shrinking random amount, recurse on
// both halves, occasionally forking off a shorter side-branch. Drawn as
// vector strokes (thick low-alpha glow pass + thin bright core pass) into
// the same persistent fading-trail buffer as Attractor/Fireworks, but with
// a fast fade so bolts read as a strike-and-vanish flash rather than a
// lingering trail. Bass hits trigger extra simultaneous strikes.
function buildBolt(x1: number, y1: number, x2: number, y2: number, displacement: number, branchiness: number, depth: number, segments: { x1: number; y1: number; x2: number; y2: number; w: number }[], seed: { v: number }, weight: number) {
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

export function drawLightning(P: any): CanvasGradient | undefined {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    gradientColors,
    isAudioEnabled,
    isAudioReactive,
    audioSubBassLevel,
    audioTrebleLevel,
    lightningBoltCount,
    lightningJitter,
    lightningBranchiness,
    lightningBufferRef,
    lightningBoltsRef,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  if (!lightningBufferRef.current || lightningBufferRef.current.width !== displayWidth || lightningBufferRef.current.height !== displayHeight) {
    lightningBufferRef.current = document.createElement('canvas');
    lightningBufferRef.current.width = displayWidth;
    lightningBufferRef.current.height = displayHeight;
    lightningBoltsRef.current = [];
  }
  const lgCtx = lightningBufferRef.current.getContext('2d')!;
  const lgAudio = isAudioEnabled && isAudioReactive;
  const bassBoost = lgAudio ? audioSubBassLevel * 0.6 : 0;
  const trebleBoost = lgAudio ? audioTrebleLevel * 0.4 : 0;

  // Fast fade — a strike-and-vanish flash, not a lingering trail.
  lgCtx.fillStyle = 'rgba(0,0,0,0.32)';
  lgCtx.fillRect(0, 0, displayWidth, displayHeight);

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
    const segments: { x1: number; y1: number; x2: number; y2: number; w: number }[] = [];
    // Re-seeded (not fixed) each frame the bolt is alive, so it flickers
    // between slightly different jitter paths rather than sitting static —
    // reads as an electrical crackle instead of a frozen line.
    const seed = { v: (bolt.seed + bolt.life * 7919) % 233280 || 1 };
    buildBolt(bolt.x1, bolt.y1, bolt.x2, bolt.y2, jitterPx, branchiness, 7, segments, seed, 1);

    lgCtx.lineCap = 'round';
    // Glow pass (thick, low alpha) then core pass (thin, bright) — cheap
    // stand-in for a true blur-based glow.
    lgCtx.strokeStyle = `rgba(${color.r},${color.g},${color.b},${alpha * 0.4})`;
    lgCtx.lineWidth = 10;
    lgCtx.beginPath();
    for (const s of segments) { lgCtx.moveTo(s.x1, s.y1); lgCtx.lineTo(s.x2, s.y2); }
    lgCtx.stroke();

    lgCtx.strokeStyle = `rgba(${Math.min(255, color.r + 90)},${Math.min(255, color.g + 90)},${Math.min(255, color.b + 90)},${alpha})`;
    lgCtx.lineWidth = 2.2;
    lgCtx.beginPath();
    for (const s of segments) { lgCtx.moveTo(s.x1, s.y1); lgCtx.lineTo(s.x2, s.y2); }
    lgCtx.stroke();
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(lightningBufferRef.current, 0, 0);
  return gradient;
}
