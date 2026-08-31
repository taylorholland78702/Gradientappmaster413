// Draws one particle as a small line (sides=1), circle (sides=2), or
// regular polygon (sides 3-8, triangle through octagon) inscribed in a
// circle of radius `size`. pCtx.fillStyle is assumed already set by the
// caller.
function drawParticleShape(pCtx: CanvasRenderingContext2D, x: number, y: number, size: number, sides: number): void {
  const n = Math.round(sides);
  if (n <= 1) {
    pCtx.beginPath();
    pCtx.moveTo(x - size, y);
    pCtx.lineTo(x + size, y);
    pCtx.strokeStyle = pCtx.fillStyle as string;
    pCtx.lineWidth = Math.max(1, size * 0.4);
    pCtx.stroke();
    return;
  }
  if (n === 2) {
    pCtx.beginPath();
    pCtx.arc(x, y, size, 0, Math.PI * 2);
    pCtx.fill();
    return;
  }
  pCtx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const vx = x + Math.cos(angle) * size;
    const vy = y + Math.sin(angle) * size;
    if (i === 0) pCtx.moveTo(vx, vy);
    else pCtx.lineTo(vx, vy);
  }
  pCtx.closePath();
  pCtx.fill();
}

export function drawParticles(P: any): CanvasGradient | undefined {
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
    particlesCount,
    particlesSpeed,
    particlesSize,
    particlesTrail,
    particlesGravity,
    particlesSides,
    particlesBufferRef,
    particlesPointsRef,
    particlesMode,
    flowScale,
    flowThickness,
    flowParticleCount,
    flowAnimTime,
    flowBufferRef,
    flowParticlesRef,
  } = P;
  let gradient: CanvasGradient | undefined;
          if (canvas.width === 0 || canvas.height === 0) return gradient;

          if (particlesMode === 'flow-field') {
            // Former standalone Flow Field gradient, folded in as a
            // Particles mode: particles drift along a smoothly-varying
            // pseudo-noise direction field, leaving fading trails in a
            // persistent buffer — the only mode in this app whose motion
            // drifts rather than rotates/pulses/orbits, so kept as its own
            // distinct particle system (its own buffer/point refs, its own
            // fixed 0.06 trail fade) rather than folded into the drift
            // mode's velocity+gravity model above.
            if (!flowBufferRef.current || flowBufferRef.current.width !== displayWidth || flowBufferRef.current.height !== displayHeight) {
              flowBufferRef.current = document.createElement('canvas');
              flowBufferRef.current.width = displayWidth;
              flowBufferRef.current.height = displayHeight;
              flowParticlesRef.current = [];
            }
            const fbCtx = flowBufferRef.current.getContext('2d')!;
            const flowTargetCount = Math.max(10, Math.min(1000, flowParticleCount));
            const flowParticles = flowParticlesRef.current;
            while (flowParticles.length < flowTargetCount) {
              flowParticles.push({ x: Math.random() * displayWidth, y: Math.random() * displayHeight });
            }
            if (flowParticles.length > flowTargetCount) flowParticles.length = flowTargetCount;

            // Bass speeds up particle drift (longer step per frame), treble
            // thickens the trail stroke — energy would work too but bass
            // reads as more physical for "the flow surges."
            const flowAudio = isAudioEnabled && isAudioReactive;
            const flowSpeedMod = flowAudio ? 1 + audioSubBassLevel * 1.2 : 1;
            const flowThicknessMod = flowAudio ? 1 + audioTrebleLevel * 0.8 : 1;
            fbCtx.fillStyle = 'rgba(0,0,0,0.06)';
            fbCtx.fillRect(0, 0, displayWidth, displayHeight);
            const fScale = flowScale * 0.004;
            const fTime = flowAnimTime;
            for (let i = 0; i < flowParticles.length; i++) {
              const p = flowParticles[i];
              const angle = (Math.sin(p.x * fScale + fTime) * Math.cos(p.y * fScale - fTime * 0.8)
                + Math.sin((p.x + p.y) * fScale * 0.5 + fTime * 0.5)) * Math.PI;
              const nx = p.x + Math.cos(angle) * 1.5 * flowSpeedMod;
              const ny = p.y + Math.sin(angle) * 1.5 * flowSpeedMod;
              const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
              fbCtx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
              fbCtx.lineWidth = flowThickness * flowThicknessMod;
              fbCtx.beginPath();
              fbCtx.moveTo(p.x, p.y);
              fbCtx.lineTo(nx, ny);
              fbCtx.stroke();
              p.x = nx < 0 ? displayWidth : nx > displayWidth ? 0 : nx;
              p.y = ny < 0 ? displayHeight : ny > displayHeight ? 0 : ny;
            }
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, displayWidth, displayHeight);
            ctx.drawImage(flowBufferRef.current, 0, 0);
            return gradient;
          }

          // Generic spawn/drift particle system — Attractor is specialized
          // (strange-attractor lace), this is the general-purpose "floating
          // points with trails" look. Same persistent fading-trail-buffer
          // technique as Attractor/Flow Field mode above.
          if (!particlesBufferRef.current || particlesBufferRef.current.width !== displayWidth || particlesBufferRef.current.height !== displayHeight) {
            particlesBufferRef.current = document.createElement('canvas');
            particlesBufferRef.current.width = displayWidth;
            particlesBufferRef.current.height = displayHeight;
            particlesPointsRef.current = [];
          }
          const pCtx = particlesBufferRef.current.getContext('2d')!;
          const targetCount = Math.max(1, Math.min(500, Math.round(particlesCount)));
          const points = particlesPointsRef.current;
          const spawn = () => ({
            x: Math.random() * displayWidth,
            y: Math.random() * displayHeight,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
          });
          while (points.length < targetCount) points.push(spawn());
          if (points.length > targetCount) points.length = targetCount;

          const pAudio = isAudioEnabled && isAudioReactive;
          const audioSpeedBoost = pAudio ? 1 + audioSubBassLevel * 1.5 : 1;
          const audioSizeBoost = pAudio ? 1 + audioTrebleLevel * 0.5 : 1;
          const speed = particlesSpeed * audioSpeedBoost;
          const size = Math.max(0.5, particlesSize) * audioSizeBoost;
          const cx = displayWidth / 2, cy = displayHeight / 2;
          const gravity = particlesGravity ?? 0;

          pCtx.fillStyle = `rgba(0,0,0,${particlesTrail})`;
          pCtx.fillRect(0, 0, displayWidth, displayHeight);

          for (let i = 0; i < points.length; i++) {
            const p = points[i];
            if (gravity > 0) {
              const dx = cx - p.x, dy = cy - p.y;
              const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
              p.vx += (dx / dist) * gravity * 0.02;
              p.vy += (dy / dist) * gravity * 0.02;
            }
            p.x += p.vx * speed;
            p.y += p.vy * speed;
            // Wrap at edges rather than clamp/reflect — keeps density even
            // instead of piling particles up against a boundary.
            if (p.x < 0) p.x += displayWidth;
            if (p.x >= displayWidth) p.x -= displayWidth;
            if (p.y < 0) p.y += displayHeight;
            if (p.y >= displayHeight) p.y -= displayHeight;

            const color = gradientColors[i % gradientColors.length] || { r: 255, g: 255, b: 255 };
            pCtx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.85)`;
            drawParticleShape(pCtx, p.x, p.y, size, particlesSides ?? 2);
          }

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.drawImage(particlesBufferRef.current, 0, 0);
  return gradient;
}
