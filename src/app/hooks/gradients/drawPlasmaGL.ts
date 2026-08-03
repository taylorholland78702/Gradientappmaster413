// WebGL2 pilot renderer for Plasma — see the CPU version (drawPlasma.ts)
// for the reference implementation. Plasma has no simulation state (every
// pixel is a pure function of (x, y, t)), so unlike Reaction-Diffusion GL
// this needs no ping-ponged framebuffers: one fragment shader pass, full
// display resolution, straight to the shared field canvas (glShared.ts).
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import {
  FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram,
  drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport,
} from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uScale;
uniform float uAngle;
uniform float uSeedX;
uniform float uSeedY;
uniform float uColorShift;
uniform float uBassPulse;
uniform float uMaxDist;
in vec2 vUv;
out vec4 outColor;
${JS_MOD_GLSL}
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float cx = uSize.x * 0.5;
  float cy = uSize.y * 0.5;
  float dx = fp.x - cx;
  float dy = fp.y - cy;
  float spx = fp.x + uSeedX;
  float spy = fp.y + uSeedY;
  float value = (
    sin(spx * uScale + uAngle * 0.05) +
    sin(spy * uScale + uAngle * 0.05) +
    sin((spx + spy) * uScale * 0.75) +
    sin(sqrt(dx * dx + dy * dy) * uScale + uAngle * 0.05)
  ) / 4.0 + 0.5;
  float shiftedValue = jsMod(value + uColorShift, 1.0);
  vec3 color1 = getMappedColor(shiftedValue);
  float dist = sqrt(dx * dx + dy * dy);
  float radialBoost = 1.0 + uBassPulse * (1.0 - dist / uMaxDist) * 0.8;
  outColor = vec4(min(vec3(1.0), color1 * radialBoost), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectPlasmaGLSupport(): boolean {
  return detectFieldGLSupport();
}

interface PlasmaUniforms {
  scale: number; angle: number; seedX: number; seedY: number;
  colorShift: number; bassPulse: number; maxDist: number;
  gradientColors: { r: number; g: number; b: number }[];
  fieldContrast: number; paletteMode: string; paletteBands: number;
}

function deriveUniforms(P: any): PlasmaUniforms { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    fieldContrast, paletteMode, paletteBands, structuralSeed, gradientColors,
    gradientAngle, plasmaComplexity, plasmaZoomScale, zoom,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioTrebleLevel,
    centerX, centerY,
  } = P;
  const plasmaAudioActive = isAudioEnabled && isAudioReactive;
  const audioPlasmaComplexity = plasmaAudioActive ? audioSubBassLevel * 50 : 0;
  const plasmaZoom = plasmaAudioActive ? 1 : zoom;
  return {
    scale: ((plasmaComplexity + audioPlasmaComplexity) * 0.004) / (plasmaZoom * plasmaZoomScale),
    angle: gradientAngle,
    seedX: structuralSeed * 210,
    seedY: structuralSeed * 140,
    colorShift: plasmaAudioActive ? audioTrebleLevel * 0.6 : 0,
    bassPulse: plasmaAudioActive ? audioSubBassLevel : 0,
    maxDist: Math.sqrt(centerX ** 2 + centerY ** 2),
    gradientColors, fieldContrast, paletteMode, paletteBands,
  };
}

// Core render step, shared by the standalone path (drawPlasmaGL, below) and
// the pipelined path (getPlasmaGLStage) — the only difference is where the
// output lands. Plasma has no input texture (every pixel is a pure function
// of its own coordinates), so the pipeline stage's `inputTexture` param is
// simply unused.
function renderPlasmaStage(
  gl: WebGL2RenderingContext,
  outputFramebuffer: WebGLFramebuffer | null,
  width: number,
  height: number,
  u: PlasmaUniforms,
): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), u.scale);
  gl.uniform1f(gl.getUniformLocation(program, 'uAngle'), u.angle);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedX'), u.seedX);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedY'), u.seedY);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), u.colorShift);
  gl.uniform1f(gl.getUniformLocation(program, 'uBassPulse'), u.bassPulse);
  gl.uniform1f(gl.getUniformLocation(program, 'uMaxDist'), u.maxDist);
  setColorUniforms(gl, program, u.gradientColors, u.fieldContrast, u.paletteMode, u.paletteBands);
  drawFieldFullscreen(gl);
}

export function drawPlasmaGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderPlasmaStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts when Plasma is the active gradient and the
// leading run of active effects is GL-eligible — see glEffectPipeline.ts
// for why chaining avoids a per-stage canvas round-trip. Unlike the effect
// stages, a gradient stage is always first in its chain, so it ignores the
// `inputTexture` parameter GLEffectStage's signature requires uniformly.
export function getPlasmaGLStage(P: any): GLEffectStage {
  const uniforms = deriveUniforms(P);
  return {
    type: 'plasma',
    render: (gl, _inputTexture, outputFramebuffer, width, height) =>
      renderPlasmaStage(gl, outputFramebuffer, width, height, uniforms),
  };
}
