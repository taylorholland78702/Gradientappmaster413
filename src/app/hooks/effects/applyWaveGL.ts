// WebGL2 renderer for Wave (distortion) — see the CPU version (applyWave.ts)
// for the reference implementation. Same class as Liquid
// (applyLiquidGL.ts): single-sample-per-pixel, so it
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
// The wrap is the same; the sampling is not -- see the note in the shader. The
// CPU path still snaps to whole pixels, so on a device without WebGL2 Wave looks
// the way it always did.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFullscreen, getSharedEffectGL, uploadCanvasTexture, detectEffectGLSupport, setSizeUniform } from './glEffectShared';
import type { GLEffectStage } from './glEffectPipeline';
import type { EffectCtx } from '../canvasDrawTypes';

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
  // Continuous (sub-pixel) sampling. The CPU version snaps the source position
  // to a whole display pixel -- its only option, since it indexes an ImageData --
  // and this shader used to copy that with floor() plus a +0.5 texel center,
  // which made every display pixel a flat block however finely the frame was
  // rendered (a 2x canvas looked 1x). The texture is LINEAR-filtered, so just
  // wrapping the continuous coordinate lets the render resolution show through;
  // at 1x it differs from the snapped result only by sub-pixel interpolation.
  vec2 suv = mod(vec2(sourceX, sourceY), uSize) / uSize;
  outColor = vec4(texture(uTex, suv).rgb, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectWaveGLSupport(): boolean {
  return detectEffectGLSupport();
}

function deriveUniforms(P: EffectCtx) {
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
  setSizeUniform(gl, program, width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'uAngleRad'), u.angleRad);
  gl.uniform1f(gl.getUniformLocation(program, 'uFreqMult'), u.freqMult);
  gl.uniform1f(gl.getUniformLocation(program, 'uStrength'), u.strength);
  drawFullscreen(gl);
}

export function applyWaveGL(P: EffectCtx): void {
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
export function getWaveGLStage(P: EffectCtx): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'wave',
    render: (gl, inputTexture, outputFramebuffer, width, height) => renderWaveStage(gl, inputTexture, outputFramebuffer, width, height, u),
  };
}
