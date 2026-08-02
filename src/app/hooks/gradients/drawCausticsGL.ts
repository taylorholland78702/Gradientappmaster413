// WebGL2 pilot renderer for Caustics — see the CPU version (drawCaustics.ts)
// for the reference implementation. Pure function of (x, y, t), one
// fragment shader pass at full display resolution instead of the CPU
// path's half-res-then-upscale compromise.
//
// The CPU loop samples in half-res grid units (x, y each 0..displayWidth/2)
// with a pre-halved center (centerX*0.5) and a scale term with an extra /0.5
// baked in. Substituting x = fullResX/2 and simplifying, the 0.5 factors
// cancel into a clean `(fullResX - centerX) * (causticsScale/displayWidth)
// * (4/zoom)` — that's what's used below, evaluated at every full-res
// pixel instead of every half-res one, so this is mathematically the same
// continuous field, just sampled finer.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport } from './glShared';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform vec2 uScale;
uniform float uSeedX;
uniform float uSeedY;
uniform float uTime;
uniform float uFreq;
uniform float uPhaseWarp;
uniform float uBrightnessExp;
uniform float uLightFloor;
uniform float uColorShift;
in vec2 vUv;
out vec4 outColor;
${JS_MOD_GLSL}
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float nx = (fp.x - uCenter.x) * uScale.x + uSeedX;
  float ny = (fp.y - uCenter.y) * uScale.y + uSeedY;
  float w1 = sin(nx * 2.1 * uFreq + sin(ny * 1.3 * uFreq + uTime + uPhaseWarp) + uTime * 0.7);
  float w2 = sin(ny * 2.3 * uFreq + sin(nx * 1.7 * uFreq - uTime * 0.8 + uPhaseWarp) - uTime * 0.5);
  float w3 = sin((nx + ny) * 1.5 * uFreq + uTime * 1.1);
  float v = min(1.0, pow(abs(w1 + w2 + w3) / 3.0, uBrightnessExp) + uLightFloor);
  float tVal = jsMod(sin(v * 3.14159265359) * 0.5 + 0.5 + uColorShift, 1.0);
  vec3 c1 = getMappedColor(tVal);
  outColor = vec4(min(vec3(1.0), c1 * (0.3 + v * 0.7)), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectCausticsGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawCausticsGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors, structuralSeed,
    causticsAnimTime, causticsScale, causticsBrightness, gradientAngle, zoom,
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

  const causticsAudio = isAudioEnabled && isAudioReactive;
  const audioBassC = causticsAudio ? audioSubBassLevel / 5 : 0;
  const audioMidsC = causticsAudio ? audioMidsLevel / 5 : 0;
  const ct = causticsAnimTime + gradientAngle * 0.02;
  const causticsFreqBoost = 1 + audioBassC * 1.8;
  const causticsBrightnessExp = Math.max(0.3, causticsBrightness - audioBassC * 1.2);
  const causticsPhaseWarp = audioMidsC * 2.5;
  const causticsColorShift = causticsAudio ? audioTrebleLevel * 0.7 : 0;
  const causticsLightFloor = 0.1 + audioBassC * 0.4;
  const uScaleX = (causticsScale / displayWidth) * (4 / zoom);
  const uScaleY = (causticsScale / displayHeight) * (4 / zoom);
  const cSeedX = structuralSeed * 2.1;
  const cSeedY = structuralSeed * 1.4;

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform2f(gl.getUniformLocation(program, 'uScale'), uScaleX, uScaleY);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedX'), cSeedX);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedY'), cSeedY);
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), ct);
  gl.uniform1f(gl.getUniformLocation(program, 'uFreq'), causticsFreqBoost);
  gl.uniform1f(gl.getUniformLocation(program, 'uPhaseWarp'), causticsPhaseWarp);
  gl.uniform1f(gl.getUniformLocation(program, 'uBrightnessExp'), causticsBrightnessExp);
  gl.uniform1f(gl.getUniformLocation(program, 'uLightFloor'), causticsLightFloor);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), causticsColorShift);
  setColorUniforms(gl, program, gradientColors, fieldContrast, paletteMode, paletteBands);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000814';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
