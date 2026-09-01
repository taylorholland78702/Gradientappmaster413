import { drawRadial } from './drawRadial';
import { drawAngle } from './drawAngle';
import { drawWindmill } from './drawWindmill';
import { drawShapes } from './drawShapes';
import { drawStack } from './drawStack';
import { drawHatch } from './drawHatch';
import { drawFade } from './drawFade';
import { drawNoise } from './drawNoise';
import { drawTopographic } from './drawTopographic';
import { drawJulia } from './drawJulia';
import { drawGrid } from './drawGrid';
import { drawRadialBurst } from './drawRadialBurst';
import { drawVoronoi } from './drawVoronoi';
import { drawAurora } from './drawAurora';
import { drawCaustics } from './drawCaustics';
import { drawLavaLamp } from './drawLavaLamp';
import { drawMarble } from './drawMarble';
import { drawMetaballs } from './drawMetaballs';
import { drawTruchet } from './drawTruchet';
import { drawNoiseGL, detectNoiseGLSupport } from './drawNoiseGL';
import { drawAngleGL, detectAngleGLSupport } from './drawAngleGL';
import { drawCausticsGL, detectCausticsGLSupport } from './drawCausticsGL';
import { drawMarbleGL, detectMarbleGLSupport } from './drawMarbleGL';
import { drawLavaLampGL, detectLavaLampGLSupport } from './drawLavaLampGL';
import { drawJuliaGL, detectJuliaGLSupport } from './drawJuliaGL';
import { drawMetaballsGL, detectMetaballsGLSupport } from './drawMetaballsGL';
import { drawRadialBurstSweepGL, detectRadialBurstGLSupport } from './drawRadialBurstGL';
import { drawTilingGL, detectTilingGLSupport } from './drawTilingGL';
import { drawTopographicGL, detectTopographicGLSupport } from './drawTopographicGL';
import { drawVoronoiGL, detectVoronoiGLSupport } from './drawVoronoiGL';
import { drawWindmillHelixGL, detectWindmillGLSupport } from './drawWindmillGL';
import { drawFlower } from './drawFlower';
import { drawTiling } from './drawTiling';
import { drawWaveInterference } from './drawWaveInterference';
import { drawMeshWireframe } from './drawMeshWireframe';

// Lazily code-split the heaviest, least-often-selected gradients (large
// simulation-based implementations that are rarely anyone's first pick —
// Reaction-Diffusion, Fireworks, and Lightning in particular pull in a
// second GL variant module each) out of the main bundle instead of
// statically importing all 28 gradients' code up front. Each dynamic
// import() kicks off immediately below (not deferred until first actual
// selection) so the chunk has almost always already arrived by the time a
// user picks one of these — this is purely about shrinking the critical-
// path bundle/parse time, not about deferring real work. Until a chunk
// resolves, its lazy wrapper returns undefined (same as any other gradient
// draw fn returning nothing for a frame) rather than throwing.
function lazyGradient<T extends (P: any) => CanvasGradient | undefined>( // eslint-disable-line @typescript-eslint/no-explicit-any
  load: () => Promise<T>,
): (P: any) => CanvasGradient | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
  let impl: T | null = null;
  load().then((fn) => { impl = fn; });
  return (P) => (impl ? impl(P) : undefined);
}

const drawAttractorLazy = lazyGradient(() => import('./drawAttractor').then((m) => m.drawAttractor));
const drawParticlesLazy = lazyGradient(() => import('./drawParticles').then((m) => m.drawParticles));

const drawReactionDiffusionLazy = lazyGradient(() =>
  Promise.all([import('./drawReactionDiffusion'), import('./drawReactionDiffusionGL')]).then(([cpu, gl]) =>
    // Same dispatch pattern as every other Auto wrapper in this file (see
    // drawAngleAuto etc. below) — WebGL when supported, CPU fallback on
    // any failure — just constructed once both chunks have arrived instead
    // of at module-load time.
    (P: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (gl.detectRDGLSupport()) {
        try {
          return gl.drawReactionDiffusionGL(P);
        } catch (err) {
          console.error('WebGL Reaction-Diffusion failed, falling back to CPU:', err);
        }
      }
      return cpu.drawReactionDiffusion(P);
    },
  ),
);

const drawFireworksLazy = lazyGradient(() =>
  Promise.all([import('./drawFireworks'), import('./drawFireworksGL')]).then(([cpu, gl]) =>
    (P: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (gl.detectFireworksGLSupport()) {
        try {
          return gl.drawFireworksGL(P);
        } catch (err) {
          console.error('WebGL Fireworks failed, falling back to CPU:', err);
        }
      }
      return cpu.drawFireworks(P);
    },
  ),
);

const drawLightningLazy = lazyGradient(() =>
  Promise.all([import('./drawLightning'), import('./drawLightningGL')]).then(([cpu, gl]) =>
    (P: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (gl.detectLightningGLSupport()) {
        try {
          return gl.drawLightningGL(P);
        } catch (err) {
          console.error('WebGL Lightning failed, falling back to CPU:', err);
        }
      }
      return cpu.drawLightning(P);
    },
  ),
);

function drawNoiseAuto(P: any): CanvasGradient | undefined {
  if (detectNoiseGLSupport()) {
    try {
      return drawNoiseGL(P);
    } catch (err) {
      console.error('WebGL Noise failed, falling back to CPU:', err);
    }
  }
  return drawNoise(P);
}

