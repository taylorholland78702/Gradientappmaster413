export function applyStir(P: any): void {
  const {
    ctx, canvas, displayWidth, displayHeight, gradientColors,
    stirBufferRef, stirPointerRef, stirLastPointRef,
    stirBrushSize, stirDecay, stirIntensity,
  } = P;
  // Cursor/finger "stir" trails: wherever you move the pointer, a soft
  // colorful stroke gets deposited into a persistent buffer and left to
  // fade — same buffer/fade pattern as Attractor/Flow Field/Chromatic
  // Trails, just driven by real pointer position instead of a simulation.
  // The pointer position itself is updated by a window pointermove listener
  // in InteractiveGradient.tsx (only attached while this effect is active),
  // not here — this function only ever reads stirPointerRef, never touches
  // DOM event listeners.
  if (canvas.width === 0 || canvas.height === 0) return;
  if (!stirBufferRef.current || stirBufferRef.current.width !== displayWidth || stirBufferRef.current.height !== displayHeight) {
    stirBufferRef.current = document.createElement('canvas');
    stirBufferRef.current.width = displayWidth;
    stirBufferRef.current.height = displayHeight;
  }
  const buf = stirBufferRef.current;
  const bctx = buf.getContext('2d')!;

  // Fade the existing trail — destination-out with a low alpha erases a
  // fraction of what's there rather than clearing it outright, so old
  // strokes dissolve gradually instead of popping off.
  bctx.globalCompositeOperation = 'destination-out';
  bctx.fillStyle = `rgba(0,0,0,${stirDecay})`;
  bctx.fillRect(0, 0, displayWidth, displayHeight);
  bctx.globalCompositeOperation = 'source-over';

  const p = stirPointerRef.current;
  if (p && p.active) {
    const from = stirLastPointRef.current;
    const dx = from ? p.x - from.x : 0, dy = from ? p.y - from.y : 0;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Only deposit paint when the pointer has actually moved since the last
    // frame — without this check, a cursor that moves once and then sits
    // still (common: real pointermove events stop firing once idle, but
    // there's no "stopped" event to clear stirLastPointRef) would keep
    // redepositing a fresh dot at the same spot every frame forever,
    // fighting the fade and leaving a stuck glow instead of a trail that
    // settles once you stop stirring.
    if (!from || dist > 0.5) {
      const origin = from || p;
      // Stamp soft circles along the from->to segment so fast movement
      // leaves a continuous stroke instead of isolated dots with gaps.
      const steps = Math.max(1, Math.ceil(dist / Math.max(4, stirBrushSize * 0.25)));
      const paletteLen = gradientColors.length || 1;
      const hueBase = (performance.now() / 900) % paletteLen;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = origin.x + dx * t;
        const y = origin.y + dy * t;
        const huePos = (hueBase + t) % paletteLen;
        const c0 = gradientColors[Math.floor(huePos) % paletteLen] || { r: 255, g: 255, b: 255 };
        const c1 = gradientColors[Math.floor(huePos + 1) % paletteLen] || c0;
        const frac = huePos - Math.floor(huePos);
        const r = Math.round(c0.r + (c1.r - c0.r) * frac);
        const g = Math.round(c0.g + (c1.g - c0.g) * frac);
        const b = Math.round(c0.b + (c1.b - c0.b) * frac);
        const grad = bctx.createRadialGradient(x, y, 0, x, y, stirBrushSize);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${stirIntensity})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        bctx.fillStyle = grad;
        bctx.beginPath();
        bctx.arc(x, y, stirBrushSize, 0, Math.PI * 2);
        bctx.fill();
      }
      stirLastPointRef.current = { x: p.x, y: p.y };
    }
  } else {
    stirLastPointRef.current = null;
  }

  // 'screen' blends the trail in as light rather than flatly overpainting
  // the gradient underneath, keeping the base pattern visible through it.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.drawImage(buf, 0, 0);
  ctx.restore();
}
