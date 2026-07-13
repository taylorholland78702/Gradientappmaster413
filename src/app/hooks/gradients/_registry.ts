import { drawLinear } from './drawLinear';
import { drawRadial } from './drawRadial';
import { drawAngle } from './drawAngle';
import { drawPolarGrid } from './drawPolarGrid';
import { drawWindmill } from './drawWindmill';
import { drawWaves } from './drawWaves';
import { drawShapes } from './drawShapes';
import { drawFade } from './drawFade';
import { drawMesh } from './drawMesh';
import { drawNoise } from './drawNoise';
import { drawTopographic } from './drawTopographic';
import { drawJulia } from './drawJulia';
import { drawPlasma } from './drawPlasma';
import { drawGrid } from './drawGrid';
import { drawHelix } from './drawHelix';
import { drawRadialBurst } from './drawRadialBurst';
import { drawFreeform } from './drawFreeform';
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
import { drawRadar } from './drawRadar';
import { drawFlower } from './drawFlower';

export const GRADIENT_DRAW_FNS: Record<string, (P: any) => CanvasGradient | undefined> = {
  'linear': drawLinear,
  'radial': drawRadial,
  'angle': drawAngle,
  'polar-grid': drawPolarGrid,
  'windmill': drawWindmill,
  'waves': drawWaves,
  'shapes': drawShapes,
  'fade': drawFade,
  'mesh': drawMesh,
  'noise': drawNoise,
  'topographic': drawTopographic,
  'julia': drawJulia,
  'plasma': drawPlasma,
  'grid': drawGrid,
  'helix': drawHelix,
  'radial-burst': drawRadialBurst,
  'freeform': drawFreeform,
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
  'reaction-diffusion': drawReactionDiffusion,
  'radar': drawRadar,
  'flower': drawFlower,
};
