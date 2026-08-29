// WebGL2 renderer for Fireworks — see the CPU version (drawFireworks.ts)
// for the reference implementation and the simulation this replicates
// exactly (same spawn/physics/life math, same fireworksParticlesRef state,
// so switching between the GL and CPU renderer mid-session doesn't lose or
// reset the particles in flight). Only the DRAWING moves to the GPU: each
// particle becomes a GL point sprite instead of a ctx.fillRect call, and
// the persistent fade-trail buffer is a WebGL canvas with
// preserveDrawingBuffer instead of a 2D canvas (see glParticleShared.ts).
//
// The CPU version's 3200-particle cap exists because canvas-API call
// overhead (a fillStyle string allocation + fillRect per particle) is the
// bottleneck, not the particle simulation itself (simple O(n) physics,
// cheap even at tens of thousands). Removing that per-particle draw-call
// cost is the whole point of this port, so the cap goes up substantially
// alongside it — MAX_PARTICLES below, not the CPU version's 3200.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { initPersistentGL, detectParticleGLSupport, drawFadeQuad, drawPoints, toClipSpace, PersistentGLState } from './glParticleShared';

const MAX_PARTICLES = 20000;

let state: PersistentGLState | null = null;
let stateW = 0, stateH = 0;

export function detectFireworksGLSupport(): boolean {
  return detectParticleGLSupport();
}

export function drawFireworksGL(P: any): CanvasGradient | undefined {
  const {
    ctx, canvas, displayWidth, displayHeight, gradientColors,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
    fireworksCount, fireworksParticleCount, fireworksTrailFade,
    fireworksParticlesRef,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  if (!state || stateW !== displayWidth || stateH !== displayHeight) {
    state = initPersistentGL(displayWidth, displayHeight);
    stateW = displayWidth;
    stateH = displayHeight;
    fireworksParticlesRef.current = [];
  }

  const fwAudio = isAudioEnabled && isAudioReactive;
  const bassBoost = fwAudio ? audioSubBassLevel * 0.6 : 0;
  const trebleBoost = fwAudio ? audioTrebleLevel * 0.5 : 0;
  const midsBoost = fwAudio ? audioMidsLevel * 0.3 : 0;

  drawFadeQuad(state, Math.max(0.02, Math.min(1, fireworksTrailFade)));

  const particles = fireworksParticlesRef.current;
  const count = Math.max(1, Math.min(30, Math.round(fireworksCount)));
  const perBurst = Math.max(8, Math.min(400, Math.round(fireworksParticleCount)));

  const spawnChance = (count / 130) * (1 + bassBoost * 4) + (bassBoost > 0.3 ? 0.2 : 0);
  if (Math.random() < spawnChance && particles.length < MAX_PARTICLES - perBurst) {
    const launchX = displayWidth * (0.15 + Math.random() * 0.7);
    const launchY = displayHeight * (0.15 + Math.random() * 0.55);
    const speed = Math.min(displayWidth, displayHeight) * (0.009 + Math.random() * 0.011) * (1 + trebleBoost);
    // colorIndex, not a frozen r/g/b — see the matching comment in
    // drawFireworks.ts (the CPU version this mirrors, sharing the same
    // fireworksParticlesRef). Freezing the resolved RGB here meant a
    // Color-tab shuffle/adjustment had no visible effect on particles
    // already in flight.
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

  const positions = new Float32Array(particles.length * 2);
  const colors = new Float32Array(particles.length * 4);
  const sizes = new Float32Array(particles.length);
  let n = 0;
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
    const [cx, cy] = toClipSpace(p.x, p.y, displayWidth, displayHeight);
    positions[n * 2] = cx;
    positions[n * 2 + 1] = cy;
    const c = gradientColors[p.colorIndex % gradientColors.length] || { r: 255, g: 255, b: 255 };
    colors[n * 4] = c.r / 255;
    colors[n * 4 + 1] = c.g / 255;
    colors[n * 4 + 2] = c.b / 255;
    colors[n * 4 + 3] = alpha;
    sizes[n] = size;
    n++;
  }
  drawPoints(state, positions, colors, sizes, n);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(state.canvas, 0, 0);
  return gradient;
}
