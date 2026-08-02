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

export function drawMarbleGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors, structuralSeed,
    marbleAnimTime, marbleOctaves, marbleVeinFreq, marbleTurbulence, gradientAngle, zoom,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
    canvas, ctx, displayWidth, displayHeight, centerX, centerY,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }

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

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), mScale);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedX'), mSeedX);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedY'), mSeedY);
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), mt);
  gl.uniform1f(gl.getUniformLocation(program, 'uAudioFreq'), marbleAudioFreq);
  gl.uniform1f(gl.getUniformLocation(program, 'uOctAmpBoost'), marbleOctAmpBoost);
  gl.uniform1i(gl.getUniformLocation(program, 'uOctaves'), mOctaves);
  gl.uniform1f(gl.getUniformLocation(program, 'uVeinFreq'), marbleVeinFreq);
  gl.uniform1f(gl.getUniformLocation(program, 'uVeinBoost'), marbleVeinBoost);
  gl.uniform1f(gl.getUniformLocation(program, 'uTurbulence'), marbleTurbulence);
  gl.uniform1f(gl.getUniformLocation(program, 'uTurbBoost'), marbleTurbBoost);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), marbleColorShift);
  setColorUniforms(gl, program, gradientColors, fieldContrast, paletteMode, paletteBands);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
