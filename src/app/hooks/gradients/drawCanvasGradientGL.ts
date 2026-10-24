// WebGL replacements for the two plain Canvas2D gradient fills that showed the
// worst banding — Radial's createRadialGradient and Fade's createLinearGradient.
//
// A native canvas gradient is interpolated and rounded to 8 bits by the
// browser with no dithering, so a slow ramp turns into flat strips (measured:
// runs of 148-244 identical pixels on Radial). The same ramp done here is
// blended in sRGB in float and
// dithered once, at the final 8-bit rounding (see DITHER_GLSL in glShared.ts).
//
// Rendered at the canvas's real backing resolution (not the CSS-pixel size the
// older field gradients use) so the dither survives 1:1 instead of being
// resampled when the canvas is scaled for device pixel ratio.
//
// Both entry points return false when WebGL2 is unavailable or the shader
// fails, and the caller keeps its native-gradient path as the fallback.
import { FULLSCREEN_VERT_SRC, MAX_FIELD_COLORS, BLEND_COLORS_GLSL, DITHER_GLSL, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport, setPaletteMapUniforms } from './glShared';
import type { DrawCtx } from '../canvasDrawTypes';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform int uShape; // 0 radial, 1 linear
uniform vec2 uA;    // radial: center, linear: start (backing-store pixels)
uniform vec2 uB;    // linear: end
uniform float uRadius;
uniform vec3 uColors[${MAX_FIELD_COLORS}];
uniform int uColorCount;
in vec2 vUv;
out vec4 outColor;
${BLEND_COLORS_GLSL}
${DITHER_GLSL}

void main() {
  vec2 fp = vUv * uSize;
  float t;
  if (uShape == 0) {
    t = clamp(length(fp - uA) / max(uRadius, 1e-3), 0.0, 1.0);
  } else {
    vec2 d = uB - uA;
    t = clamp(dot(fp - uA, d) / max(dot(d, d), 1e-6), 0.0, 1.0);
  }
  outColor = vec4(antiBand(paletteLookup(t)), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;
let failed = false;

type RGB = { r: number; g: number; b: number };
type Spec =
  | { shape: 'radial'; cx: number; cy: number; radius: number }
  | { shape: 'linear'; x0: number; y0: number; x1: number; y1: number };

function fillGL(P: DrawCtx, spec: Spec, colors: RGB[]): boolean {
  if (failed || colors.length === 0 || !detectFieldGLSupport()) return false;
  const { canvas, ctx, displayWidth, displayHeight } = P;
  if (canvas.width === 0 || canvas.height === 0) return false;
  try {
    const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
    if (!program || programGL !== gl) {
      program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
      programGL = gl;
    }
    // Geometry arrives in CSS pixels; the shader works in render-target pixels.
    const sx = glCanvas.width / displayWidth;
    const sy = glCanvas.height / displayHeight;

    const count = Math.max(1, Math.min(MAX_FIELD_COLORS, colors.length));
    const colorArr = new Float32Array(MAX_FIELD_COLORS * 3);
    for (let i = 0; i < count; i++) {
      const c = colors[i];
      const ok = c && !isNaN(c.r) && !isNaN(c.g) && !isNaN(c.b);
      colorArr[i * 3] = (ok ? Math.max(0, Math.min(255, c.r)) : 128) / 255;
      colorArr[i * 3 + 1] = (ok ? Math.max(0, Math.min(255, c.g)) : 128) / 255;
      colorArr[i * 3 + 2] = (ok ? Math.max(0, Math.min(255, c.b)) : 128) / 255;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    gl.useProgram(program);
    gl.uniform2f(gl.getUniformLocation(program, 'uSize'), glCanvas.width, glCanvas.height);
    gl.uniform3fv(gl.getUniformLocation(program, 'uColors'), colorArr);
    gl.uniform1i(gl.getUniformLocation(program, 'uColorCount'), count);
    // The shader's y runs top-down (vUv), matching canvas coordinates.
    if (spec.shape === 'radial') {
      gl.uniform1i(gl.getUniformLocation(program, 'uShape'), 0);
      gl.uniform2f(gl.getUniformLocation(program, 'uA'), spec.cx * sx, spec.cy * sy);
      gl.uniform1f(gl.getUniformLocation(program, 'uRadius'), spec.radius * ((sx + sy) / 2));
    } else {
      gl.uniform1i(gl.getUniformLocation(program, 'uShape'), 1);
      gl.uniform2f(gl.getUniformLocation(program, 'uA'), spec.x0 * sx, spec.y0 * sy);
      gl.uniform2f(gl.getUniformLocation(program, 'uB'), spec.x1 * sx, spec.y1 * sy);
    }
    setPaletteMapUniforms(gl, program, count);
    drawFieldFullscreen(gl);

    ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
    return true;
  } catch (err) {
    failed = true;
    console.error('WebGL canvas-gradient fill failed, using native gradients:', err);
    return false;
  }
}

export function fillRadialGL(P: DrawCtx, geom: { cx: number; cy: number; radius: number }, colors: RGB[]): boolean {
  return fillGL(P, { shape: 'radial', ...geom }, colors);
}

export function fillLinearGL(P: DrawCtx, x0: number, y0: number, x1: number, y1: number, colors: RGB[]): boolean {
  return fillGL(P, { shape: 'linear', x0, y0, x1, y1 }, colors);
}
