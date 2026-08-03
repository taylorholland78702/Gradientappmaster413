// WebGL2 renderer for Wave (distortion) — see the CPU version (applyWave.ts)
// for the reference implementation. Same class as Liquid/Fisheye
// (applyLiquidGL.ts/applyFisheyeGL.ts): single-sample-per-pixel, so it
// doesn't clear the "genuine multi-sample bottleneck" bar the original
// GL-porting pass used, but its per-pixel remap (sin + wrapped-coordinate
// arithmetic) is cheap on GPU and, more importantly, makes it chainable
// with other GL effects (glEffectPipeline.ts) instead of forcing a
// CPU/canvas round-trip whenever it's stacked next to one.
//
// The CPU version wraps out-of-bounds source coordinates with a double-mod
// (JS's `%` is sign-preserving, so it needs `((x % w) + w) % w` to always
// land positive); GLSL's `mod()` is already floor-mod (always non-negative
// for a positive divisor), so a single `mod()` call reproduces the same
// wrap exactly.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFullscreen, getSharedEffectGL, uploadCanvasTexture, detectEffectGLSupport } from './glEffectShared';
import type { GLEffectStage } from './glEffectPipeline';

const WAVE_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uAngleRad;
uniform float uFreqMult;
uniform float uStrength;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 fp = vUv * uSize;
  float cosA = cos(uAngleRad);
  float sinA = sin(uAngleRad);
  float waveOffset = sin((fp.y * cosA + fp.x * sinA) * 0.05 * uFreqMult) * uStrength;
  float sourceX = fp.x + waveOffset * cosA;
  float sourceY = fp.y + waveOffset * sinA;
  float wrappedX = mod(floor(sourceX), uSize.x);
  float wrappedY = mod(floor(sourceY), uSize.y);
  vec2 suv = (vec2(wrappedX, wrappedY) + 0.5) / uSize;
  outColor = vec4(texture(uTex, suv).rgb, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectWaveGLSupport(): boolean {
  return detectEffectGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { waveDistortionRotation, waveDistortionStrength, isAudioReactive, audioSubBassLevel, audioMidsLevel } = P;
  const angleRad = waveDistortionRotation * Math.PI / 180;
  const audioWaveAmp = isAudioReactive ? (audioSubBassLevel / 5) * 80 : 0;
  const audioWaveFreqMult = isAudioReactive ? 1 + audioMidsLevel * 3 : 1;
  const effectiveWaveStrength = waveDistortionStrength + audioWaveAmp;
  return { angleRad, freqMult: audioWaveFreqMult, strength: effectiveWaveStrength };
}

function renderWaveStage(
  gl: WebGL2RenderingContext,
  inputTexture: WebGLTexture,
  outputFramebuffer: WebGLFramebuffer | null,
  width: number,
  height: number,
  u: ReturnType<typeof deriveUniforms>,
): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, WAVE_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'uAngleRad'), u.angleRad);
  gl.uniform1f(gl.getUniformLocation(program, 'uFreqMult'), u.freqMult);
  gl.uniform1f(gl.getUniformLocation(program, 'uStrength'), u.strength);
  drawFullscreen(gl);
}

export function applyWaveGL(P: any): void {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
  const tex = uploadCanvasTexture(gl, canvas);
  renderWaveStage(gl, tex, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
}

// Used by glEffectPipeline.ts when Wave is part of a contiguous run of
// GL-eligible effects — see that file for why chaining avoids a per-effect
// canvas round-trip.
export function getWaveGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'wave',
    render: (gl, inputTexture, outputFramebuffer, width, height) => renderWaveStage(gl, inputTexture, outputFramebuffer, width, height, u),
  };
}
