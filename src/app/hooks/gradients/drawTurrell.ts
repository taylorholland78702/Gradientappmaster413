// James Turrell: a full-bleed field of light with no visible source and no
// findable gradient stop. Crosses the palette in sequence over minutes, not
// seconds, and the one soft glow it has breathes on a heavily-smoothed
// sub-bass level (an EMA in turrellSmoothRef) rather than reacting frame to
// frame — the whole point is that nothing here should read as "reactive."
export function drawTurrell(P: any): CanvasGradient | undefined {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    gradientColors,
    isAudioEnabled,
    isAudioReactive,
    audioSubBassLevel,
    turrellAnimTime,
    turrellGlow,
    turrellSmoothRef,
  } = P;
  let gradient: CanvasGradient | undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;
  if (!gradientColors || gradientColors.length === 0) return gradient;

  const audioActive = isAudioEnabled && isAudioReactive;
  const rawLevel = audioActive ? audioSubBassLevel : 0;
  if (turrellSmoothRef) {
    turrellSmoothRef.current += (rawLevel - turrellSmoothRef.current) * 0.01;
  }
  const smoothLevel = turrellSmoothRef ? turrellSmoothRef.current : 0;

  const totalColors = gradientColors.length;
  const cyclePos = ((turrellAnimTime % totalColors) + totalColors) % totalColors;
  const colorIndex = Math.floor(cyclePos);
  const nextIndex = (colorIndex + 1) % totalColors;
  const blend = cyclePos - colorIndex;
  const current = gradientColors[colorIndex];
  const next = gradientColors[nextIndex] || current;
  if (!current) return gradient;

  const r = Math.round(current.r + (next.r - current.r) * blend);
  const g = Math.round(current.g + (next.g - current.g) * blend);
  const b = Math.round(current.b + (next.b - current.b) * blend);

  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, displayWidth, displayHeight);

  // A single, oversized, very soft radial wash — no visible ring, no
  // findable gradient stop — its brightness breathing gently with the
  // smoothed sub-bass. This is the entire "light with no apparent source"
  // effect; skip it outright when Glow is dialed to zero.
  if (turrellGlow > 0.001) {
    const cx = displayWidth / 2;
    const cy = displayHeight / 2;
    const radius = Math.max(displayWidth, displayHeight) * 1.1;
    const glowStrength = turrellGlow * (0.15 + smoothLevel * 0.5);
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    glow.addColorStop(0, `rgba(255,255,255,${glowStrength})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
  }

  return gradient;
}
