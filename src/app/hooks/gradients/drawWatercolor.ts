// Watercolor wash: a single cohesive cloud of translucent color blobs
// clustered tightly together and blurred via ctx.filter so they melt into
// one soft-edged mass (like reference watercolor splash art) instead of
// reading as separate scattered circles. A handful of small unblurred
// droplets are scattered around the edge for the "splash" look real
// watercolor references have. Each blob's shape/placement comes from a
// seeded PRNG keyed off its index so it stays fixed frame to frame --
// only the cluster's center drifts slowly via time.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawCloudBlob(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  color: { r: number; g: number; b: number }, alpha: number, rng: () => number,
) {
  const points = 9 + Math.floor(rng() * 5);
  const f1 = 2 + Math.floor(rng() * 2), f2 = 3 + Math.floor(rng() * 3);
  const p1 = rng() * Math.PI * 2, p2 = rng() * Math.PI * 2;

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const wobble = 1 + 0.3 * Math.sin(angle * f1 + p1) + 0.2 * Math.sin(angle * f2 + p2);
    const r = radius * Math.max(0.4, wobble);
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }

  ctx.globalAlpha = alpha;
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

export function drawWatercolor(P: any): CanvasGradient | undefined {
  const {
    ctx, centerX, centerY, displayWidth, displayHeight,
    gradientColors,
    watercolorAnimTime, watercolorBlobCount, watercolorBleedRadius, watercolorOpacity,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel,
  } = P;

  const audioActive = isAudioEnabled && isAudioReactive;
  const sizeBoost = audioActive ? 1 + (audioSubBassLevel / 5) * 0.3 : 1;
  const driftBoost = audioActive ? 1 + (audioMidsLevel / 5) * 0.8 : 1;

  const t = watercolorAnimTime * driftBoost;
  const numBlobs = Math.max(3, Math.min(Math.round(watercolorBlobCount), 15));
  const shortSide = Math.min(displayWidth, displayHeight);
  const clusterRadius = shortSide * 0.16 * sizeBoost;
  const blurPx = Math.max(4, watercolorBleedRadius * shortSide * 0.4);

  // Off-white paper base.
  ctx.fillStyle = '#faf8f4';
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  const clusterCx = centerX + Math.sin(t * 0.08) * shortSide * 0.04;
  const clusterCy = centerY + Math.cos(t * 0.06) * shortSide * 0.04;

  ctx.save();
  ctx.filter = `blur(${blurPx}px)`;
  for (let i = 0; i < numBlobs; i++) {
    const rng = mulberry32(i * 55511 + 7);
    // Tight cluster -- blobs overlap heavily so the blur melts them into one
    // cohesive cloud instead of several separate soft circles.
    const angle = rng() * Math.PI * 2;
    const dist = rng() * clusterRadius * 0.9;
    const bx = clusterCx + Math.cos(angle) * dist;
    const by = clusterCy + Math.sin(angle) * dist;
    const br = clusterRadius * (0.55 + rng() * 0.65);
    const color = gradientColors[i % gradientColors.length] || { r: 150, g: 180, b: 220 };
    drawCloudBlob(ctx, bx, by, br, color, watercolorOpacity * (0.7 + rng() * 0.5), rng);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.filter = 'none';

  // Small unblurred splash droplets scattered just outside the cloud edge.
  const dropletCount = Math.round(numBlobs * 1.5);
  for (let i = 0; i < dropletCount; i++) {
    const rng = mulberry32(i * 8123 + 991);
    const angle = rng() * Math.PI * 2;
    const dist = clusterRadius * (1.0 + rng() * 1.1);
    const dx = clusterCx + Math.cos(angle) * dist;
    const dy = clusterCy + Math.sin(angle) * dist;
    const dr = clusterRadius * (0.02 + rng() * 0.06);
    const color = gradientColors[i % gradientColors.length] || { r: 150, g: 180, b: 220 };
    ctx.globalAlpha = watercolorOpacity * (0.5 + rng() * 0.4);
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  return undefined;
}
