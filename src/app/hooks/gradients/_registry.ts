import { drawRadial } from './drawRadial';
import { drawAngle } from './drawAngle';
import { drawPolarGrid } from './drawPolarGrid';
import { drawWindmill } from './drawWindmill';
import { drawWaves } from './drawWaves';
import { drawShapes } from './drawShapes';
import { drawFade } from './drawFade';
import { drawNoise } from './drawNoise';
import { drawTopographic } from './drawTopographic';
import { drawJulia } from './drawJulia';
import { drawPlasma } from './drawPlasma';
import { drawGrid } from './drawGrid';
import { drawRadialBurst } from './drawRadialBurst';
import { drawVoronoi } from './drawVoronoi';
import { drawIridescent } from './drawIridescent';
import { drawAurora } from './drawAurora';
import { drawCaustics } from './drawCaustics';
import { drawLavaLamp } from './drawLavaLamp';
import { drawMarble } from './drawMarble';
import { drawMetaballs } from './drawMetaballs';
import { drawTruchet } from './drawTruchet';
import { drawMoire } from './drawMoire';
import { drawFlowField } from './drawFlowField';
import { drawAttractor } from './drawAttractor';
import { drawReactionDiffusion } from './drawReactionDiffusion';
import { drawReactionDiffusionGL, detectRDGLSupport } from './drawReactionDiffusionGL';
import { drawFlower } from './drawFlower';
import { drawParticles } from './drawParticles';
import { drawTiling } from './drawTiling';

// Dispatches to the WebGL renderer when the browser/GPU can support it
// (checked once, memoized in detectRDGLSupport), otherwise the untouched,
// already-working CPU implementation — see drawReactionDiffusionGL.ts for
// what the capability check covers and why. Wrapped in a try/catch as a
// last-resort safety net: any unexpected WebGL failure mid-session (e.g. a
// context loss) falls back to the CPU path for that call rather than
// leaving the canvas blank.
function drawReactionDiffusionAuto(P: any): CanvasGradient | undefined {
  if (detectRDGLSupport()) {
    try {
      return drawReactionDiffusionGL(P);
    } catch (err) {
      console.error('WebGL Reaction-Diffusion failed, falling back to CPU:', err);
    }
  }
  return drawReactionDiffusion(P);
}

export const GRADIENT_DRAW_FNS: Record<string, (P: any) => CanvasGradient | undefined> = {
  'radial': drawRadial,
  'angle': drawAngle,
  'polar-grid': drawPolarGrid,
  'windmill': drawWindmill,
  'waves': drawWaves,
  'shapes': drawShapes,
  'fade': drawFade,
  'noise': drawNoise,
  'topographic': drawTopographic,
  'julia': drawJulia,
  'plasma': drawPlasma,
  'grid': drawGrid,
  'radial-burst': drawRadialBurst,
  'voronoi': drawVoronoi,
  'iridescent': drawIridescent,
  'aurora': drawAurora,
  'caustics': drawCaustics,
  'lava-lamp': drawLavaLamp,
  'marble': drawMarble,
  'metaballs': drawMetaballs,
  'truchet': drawTruchet,
  'moire': drawMoire,
  'flow-field': drawFlowField,
  'attractor': drawAttractor,
  'reaction-diffusion': drawReactionDiffusionAuto,
  'flower': drawFlower,
  'particles': drawParticles,
  'tiling': drawTiling,
};
