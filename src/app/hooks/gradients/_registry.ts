import { drawRadial } from './drawRadial';
import { drawAngle } from './drawAngle';
import { drawWindmill } from './drawWindmill';
import { drawShapes } from './drawShapes';
import { drawStack } from './drawStack';
import { drawHatch } from './drawHatch';
import { drawNoise } from './drawNoise';
import { drawStyleFieldCPU } from './drawStyleFieldCPU';
import { drawTopographic } from './drawTopographic';
import { drawJulia } from './drawJulia';
import { drawGrid } from './drawGrid';
import { drawRadialBurst } from './drawRadialBurst';
import { drawVoronoi } from './drawVoronoi';
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
import { drawStyleFieldGL, detectStyleFieldGLSupport, hasStyleFieldFailed, type StyleFieldId } from './drawStyleFieldGL';
import type { DrawCtx } from '../canvasDrawTypes';

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
function lazyGradient<T extends (P: DrawCtx) => CanvasGradient | undefined>(
  load: () => Promise<T>,
): (P: DrawCtx) => CanvasGradient | undefined {
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
    (P: DrawCtx) => {
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
    (P: DrawCtx) => {
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
    (P: DrawCtx) => {
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

function drawNoiseAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectNoiseGLSupport()) {
    try {
      return drawNoiseGL(P);
    } catch (err) {
      console.error('WebGL Noise failed, falling back to CPU:', err);
    }
  }
  return drawNoise(P);
}

function drawAngleAuto(P: DrawCtx): CanvasGradient | undefined {
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

function drawCausticsAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectCausticsGLSupport()) {
    try {
      return drawCausticsGL(P);
    } catch (err) {
      console.error('WebGL Caustics failed, falling back to CPU:', err);
    }
  }
  return drawCaustics(P);
}

function drawMarbleAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectMarbleGLSupport()) {
    try {
      return drawMarbleGL(P);
    } catch (err) {
      console.error('WebGL Marble failed, falling back to CPU:', err);
    }
  }
  return drawMarble(P);
}

function drawLavaLampAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectLavaLampGLSupport()) {
    try {
      return drawLavaLampGL(P);
    } catch (err) {
      console.error('WebGL Lava Lamp failed, falling back to CPU:', err);
    }
  }
  return drawLavaLamp(P);
}

function drawJuliaAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectJuliaGLSupport()) {
    try {
      return drawJuliaGL(P);
    } catch (err) {
      console.error('WebGL Julia failed, falling back to CPU:', err);
    }
  }
  return drawJulia(P);
}

function drawMetaballsAuto(P: DrawCtx): CanvasGradient | undefined {
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
function drawRadialBurstAuto(P: DrawCtx): CanvasGradient | undefined {
  if (P.radialBurstMode === 'sweep' && detectRadialBurstGLSupport()) {
    try {
      return drawRadialBurstSweepGL(P);
    } catch (err) {
      console.error('WebGL Radial Burst (sweep) failed, falling back to CPU:', err);
    }
  }
  return drawRadialBurst(P);
}

function drawTilingAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectTilingGLSupport()) {
    try {
      return drawTilingGL(P);
    } catch (err) {
      console.error('WebGL Tiling failed, falling back to CPU:', err);
    }
  }
  return drawTiling(P);
}

function drawTopographicAuto(P: DrawCtx): CanvasGradient | undefined {
  if (detectTopographicGLSupport()) {
    try {
      return drawTopographicGL(P);
    } catch (err) {
      console.error('WebGL Topographic failed, falling back to CPU:', err);
    }
  }
  return drawTopographic(P);
}

