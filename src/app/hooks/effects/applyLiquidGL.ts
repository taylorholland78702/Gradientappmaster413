// WebGL2 renderer for Liquid — see the CPU version (applyLiquid.ts) for the
// reference implementation. Liquid is a single-sample-per-pixel remap (one
// source texture read), which put it below the bar the earlier GL-porting
// pass used (only genuine multi-sample bottlenecks like Blur's Zoom/Radial
// modes were ported). But its displacement math is 6 transcendental calls
// (sin/cos) per pixel — CPU Math.sin/cos are notably slower than basic ALU
// ops, while GPUs have dedicated fast transcendental hardware, so the actual
// per-pixel cost gap between CPU and GPU is much larger here than the
// "1 sample = cheap" framing suggested. Ported as part of closing the
// remaining smoothness gap against Brik's shader-only pipeline.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFullscreen, getSharedEffectGL, uploadCanvasTexture, detectEffectGLSupport } from './glEffectShared';
import type { GLEffectStage } from './glEffectPipeline';

const LIQUID_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uScale;
uniform float uTime;
uniform float uStrength;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 fp = vUv * uSize;
  float x = fp.x;
  float y = fp.y;
  float n1 = sin(x * uScale + uTime) * cos(y * uScale * 1.3 - uTime * 0.7);
  float n2 = sin((x + y) * uScale * 0.6 - uTime * 1.2) * 0.5;
  float dx = (n1 + n2) * uStrength;
  float n3 = cos(x * uScale * 1.1 - uTime * 0.9) * sin(y * uScale + uTime * 0.6);
  float n4 = cos((x - y) * uScale * 0.7 + uTime * 1.1) * 0.5;
  float dy = (n3 + n4) * uStrength;
  vec2 samplePx = clamp(fp + vec2(dx, dy), vec2(0.0), uSize - 1.0);
  outColor = vec4(texture(uTex, samplePx / uSize).rgb, 1.0);
}`;

let liquidProgram: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectLiquidGLSupport(): boolean {
  return detectEffectGLSupport();
}

// Core render step, shared by the standalone path (applyLiquidGL, below)
// and the pipelined path (getLiquidGLStage) — the only difference between
// them is where the input texture comes from and where the output lands.
function renderLiquidStage(
  gl: WebGL2RenderingContext,
  inputTexture: WebGLTexture,
  outputFramebuffer: WebGLFramebuffer | null,
  width: number,
  height: number,
  scale: number,
  time: number,
  strength: number,
): void {
  if (!liquidProgram || programGL !== gl) {
    liquidProgram = linkProgram(gl, FULLSCREEN_VERT_SRC, LIQUID_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(liquidProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(liquidProgram, 'uTex'), 0);
  gl.uniform2f(gl.getUniformLocation(liquidProgram, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(liquidProgram, 'uScale'), scale);
  gl.uniform1f(gl.getUniformLocation(liquidProgram, 'uTime'), time);
  gl.uniform1f(gl.getUniformLocation(liquidProgram, 'uStrength'), strength);
  drawFullscreen(gl);
}

export function applyLiquidGL(P: any): void {
  const { canvas, ctx, displayWidth, displayHeight, liquidScale, liquidAnimTime, liquidStrength } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
  const tex = uploadCanvasTexture(gl, canvas);
  renderLiquidStage(gl, tex, null, glCanvas.width, glCanvas.height, liquidScale * 0.006, liquidAnimTime, liquidStrength);

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
}

// Used by glEffectPipeline.ts when Liquid is part of a contiguous run of
// GL-eligible effects — see that file for why chaining avoids a per-effect
// canvas round-trip.
export function getLiquidGLStage(P: any): GLEffectStage {
  const { liquidScale, liquidAnimTime, liquidStrength } = P;
  const scale = liquidScale * 0.006;
  const time = liquidAnimTime;
  const strength = liquidStrength;
  return {
    type: 'liquid',
    render: (gl, inputTexture, outputFramebuffer, width, height) =>
      renderLiquidStage(gl, inputTexture, outputFramebuffer, width, height, scale, time, strength),
  };
}
