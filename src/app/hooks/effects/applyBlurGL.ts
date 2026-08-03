// WebGL2 renderer for Blur's Zoom and Radial (spin) modes only — see the
// CPU version (applyBlur.ts) for the reference implementation and for the
// Gaussian/Motion modes, which already run via ctx.filter/ctx.drawImage
// (native, browser/GPU-composited) and aren't part of this port.
//
// Zoom and Radial are true multi-sample-per-pixel effects (10-12 texture
// reads + averaging, the Radial mode adding atan2/cos/sin per sample) at
// full display resolution with no downsampling compromise — the one real
// per-pixel bottleneck found in the effects layer (every other effect is a
// single sample per pixel, already cheap). Unlike the gradient/particle GL
// ports, this needs to re-sample the CURRENT canvas content as input
// (glEffectShared.ts's uploadCanvasTexture), not generate its own field.
// _registry.ts-equivalent (effectRegistry.ts's applyBlurAuto) falls back
// to the CPU implementation if WebGL2 isn't available or this throws.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFullscreen, getSharedEffectGL, uploadCanvasTexture, detectEffectGLSupport } from './glEffectShared';
import type { GLEffectStage } from './glEffectPipeline';

const ZOOM_STEPS = 10;
const RADIAL_STEPS = 12;

const ZOOM_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform float uAmt;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec3 sum = vec3(0.0);
  for (int s = 0; s < ${ZOOM_STEPS}; s++) {
    float t = 1.0 - uAmt * (float(s) / float(${ZOOM_STEPS}));
    vec2 uv = mix(vec2(0.5), vUv, t);
    sum += texture(uTex, uv).rgb;
  }
  outColor = vec4(sum / float(${ZOOM_STEPS}), 1.0);
}`;

const RADIAL_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uSweep;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec2 fp = vUv * uSize;
  vec2 c = uSize * 0.5;
  vec2 d = fp - c;
  float r = length(d);
  float baseAngle = atan(d.y, d.x);
  vec3 sum = vec3(0.0);
  for (int s = 0; s < ${RADIAL_STEPS}; s++) {
    float t = (float(s) / float(${RADIAL_STEPS} - 1)) - 0.5;
    float a = baseAngle + t * uSweep;
    vec2 samplePx = c + vec2(cos(a), sin(a)) * r;
    sum += texture(uTex, samplePx / uSize).rgb;
  }
  outColor = vec4(sum / float(${RADIAL_STEPS}), 1.0);
}`;

let zoomProgram: WebGLProgram | null = null;
let radialProgram: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectBlurGLSupport(): boolean {
  return detectEffectGLSupport();
}

// Core render steps, shared by the standalone paths (applyBlurZoomGL/
// applyBlurRadialGL, below) and the pipelined paths (getBlurZoomGLStage/
// getBlurRadialGLStage) — the only difference is where the input texture
// comes from and where the output lands.
function renderZoomStage(gl: WebGL2RenderingContext, inputTexture: WebGLTexture, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, amt: number): void {
  if (!zoomProgram || programGL !== gl) {
    zoomProgram = linkProgram(gl, FULLSCREEN_VERT_SRC, ZOOM_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(zoomProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(zoomProgram, 'uTex'), 0);
  gl.uniform1f(gl.getUniformLocation(zoomProgram, 'uAmt'), amt);
  drawFullscreen(gl);
}

function renderRadialStage(gl: WebGL2RenderingContext, inputTexture: WebGLTexture, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, sweep: number): void {
  if (!radialProgram || programGL !== gl) {
    radialProgram = linkProgram(gl, FULLSCREEN_VERT_SRC, RADIAL_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(radialProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(radialProgram, 'uTex'), 0);
  gl.uniform2f(gl.getUniformLocation(radialProgram, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(radialProgram, 'uSweep'), sweep);
  drawFullscreen(gl);
}

export function applyBlurZoomGL(P: any): void {
  const { canvas, ctx, displayWidth, displayHeight, blurRadialAmount, isAudioReactive, audioMidsLevel } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
  const zbAmt = Math.min(0.5, (blurRadialAmount / 100) * (isAudioReactive ? 1 + audioMidsLevel * 2 : 1));
  const tex = uploadCanvasTexture(gl, canvas);
  renderZoomStage(gl, tex, null, glCanvas.width, glCanvas.height, zbAmt);

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
}

export function applyBlurRadialGL(P: any): void {
  const { canvas, ctx, displayWidth, displayHeight, blurRadialAmount, isFirstEffect, isAudioReactive, audioMidsLevel } = P;
  if (canvas.width === 0 || canvas.height === 0) return;

  const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
  const spinSweep = (blurRadialAmount / 50) * (Math.PI / 4) * (isFirstEffect && isAudioReactive ? 1 + audioMidsLevel * 2 : 1);
  const tex = uploadCanvasTexture(gl, canvas);
  renderRadialStage(gl, tex, null, glCanvas.width, glCanvas.height, spinSweep);

  ctx.clearRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
}

// Used by glEffectPipeline.ts when Blur (zoom/radial) is part of a
// contiguous run of GL-eligible effects — see that file for why chaining
// avoids a per-effect canvas round-trip.
export function getBlurZoomGLStage(P: any): GLEffectStage {
  const { blurRadialAmount, isAudioReactive, audioMidsLevel } = P;
  const amt = Math.min(0.5, (blurRadialAmount / 100) * (isAudioReactive ? 1 + audioMidsLevel * 2 : 1));
  return {
    type: 'blur-zoom',
    render: (gl, inputTexture, outputFramebuffer, width, height) =>
      renderZoomStage(gl, inputTexture, outputFramebuffer, width, height, amt),
  };
}

export function getBlurRadialGLStage(P: any): GLEffectStage {
  const { blurRadialAmount, isFirstEffect, isAudioReactive, audioMidsLevel } = P;
  const sweep = (blurRadialAmount / 50) * (Math.PI / 4) * (isFirstEffect && isAudioReactive ? 1 + audioMidsLevel * 2 : 1);
  return {
    type: 'blur-radial',
    render: (gl, inputTexture, outputFramebuffer, width, height) =>
      renderRadialStage(gl, inputTexture, outputFramebuffer, width, height, sweep),
  };
}