function drawAngleAuto(P: any): CanvasGradient | undefined {
  // Hard Edge has no GL implementation (the shader always blends) — skip
  // straight to the CPU path, which does implement it, rather than
  // silently rendering the smooth GL version with the toggle ignored.
  if (!P.angleHardEdge && detectAngleGLSupport()) {
    try {
      return drawAngleGL(P);
    } catch (err) {
      console.error('WebGL Angle failed, falling back to CPU:', err);
    }
  }
  return drawAngle(P);
}

function drawCausticsAuto(P: any): CanvasGradient | undefined {
  if (detectCausticsGLSupport()) {
    try {
      return drawCausticsGL(P);
    } catch (err) {
      console.error('WebGL Caustics failed, falling back to CPU:', err);
    }
  }
  return drawCaustics(P);
}

function drawMarbleAuto(P: any): CanvasGradient | undefined {
  if (detectMarbleGLSupport()) {
    try {
      return drawMarbleGL(P);
    } catch (err) {
      console.error('WebGL Marble failed, falling back to CPU:', err);
    }
  }
  return drawMarble(P);
}

function drawLavaLampAuto(P: any): CanvasGradient | undefined {
  if (detectLavaLampGLSupport()) {
    try {
      return drawLavaLampGL(P);
    } catch (err) {
      console.error('WebGL Lava Lamp failed, falling back to CPU:', err);
    }
  }
  return drawLavaLamp(P);
}

function drawJuliaAuto(P: any): CanvasGradient | undefined {
  if (detectJuliaGLSupport()) {
    try {
      return drawJuliaGL(P);
    } catch (err) {
      console.error('WebGL Julia failed, falling back to CPU:', err);
    }
  }
  return drawJulia(P);
}

function drawMetaballsAuto(P: any): CanvasGradient | undefined {
  if (detectMetaballsGLSupport()) {
    try {
      return drawMetaballsGL(P);
    } catch (err) {
      console.error('WebGL Metaballs failed, falling back to CPU:', err);
    }
  }
  return drawMetaballs(P);
}

// Only the 'sweep' submode has a genuine per-pixel loop worth porting — the
// default burst mode already composites via native canvas gradients (see
// drawRadialBurstGL.ts) — so this checks the mode before even attempting
// the GL path, unlike the other Auto wrappers here.
function drawRadialBurstAuto(P: any): CanvasGradient | undefined {
  if (P.radialBurstMode === 'sweep' && detectRadialBurstGLSupport()) {
    try {
      return drawRadialBurstSweepGL(P);
    } catch (err) {
      console.error('WebGL Radial Burst (sweep) failed, falling back to CPU:', err);
    }
  }
  return drawRadialBurst(P);
}

function drawTilingAuto(P: any): CanvasGradient | undefined {
  if (detectTilingGLSupport()) {
    try {
      return drawTilingGL(P);
    } catch (err) {
      console.error('WebGL Tiling failed, falling back to CPU:', err);
    }
  }
  return drawTiling(P);
}

function drawTopographicAuto(P: any): CanvasGradient | undefined {
  if (detectTopographicGLSupport()) {
    try {
      return drawTopographicGL(P);
    } catch (err) {
      console.error('WebGL Topographic failed, falling back to CPU:', err);
    }
  }
  return drawTopographic(P);
}

function drawVoronoiAuto(P: any): CanvasGradient | undefined {
  if (detectVoronoiGLSupport()) {
    try {
      return drawVoronoiGL(P);
    } catch (err) {
      console.error('WebGL Voronoi failed, falling back to CPU:', err);
    }
  }
  return drawVoronoi(P);
}

// Only the 'helix' submode has a genuine per-pixel loop worth porting —
// the default 'blades' mode already draws via vector paths, same reasoning
// as Radial Burst's sweep-only port above.
function drawWindmillAuto(P: any): CanvasGradient | undefined {
  if (P.windmillMode === 'helix' && detectWindmillGLSupport()) {
    try {
      return drawWindmillHelixGL(P);
    } catch (err) {
      console.error('WebGL Windmill (helix) failed, falling back to CPU:', err);
    }
  }
  return drawWindmill(P);
}

// Alphabetical by id — keep new entries sorted in.
export const GRADIENT_DRAW_FNS: Record<string, (P: any) => CanvasGradient | undefined> = {
  'angle': drawAngleAuto,
  'attractor': drawAttractorLazy,
  'aurora': drawAurora,
  'caustics': drawCausticsAuto,
  'fade': drawFade,
  'fireworks': drawFireworksLazy,
  'flower': drawFlower,
  'grid': drawGrid,
  'hatch': drawHatch,
  'julia': drawJuliaAuto,
  'lava-lamp': drawLavaLampAuto,
  'lightning': drawLightningLazy,
  'marble': drawMarbleAuto,
  'mesh-wireframe': drawMeshWireframe,
  'metaballs': drawMetaballsAuto,
  'noise': drawNoiseAuto,
  'particles': drawParticlesLazy,
  'radial': drawRadial,
  'radial-burst': drawRadialBurstAuto,
  'reaction-diffusion': drawReactionDiffusionLazy,
  'shapes': drawShapes,
  'stack': drawStack,
  'tiling': drawTilingAuto,
  'topographic': drawTopographicAuto,
  'truchet': drawTruchet,
  'voronoi': drawVoronoiAuto,
  'wave-interference': drawWaveInterference,
  'windmill': drawWindmillAuto,
};
