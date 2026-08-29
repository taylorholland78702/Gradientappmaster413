// Rocket bursts scattering particles into a persistent fading-trail buffer —
// same buffer/fade mechanic as Attractor/Flow Field, but the particles are
// short-lived (explode outward under gravity, fade, die) instead of an
// infinite walker, so this reads as actual explosive motion rather than an
// ambient drifting pattern. Bass hits trigger extra bursts; treble brightens
// sparkle. Drawn with fillRect per particle, not a pixel loop, so cost scales
// with particle count, not canvas resolution.
export function drawFireworks(P: any): CanvasGradient | undefined {
  const {
    ctx,
    canvas,
    displayWidth,
    displayHeight,
    gradientColors,
    isAudioEnabled,
    isAudioReactive,
    audioSubBassLevel,
    audioMidsLevel,
    audioTrebleLevel,
    fireworksCount,
    fireworksParticleCount,
    fireworksTrailFade,
    fireworksBufferRef,
    fireworksParticlesRef,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  if (!fireworksBufferRef.current || fireworksBufferRef.current.width !== displayWidth || fireworksBufferRef.current.height !== displayHeight) {
    fireworksBufferRef.current = document.createElement('canvas');
    fireworksBufferRef.current.width = displayWidth;
    fireworksBufferRef.current.height = displayHeight;
    fireworksParticlesRef.current = [];
  }
  const fwCtx = fireworksBufferRef.current.getContext('2d')!;
  const fwAudio = isAudioEnabled && isAudioReactive;
  const bassBoost = fwAudio ? audioSubBassLevel * 0.6 : 0;
  const trebleBoost = fwAudio ? audioTrebleLevel * 0.5 : 0;
  const midsBoost = fwAudio ? audioMidsLevel * 0.3 : 0;

  fwCtx.fillStyle = `rgba(0,0,0,${Math.max(0.02, Math.min(1, fireworksTrailFade))})`;
  fwCtx.fillRect(0, 0, displayWidth, displayHeight);

  const particles = fireworksParticlesRef.current;
  const count = Math.max(1, Math.min(30, Math.round(fireworksCount)));
  const perBurst = Math.max(8, Math.min(400, Math.round(fireworksParticleCount)));

  // Spawn chance scales with how many rocket "slots" are configured and
  // spikes hard on a bass hit — a quiet section still launches occasionally
  // so the gradient never looks fully dormant.
  const spawnChance = (count / 130) * (1 + bassBoost * 4) + (bassBoost > 0.3 ? 0.2 : 0);
  if (Math.random() < spawnChance && particles.length < 3200) {
    const launchX = displayWidth * (0.15 + Math.random() * 0.7);
    const launchY = displayHeight * (0.15 + Math.random() * 0.55);
    const speed = Math.min(displayWidth, displayHeight) * (0.009 + Math.random() * 0.011) * (1 + trebleBoost);
    // Store a color index rather than a frozen r/g/b — particles live for
    // 45-80 frames (~0.75-1.3s), and baking the resolved RGB in here meant
    // a Color-tab shuffle/adjustment had no visible effect on anything
    // already in flight, only on the next burst. Re-resolving from the
    // live gradientColors array in the render loop below fixes that, same
    // pattern drawParticles.ts/drawLightning.ts already use.
    const colorIndex = Math.floor(Math.random() * gradientColors.length);
    for (let i = 0; i < perBurst; i++) {
      const angle = (i / perBurst) * Math.PI * 2 + Math.random() * 0.3;
      const spread = speed * (0.6 + Math.random() * 0.5);
      particles.push({
        x: launchX, y: launchY,
        vx: Math.cos(angle) * spread,
        vy: Math.sin(angle) * spread,
        life: 1,
        maxLife: 45 + Math.random() * 35,
        colorIndex,
      });
    }
  }

  const gravity = Math.min(displayWidth, displayHeight) * 0.00018;
  const dotBase = Math.max(0.5, 2.2 + midsBoost * 2);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += gravity;
    p.vx *= 0.988;
    p.vy *= 0.988;
    p.life += 1;
    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
      continue;
    }
    const t = p.life / p.maxLife;
    const alpha = Math.max(0, 1 - t) * 0.95;
    const size = dotBase * (1 - t * 0.5);
    const c = gradientColors[p.colorIndex % gradientColors.length] || { r: 255, g: 255, b: 255 };
    fwCtx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
    fwCtx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
  }

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(fireworksBufferRef.current, 0, 0);
  return gradient;
}