function drawVoronoiAuto(P: DrawCtx): CanvasGradient | undefined {
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
function drawWindmillAuto(P: DrawCtx): CanvasGradient | undefined {
  if (P.windmillMode === 'helix' && detectWindmillGLSupport()) {
    try {
      return drawWindmillHelixGL(P);
    } catch (err) {
      console.error('WebGL Windmill (helix) failed, falling back to CPU:', err);
    }
  }
  return drawWindmill(P);
}

// The styled-field gradients (Smoke, Glass, Mesh, ...) are WebGL-only. With
// no WebGL2, or if a style's shader won't compile on this device, they fall
// back to a CPU stand-in (drawStyleFieldCPU.ts: same family of picture, simpler math) — still animated and palette-driven — rather
// than leaving the canvas blank.
function styleFieldAuto(id: StyleFieldId, P: DrawCtx): CanvasGradient | undefined {
  if (!hasStyleFieldFailed(id) && detectStyleFieldGLSupport()) {
    try {
      return drawStyleFieldGL(id, P);
    } catch (err) {
      console.error(`WebGL ${id} failed, falling back to the CPU version:`, err);
    }
  }
  return drawStyleFieldCPU(id, P);
}

// Alphabetical by id — keep new entries sorted in.
export const GRADIENT_DRAW_FNS: Record<string, (P: DrawCtx) => CanvasGradient | undefined> = {
  'angle': drawAngleAuto,
  'attractor': drawAttractorLazy,
  'bokeh': (P) => styleFieldAuto('bokeh', P),
  'caustics': drawCausticsAuto,
  'contour': (P) => styleFieldAuto('contour', P),
  'curtains': (P) => styleFieldAuto('curtains', P),
  'drape': (P) => styleFieldAuto('drape', P),
  'eclipse': (P) => styleFieldAuto('eclipse', P),
  'edge-glow': (P) => styleFieldAuto('edge-glow', P),
  'fireworks': drawFireworksLazy,
  'flow-mesh': (P) => styleFieldAuto('flow-mesh', P),
  'flower': drawFlower,
  'glass': (P) => styleFieldAuto('glass', P),
  'grid': drawGrid,
  'hatch': drawHatch,
  'holographic': (P) => styleFieldAuto('holographic', P),
  'julia': drawJuliaAuto,
  'lava-lamp': drawLavaLampAuto,
  'light-beam': (P) => styleFieldAuto('light-beam', P),
  'lightning': drawLightningLazy,
  'marble': drawMarbleAuto,
  'mercury': (P) => styleFieldAuto('mercury', P),
  'ribbon': (P) => styleFieldAuto('ribbon', P),
  'strands': (P) => styleFieldAuto('strands', P),
  'iridescent': (P) => styleFieldAuto('iridescent', P),
  'embers': (P) => styleFieldAuto('embers', P),
  'bands': (P) => styleFieldAuto('bands', P),
  'sheen': (P) => styleFieldAuto('sheen', P),
  'mesh': (P) => styleFieldAuto('mesh', P),
  'metaballs': drawMetaballsAuto,
  'nebula': (P) => styleFieldAuto('nebula', P),
  'noise': drawNoiseAuto,
  'particles': drawParticlesLazy,
  'prism': (P) => styleFieldAuto('prism', P),
  'radial': drawRadial,
  'radial-burst': drawRadialBurstAuto,
  'raindrops': (P) => styleFieldAuto('raindrops', P),
  'rays': (P) => styleFieldAuto('rays', P),
  'reaction-diffusion': drawReactionDiffusionLazy,
  'shapes': drawShapes,
  'smoke': (P) => styleFieldAuto('smoke', P),
  'spectral': (P) => styleFieldAuto('spectral', P),
  'stack': drawStack,
  'tiling': drawTilingAuto,
  'topographic': drawTopographicAuto,
  'truchet': drawTruchet,
  'tunnel': (P) => styleFieldAuto('tunnel', P),
  'voronoi': drawVoronoiAuto,
  'vortex': (P) => styleFieldAuto('vortex', P),
  'waves': (P) => styleFieldAuto('waves', P),
  'windmill': drawWindmillAuto,
};
