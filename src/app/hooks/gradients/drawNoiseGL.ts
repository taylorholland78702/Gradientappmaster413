// WebGL2 pilot renderer for Noise — see the CPU version (drawNoise.ts) for
// the reference implementation. Like Plasma, this is a pure function of
// (x, y, t) with no simulation state — the CPU version's "noise" is itself
// built entirely from sin/cos octaves (not a lattice/hash noise), which
// ports directly to GLSL with no separate noise-function port needed.
// Color mapping here does NOT use colorMappingGLSL()/getMappedColor — the
// CPU version indexes/interpolates gradientColors directly (wrapping by
// length, ignoring paletteMode/paletteBands/fieldContrast entirely), so
// this matches that simpler path instead.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, MAX_FIELD_COLORS, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const MAX_OCTAVES = 8;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uScale;
uniform float uRotCos;
uniform float uRotSin;
uniform float uDirection;
uniform float uWarp;
uniform int uOctaves;
uniform int uNoiseType; // 0 smooth, 1 ridged, 2 turbulence
uniform float uColorShift;
uniform float uBassBoost;
uniform float uMaxDist;
uniform vec3 uColors[${MAX_FIELD_COLORS}];
uniform int uColorCount;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 fp = vUv * uSize;
  float cx = uSize.x * 0.5;
  float cy = uSize.y * 0.5;
  float ndx = fp.x - cx;
  float ndy = fp.y - cy;
  float rx = ndx * uRotCos - ndy * uRotSin;
  float ry = ndx * uRotSin + ndy * uRotCos;

  if (uWarp > 0.0) {
    float ws = uScale * 0.7;
    float warpStrength = uWarp * uScale * 300.0;
    rx += warpStrength * sin(rx * ws + ry * ws * 0.3);
    ry += warpStrength * cos(rx * ws * 0.3 + ry * ws);
  }

  float combinedNoise = 0.0;
  float amplitude = 1.0;
  float totalAmplitude = 0.0;
  for (int octave = 0; octave < ${MAX_OCTAVES}; octave++) {
    if (octave >= uOctaves) break;
    float frequency = pow(2.0, float(octave));
    float scale = uScale * frequency;
    float octAngle = float(octave) * 2.4;
    float oCos = cos(octAngle);
    float oSin = sin(octAngle);
    float orx = rx * oCos - ry * oSin;
    float ory = rx * oSin + ry * oCos;
    float raw = sin(orx * scale + uDirection * 0.1 * frequency) *
                cos(ory * scale + uDirection * 0.1 * frequency);
    float n = uNoiseType == 1 ? 1.0 - abs(raw) : uNoiseType == 2 ? abs(raw) : raw;
    combinedNoise += n * amplitude;
    totalAmplitude += amplitude;
    amplitude *= 0.5;
  }

  combinedNoise = uNoiseType == 0
    ? (combinedNoise / totalAmplitude + 1.0) / 2.0
    : combinedNoise / totalAmplitude;

  float shiftedPos = mod(combinedNoise + uColorShift, 1.0);
  float n = float(uColorCount);
  float colorPos = shiftedPos * (n - 1.0);
  int colorIdx = int(floor(colorPos));
  float colorFrac = colorPos - float(colorIdx);
  int colorIdx2 = min(colorIdx + 1, uColorCount - 1);
  vec3 color = mix(uColors[colorIdx], uColors[colorIdx2], colorFrac);

  float dist = sqrt(ndx * ndx + ndy * ndy);
  float radialPulse = uBassBoost * (1.0 - dist / uMaxDist) * 0.8;
  float boost = 1.0 + radialPulse;

  outColor = vec4(min(vec3(1.0), color * boost), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectNoiseGLSupport(): boolean {
  return detectFieldGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    gradientColors, noiseScale, noiseOctaves, noiseDirection, noiseWarp, noiseType, zoom,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioTrebleLevel,
    displayWidth, displayHeight,
  } = P;
  const audioActive = isAudioEnabled && isAudioReactive;
  const noiseZoom = audioActive ? 1 : zoom;
  const baseNoiseScale = (noiseScale * 0.001) / noiseZoom;
  const noiseRotCos = Math.cos(noiseDirection * 0.01);
  const noiseRotSin = Math.sin(noiseDirection * 0.01);
  const noiseColorShift = audioActive ? audioTrebleLevel * 0.6 : 0;
  const noiseBassBoost = audioActive ? audioSubBassLevel : 0;
  const maxNoiseDist = Math.sqrt(displayWidth ** 2 + displayHeight ** 2) / 2;
  const noiseTypeIdx = noiseType === 'ridged' ? 1 : noiseType === 'turbulence' ? 2 : 0;

  const colorCount = Math.max(1, Math.min(MAX_FIELD_COLORS, gradientColors.length));
  const colorArr = new Float32Array(MAX_FIELD_COLORS * 3);
  for (let i = 0; i < colorCount; i++) {
    colorArr[i * 3] = gradientColors[i].r / 255;
    colorArr[i * 3 + 1] = gradientColors[i].g / 255;
    colorArr[i * 3 + 2] = gradientColors[i].b / 255;
  }

  return {
    scale: baseNoiseScale, rotCos: noiseRotCos, rotSin: noiseRotSin, direction: noiseDirection,
    warp: noiseWarp, octaves: Math.max(1, Math.min(MAX_OCTAVES, Math.round(noiseOctaves))),
    noiseTypeIdx, colorShift: noiseColorShift, bassBoost: noiseBassBoost, maxDist: maxNoiseDist,
    colorArr, colorCount,
  };
}

function renderNoiseStage(gl: WebGL2RenderingContext, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, u: ReturnType<typeof deriveUniforms>): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), u.scale);
  gl.uniform1f(gl.getUniformLocation(program, 'uRotCos'), u.rotCos);
  gl.uniform1f(gl.getUniformLocation(program, 'uRotSin'), u.rotSin);
  gl.uniform1f(gl.getUniformLocation(program, 'uDirection'), u.direction);
  gl.uniform1f(gl.getUniformLocation(program, 'uWarp'), u.warp);
  gl.uniform1i(gl.getUniformLocation(program, 'uOctaves'), u.octaves);
  gl.uniform1i(gl.getUniformLocation(program, 'uNoiseType'), u.noiseTypeIdx);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), u.colorShift);
  gl.uniform1f(gl.getUniformLocation(program, 'uBassBoost'), u.bassBoost);
  gl.uniform1f(gl.getUniformLocation(program, 'uMaxDist'), u.maxDist);
  gl.uniform3fv(gl.getUniformLocation(program, 'uColors'), u.colorArr);
  gl.uniform1i(gl.getUniformLocation(program, 'uColorCount'), u.colorCount);
  drawFieldFullscreen(gl);
}

export function drawNoiseGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderNoiseStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts's gradient-pipeline eligibility check — see
// glEffectPipeline.ts for why chaining avoids a per-stage canvas round-trip.
export function getNoiseGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'noise',
    render: (gl, _inputTexture, outputFramebuffer, width, height) => renderNoiseStage(gl, outputFramebuffer, width, height, u),
  };
}
