// WebGL2 renderer for Mirror — see the CPU version (applyMirror.ts) for the
// reference implementation. Unlike Liquid/Fisheye/Wave, Mirror's CPU path
// isn't a per-pixel JS loop at all — it's a handful of native
// ctx.drawImage calls (already browser/GPU-composited), so this isn't
// closing a CPU bottleneck. It's ported anyway so Mirror can participate in
// a GL-pipeline chain (glEffectPipeline.ts) instead of forcing a
// CPU-canvas round-trip whenever it's stacked next to another GL effect —
// the goal here is chain *reach*, not per-effect speed.
//
// 'grid' mode's CPU version always samples the same top-left tileW×tileH
// corner of the source for every cell (not a different region per cell),
// alternating horizontal/vertical flips by row/column parity so every seam
// lines up — reproduced in the shader the same way: map each cell's local
// UV back into that one corner region, with the flip applied first.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFullscreen, getSharedEffectGL, uploadCanvasTexture, detectEffectGLSupport } from './glEffectShared';
import type { GLEffectStage } from './glEffectPipeline';

const MIRROR_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform int uMode; // 0 horizontal, 1 vertical, 2 grid
uniform float uGridN;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 suv = vUv;
  if (uMode == 0) {
    suv = vUv.x < 0.5 ? vUv : vec2(1.0 - vUv.x, vUv.y);
  } else if (uMode == 1) {
    suv = vUv.y < 0.5 ? vUv : vec2(vUv.x, 1.0 - vUv.y);
  } else {
    vec2 tileUv = vUv * uGridN;
    vec2 cellIndex = floor(tileUv);
    vec2 localUv = fract(tileUv);
    if (mod(cellIndex.x, 2.0) >= 1.0) localUv.x = 1.0 - localUv.x;
    if (mod(cellIndex.y, 2.0) >= 1.0) localUv.y = 1.0 - localUv.y;
    suv = localUv / uGridN;
  }
  outColor = vec4(texture(uTex, suv).rgb, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectMirrorGLSupport(): boolean {
  return detectEffectGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const { mirrorMode, mirrorTileCount, isFirstEffect, audioModulation } = P;
  const modeIdx = mirrorMode === 'horizontal' ? 0 : mirrorMode === 'vertical' ? 1 : 2;
  const gridN = Math.max(2, Math.min(16, Math.round(mirrorTileCount + (isFirstEffect ? audioModulation * 4 : 0))));
  return { modeIdx, gridN };
}

function renderMirrorStage(
  gl: WebGL2RenderingContext,
  inputTexture: WebGLTexture,
  outputFramebuffer: WebGLFramebuffer | null,
  width: number,
  height: number,
  u: ReturnType<typeof deriveUniforms>,
): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, MIRROR_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'uMode'), u.modeIdx);
  gl.uniform1f(gl.getUniformLocation(program, 'uGridN'), u.gridN);
  drawFullscreen(gl);
}

export function applyMirrorGL(P: any): void {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
  const tex = uploadCanvasTexture(gl, canvas);
  renderMirrorStage(gl, tex, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
}

// Used by glEffectPipeline.ts when Mirror is part of a contiguous run of
// GL-eligible effects — see that file for why chaining avoids a per-effect
// canvas round-trip.
export function getMirrorGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'mirror',
    render: (gl, inputTexture, outputFramebuffer, width, height) => renderMirrorStage(gl, inputTexture, outputFramebuffer, width, height, u),
  };
}
