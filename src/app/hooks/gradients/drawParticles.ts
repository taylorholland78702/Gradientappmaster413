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
    particlesBufferRef,
    particlesPointsRef,
  } = P;
  let gradient: CanvasGradient | undefined;
          // Generic spawn/drift particle system — Flow Field and Attractor
          // are both specialized (vector-field strokes, strange-attractor
          // lace), this is the general-purpose "floating points with
          // trails" look that's otherwise missing. Same persistent
          // fading-trail-buffer technique as Attractor/Flow Field.
          if (canvas.width === 0 || canvas.height === 0) return gradient;
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
            pCtx.beginPath();
            pCtx.arc(p.x, p.y, size, 0, Math.PI * 2);
            pCtx.fill();
          }

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, displayWidth, displayHeight);
          ctx.drawImage(particlesBufferRef.current, 0, 0);
  return gradient;
}
