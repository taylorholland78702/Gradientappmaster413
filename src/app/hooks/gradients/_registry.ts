import { drawRadial } from './drawRadial';
import { drawAngle } from './drawAngle';
import { drawPolarGrid } from './drawPolarGrid';
import { drawWindmill } from './drawWindmill';
import { drawShapes } from './drawShapes';
import { drawFade } from './drawFade';
import { drawNoise } from './drawNoise';
import { drawTopographic } from './drawTopographic';
import { drawJulia } from './drawJulia';
import { drawPlasma } from './drawPlasma';
import { drawGrid } from './drawGrid';
import { drawRadialBurst } from './drawRadialBurst';
import { drawVoronoi } from './drawVoronoi';
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
import { drawPlasmaGL, detectPlasmaGLSupport } from './drawPlasmaGL';
import { drawNoiseGL, detectNoiseGLSupport } from './drawNoiseGL';
import { drawAngleGL, detectAngleGLSupport } from './drawAngleGL';
import { drawCausticsGL, detectCausticsGLSupport } from './drawCausticsGL';
import { drawMarbleGL, detectMarbleGLSupport } from './drawMarbleGL';
import { drawLavaLampGL, detectLavaLampGLSupport } from './drawLavaLampGL';
import { drawFlower } from './drawFlower';
import { drawParticles } from './drawParticles';
import { drawTiling } from './drawTiling';
import { drawFireworks } from './drawFireworks';
import { drawLightning } from './drawLightning';

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

// Same dispatch pattern as Reaction-Diffusion above, gated on the much
// lighter detectFieldGLSupport check (plain WebGL2, no float-framebuffer
// requirement) — see glShared.ts and drawPlasmaGL.ts for why these two
// checks are kept separate rather than shared.
function drawPlasmaAuto(P: any): CanvasGradient | undefined {
  if (detectPlasmaGLSupport()) {
    try {
      return drawPlasmaGL(P);
    } catch (err) {
      console.error('WebGL Plasma failed, falling back to CPU:', err);
    }
  }
  return drawPlasma(P);
}

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
  if (detectAngleGLSupport()) {
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

export const GRADIENT_DRAW_FNS: Record<string, (P: any) => CanvasGradient | undefined> = {
  'radial': drawRadial,
  'angle': drawAngleAuto,
  'polar-grid': drawPolarGrid,
  'windmill': drawWindmill,
  'shapes': drawShapes,
  'fade': drawFade,
  'noise': drawNoiseAuto,
  'topographic': drawTopographic,
  'julia': drawJulia,
  'plasma': drawPlasmaAuto,
  'grid': drawGrid,
  'radial-burst': drawRadialBurst,
  'voronoi': drawVoronoi,
  'aurora': drawAurora,
  'caustics': drawCausticsAuto,
  'lava-lamp': drawLavaLampAuto,
  'marble': drawMarbleAuto,
  'metaballs': drawMetaballs,
  'truchet': drawTruchet,
  'moire': drawMoire,
  'flow-field': drawFlowField,
  'attractor': drawAttractor,
  'reaction-diffusion': drawReactionDiffusionAuto,
  'flower': drawFlower,
  'particles': drawParticles,
  'tiling': drawTiling,
  'fireworks': drawFireworks,
  'lightning': drawLightning,
};
