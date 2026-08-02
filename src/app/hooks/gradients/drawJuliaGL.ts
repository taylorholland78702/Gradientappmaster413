// WebGL2 pilot renderer for Julia — see the CPU version (drawJulia.ts) for
// the reference implementation. The CPU path renders at a fixed small
// internal grid (240x135) and upscales because up to 120 escape-time
// iterations per pixel is too slow in JS at full resolution; a GPU handles
// that same per-pixel iteration count trivially in parallel, so this
// renders straight at full display resolution instead — sharper fractal
// detail, not just faster.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport } from './glShared';

const MAX_ITER = 120;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uZoomFactor;
uniform float uCReal;
uniform float uCImag;
uniform float uCosR;
uniform float uSinR;
uniform int uMaxIter;
in vec2 vUv;
out vec4 outColor;
${JS_MOD_GLSL}
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float cx = uSize.x * 0.5, cy = uSize.y * 0.5;
  float dx0 = (fp.x - cx) / uZoomFactor;
  float dy0 = (fp.y - cy) / uZoomFactor;
  float zr = dx0 * uCosR - dy0 * uSinR;
  float zi = dx0 * uSinR + dy0 * uCosR;
  int iter = 0;
  for (int i = 0; i < ${MAX_ITER}; i++) {
    if (i >= uMaxIter || zr * zr + zi * zi >= 4.0) break;
    float zr2 = zr * zr - zi * zi + uCReal;
    float zi2 = 2.0 * zr * zi + uCImag;
    zr = zr2; zi = zi2;
    iter++;
  }
  float t;
  if (iter >= uMaxIter) {
    t = 0.0;
  } else {
    float mag2 = max(zr * zr + zi * zi, 1e-6);
    float logZn = log(mag2) / 2.0;
    float nu = log(max(logZn / 0.6931471805599453, 1e-6)) / 0.6931471805599453;
    float smoothIter = float(iter) + 1.0 - nu;
    t = abs(jsMod(smoothIter / float(uMaxIter), 1.0));
  }
  outColor = vec4(getMappedColor(t), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectJuliaGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawJuliaGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors,
    juliaReal, juliaImaginary, juliaZoom, juliaIterations, gradientAngle,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
    canvas, ctx, displayWidth, displayHeight,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }

  const jZoomFactor = (Math.min(displayWidth, displayHeight) / 2.2) * juliaZoom;
  const jMaxIter = Math.max(10, Math.min(MAX_ITER, Math.round(juliaIterations)));
  const jAudioActive = isAudioEnabled && isAudioReactive;
  const jZoomAudio = jAudioActive ? 1 + audioSubBassLevel * 0.25 : 1;
  const jCReal = juliaReal + (jAudioActive ? audioMidsLevel * 0.08 : 0);
  const jCImag = juliaImaginary + (jAudioActive ? audioTrebleLevel * 0.08 : 0);
  const jRotRad = gradientAngle * (Math.PI / 180);

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform1f(gl.getUniformLocation(program, 'uZoomFactor'), jZoomFactor * jZoomAudio);
  gl.uniform1f(gl.getUniformLocation(program, 'uCReal'), jCReal);
  gl.uniform1f(gl.getUniformLocation(program, 'uCImag'), jCImag);
  gl.uniform1f(gl.getUniformLocation(program, 'uCosR'), Math.cos(jRotRad));
  gl.uniform1f(gl.getUniformLocation(program, 'uSinR'), Math.sin(jRotRad));
  gl.uniform1i(gl.getUniformLocation(program, 'uMaxIter'), jMaxIter);
  setColorUniforms(gl, program, gradientColors, fieldContrast, paletteMode, paletteBands);
  drawFieldFullscreen(gl);

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
