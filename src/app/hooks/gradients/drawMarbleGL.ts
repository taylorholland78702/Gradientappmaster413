// WebGL2 pilot renderer for Marble — see the CPU version (drawMarble.ts)
// for the reference implementation. Pure function of (x, y, t), one
// fragment shader pass at full display resolution instead of the CPU
// path's half-res-then-upscale compromise.
//
// The CPU loop divides by mRenderW/mRenderH (half-res dims) with a
// pre-halved center; substituting x = fullResX/2 the 0.5 factors cancel
// cleanly into `(fullResX - centerX) / displayWidth * scale` — the same
// continuous field, evaluated at every full-res pixel instead of every
// half-res one.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const MAX_OCTAVES = 8;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uScale;
uniform float uSeedX;
uniform float uSeedY;
uniform float uTime;
uniform float uAudioFreq;
uniform float uOctAmpBoost;
uniform int uOctaves;
uniform float uVeinFreq;
uniform float uVeinBoost;
uniform float uTurbulence;
uniform float uTurbBoost;
uniform float uColorShift;
in vec2 vUv;
out vec4 outColor;
${JS_MOD_GLSL}
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float nx2 = (fp.x - uCenter.x) / uSize.x * uScale + uSeedX;
  float ny2 = (fp.y - uCenter.y) / uSize.y * uScale + uSeedY;
  float turb = 0.0;
  float freq = 1.0 * uAudioFreq;
  float amp = 1.0;
  for (int oct = 0; oct < ${MAX_OCTAVES}; oct++) {
    if (oct >= uOctaves) break;
    turb += sin(nx2 * freq + uTime * 0.3) * cos(ny2 * freq * 0.8 - uTime * 0.2) * amp * uOctAmpBoost;
    turb += sin((nx2 + ny2) * freq * 0.7 + uTime * 0.5) * amp * 0.5;
    freq *= 2.1;
    amp *= 0.5;
  }
  float vein = sin(nx2 * uVeinFreq * uVeinBoost + turb * uTurbulence * uTurbBoost + uTime * 0.1) * 0.5 + 0.5;
  float tVal = jsMod(vein + uColorShift, 1.0);
  vec3 color = getMappedColor(tVal);
  outColor = vec4(color, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectMarbleGLSupport(): boolean {
  return detectFieldGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors, structuralSeed,
    marbleAnimTime, marbleOctaves, marbleVeinFreq, marbleTurbulence, gradientAngle, zoom,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
    centerX, centerY,
  } = P;
  const marbleAudio = isAudioEnabled && isAudioReactive;
  const mt = marbleAnimTime + gradientAngle * 0.015;
  const audioBassM = marbleAudio ? audioSubBassLevel / 5 : 0;
  const audioMidsM = marbleAudio ? audioMidsLevel / 5 : 0;
  const marbleAudioFreq = 1 + audioBassM * 2.5;
  const marbleTurbBoost = 1 + audioBassM * 4.0;
  const marbleVeinBoost = 1 + audioBassM * 3.0;
  const marbleOctAmpBoost = 1 + audioMidsM * 2.0;
  const marbleColorShift = marbleAudio ? audioTrebleLevel * 0.8 : 0;
  const mScale = (1 / zoom) * 3;
  const mOctaves = Math.max(1, Math.min(MAX_OCTAVES, Math.round(marbleOctaves)));
  const mSeedX = structuralSeed * 1.7;
  const mSeedY = structuralSeed * 2.3;

  return {
    centerX, centerY, scale: mScale, seedX: mSeedX, seedY: mSeedY, time: mt,
    audioFreq: marbleAudioFreq, octAmpBoost: marbleOctAmpBoost, octaves: mOctaves,
    veinFreq: marbleVeinFreq, veinBoost: marbleVeinBoost, turbulence: marbleTurbulence,
    turbBoost: marbleTurbBoost, colorShift: marbleColorShift,
    gradientColors, fieldContrast, paletteMode, paletteBands,
  };
}

function renderMarbleStage(gl: WebGL2RenderingContext, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, u: ReturnType<typeof deriveUniforms>): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), u.centerX, u.centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), u.scale);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedX'), u.seedX);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedY'), u.seedY);
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), u.time);
  gl.uniform1f(gl.getUniformLocation(program, 'uAudioFreq'), u.audioFreq);
  gl.uniform1f(gl.getUniformLocation(program, 'uOctAmpBoost'), u.octAmpBoost);
  gl.uniform1i(gl.getUniformLocation(program, 'uOctaves'), u.octaves);
  gl.uniform1f(gl.getUniformLocation(program, 'uVeinFreq'), u.veinFreq);
  gl.uniform1f(gl.getUniformLocation(program, 'uVeinBoost'), u.veinBoost);
  gl.uniform1f(gl.getUniformLocation(program, 'uTurbulence'), u.turbulence);
  gl.uniform1f(gl.getUniformLocation(program, 'uTurbBoost'), u.turbBoost);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), u.colorShift);
  setColorUniforms(gl, program, u.gradientColors, u.fieldContrast, u.paletteMode, u.paletteBands);
  drawFieldFullscreen(gl);
}

export function drawMarbleGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderMarbleStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts's gradient-pipeline eligibility check — see
// glEffectPipeline.ts. The background fill the standalone path does is
// skipped here since the shader fully overdraws it anyway (see Caustics).
export function getMarbleGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'marble',
    render: (gl, _inputTexture, outputFramebuffer, width, height) => renderMarbleStage(gl, outputFramebuffer, width, height, u),
  };
}
