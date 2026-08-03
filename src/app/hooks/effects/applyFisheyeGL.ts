// WebGL2 renderer for Fisheye — see the CPU version (applyFisheye.ts) for
// the reference implementation. Same class as Liquid (applyLiquidGL.ts):
// single-sample-per-pixel, so it doesn't clear the "genuine multi-sample
// bottleneck" bar the original GL-porting pass used, but its remap math
// (atan2 + pow + cos/sin per pixel) is transcendental-heavy — cheap on GPU,
// notably slower on CPU. Ported for the same reason as Liquid: closing the
// remaining smoothness gap, not because it was a measured hotspot.
//
// The CPU version does its own manual bilinear interpolation (4-sample
// weighted blend) since a JS pixel array has no hardware sampling; here
// texture() does that for free via LINEAR filtering (glEffectShared.ts's
// uploadCanvasTexture). One behavioral difference: near the lens edge, the
// CPU version writes fully-transparent pixels when the bilinear neighbor
// falls outside the image; this samples with CLAMP_TO_EDGE instead, which
// repeats the nearest edge pixel rather than leaving a transparent gap —
// a standard, less visually jarring way to handle the same boundary case.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFullscreen, getSharedEffectGL, uploadCanvasTexture, detectEffectGLSupport } from './glEffectShared';
import type { GLEffectStage } from './glEffectPipeline';

const FISHEYE_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uStrength;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 fp = vUv * uSize;
  vec2 n = (fp - uCenter) / uRadius;
  float r = length(n);
  if (r >= 1.0) {
    outColor = texture(uTex, vUv);
    return;
  }
  float theta = atan(n.y, n.x);
  float rDist = pow(r, 1.0 + uStrength);
  vec2 samplePx = uCenter + vec2(cos(theta), sin(theta)) * rDist * uRadius;
  outColor = vec4(texture(uTex, samplePx / uSize).rgb, 1.0);
}`;

let fisheyeProgram: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectFisheyeGLSupport(): boolean {
  return detectEffectGLSupport();
}

function renderFisheyeStage(
  gl: WebGL2RenderingContext,
  inputTexture: WebGLTexture,
  outputFramebuffer: WebGLFramebuffer | null,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  strength: number,
): void {
  if (!fisheyeProgram || programGL !== gl) {
    fisheyeProgram = linkProgram(gl, FULLSCREEN_VERT_SRC, FISHEYE_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(fisheyeProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(fisheyeProgram, 'uTex'), 0);
  gl.uniform2f(gl.getUniformLocation(fisheyeProgram, 'uSize'), width, height);
  gl.uniform2f(gl.getUniformLocation(fisheyeProgram, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(fisheyeProgram, 'uRadius'), radius);
  gl.uniform1f(gl.getUniformLocation(fisheyeProgram, 'uStrength'), strength);
  drawFullscreen(gl);
}

function deriveParams(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { fisheyeCenterX, fisheyeCenterY, fisheyeStrength, displayWidth, displayHeight, isFirstEffect, audioModulation } = P;
  const centerX = (fisheyeCenterX / 100) * displayWidth;
  const centerY = (fisheyeCenterY / 100) * displayHeight;
  const radius = Math.min(displayWidth / 2, displayHeight / 2);
  const strength = Math.max(0.01, fisheyeStrength + (isFirstEffect ? audioModulation : 0));
  return { centerX, centerY, radius, strength };
}

export function applyFisheyeGL(P: any): void {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
  const { centerX, centerY, radius, strength } = deriveParams(P);
  const tex = uploadCanvasTexture(gl, canvas);
  renderFisheyeStage(gl, tex, null, glCanvas.width, glCanvas.height, centerX, centerY, radius, strength);

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
}

// Used by glEffectPipeline.ts when Fisheye is part of a contiguous run of
// GL-eligible effects — see that file for why chaining avoids a per-effect
// canvas round-trip.
export function getFisheyeGLStage(P: any): GLEffectStage {
  const { centerX, centerY, radius, strength } = deriveParams(P);
  return {
    type: 'fisheye',
    render: (gl, inputTexture, outputFramebuffer, width, height) =>
      renderFisheyeStage(gl, inputTexture, outputFramebuffer, width, height, centerX, centerY, radius, strength),
  };
}
