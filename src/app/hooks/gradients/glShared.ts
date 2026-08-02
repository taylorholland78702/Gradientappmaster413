// Shared WebGL2 infrastructure for the per-pixel "field" gradients (Plasma,
// Noise, ...) — the ones that are a pure function of (x, y, t) with no
// simulation state, unlike Reaction-Diffusion's ping-ponged framebuffers
// (drawReactionDiffusionGL.ts, which stays self-contained and untouched —
// its capability bar (float framebuffers) is stricter than what these need,
// so sharing a detector would incorrectly gate the simpler renderers on a
// requirement they don't have).
//
// Each field gradient composes FULLSCREEN_VERT_SRC + colorMappingGLSL() with
// its own math into one fragment shader, renders it to a small offscreen
// canvas via initFieldGL, and blits that onto the main 2D canvas with
// ctx.drawImage — identical handoff to the CPU path's putLowResImageData,
// just with a GPU-rendered source image instead of a JS-computed ImageData.

export const MAX_FIELD_COLORS = 12;

// vUv is top-down (0,0 = top-left, matching the CPU loops' row-major (x, y)
// convention) rather than WebGL's native bottom-up clip space, so
// `vUv * vec2(width, height)` drops straight into ported CPU math without
// every gradient having to re-derive its own Y-flip.
export const FULLSCREEN_VERT_SRC = `#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 pos = verts[gl_VertexID];
  vUv = vec2((pos.x + 1.0) * 0.5, 1.0 - (pos.y + 1.0) * 0.5);
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

// JS's `%` truncates toward zero (sign-preserving); GLSL's `mod()` floors
// (always same sign as the divisor). They agree almost everywhere, but
// diverge for negative operands — which matters exactly once per gradient,
// at whatever pre-wrap step (e.g. Plasma's `(value + colorShift) % 1`)
// happens before a contrast-sensitive reshape. Use this instead of `mod()`
// at that specific spot to stay numerically identical to the CPU path;
// everywhere else (palette wrap, angles, etc.) GLSL's native mod already
// matches JS's `((t % 1) + 1) % 1` idiom exactly, since that idiom IS
// floor-mod.
export const JS_MOD_GLSL = `
float jsMod(float x, float m) {
  return x - trunc(x / m) * m;
}`;

// Ports fieldCurve.ts's applyFieldContrast + mapValueToColor/getMappedColor
// verbatim to GLSL — same power-curve contrast reshape and linear/banded/
// cyclic palette lookup used by every CPU gradient's getMappedColor call,
// so switching a gradient to its GL renderer doesn't change how Contrast/
// Palette Mode/Bands behave. Splice this once into any field shader that
// needs it.
export function colorMappingGLSL(maxColors: number = MAX_FIELD_COLORS): string {
  return `
uniform float uContrast;
uniform int uPaletteMode; // 0 linear, 1 banded, 2 cyclic
uniform float uBands;
uniform vec3 uColors[${maxColors}];
uniform int uColorCount;

float applyFieldContrast(float t, float amount) {
  if (amount == 1.0) return t;
  float centered = t - 0.5;
  float s = centered < 0.0 ? -1.0 : 1.0;
  float shaped = s * pow(abs(centered) * 2.0, amount) * 0.5;
  return clamp(shaped + 0.5, 0.0, 1.0);
}

vec3 mapValueToColor(float t) {
  float tt = mod(t, 1.0);
  if (uPaletteMode == 1) {
    float steps = max(2.0, floor(uBands + 0.5));
    tt = min(1.0, floor(tt * steps) / (steps - 1.0));
  } else if (uPaletteMode == 2) {
    float repeats = max(1.0, floor(uBands + 0.5));
    tt = mod(tt * repeats, 1.0);
  }
  float n = float(uColorCount);
  float pos = tt * (n - 1.0);
  int idx = int(floor(pos));
  float frac = pos - float(idx);
  int idx2 = min(idx + 1, uColorCount - 1);
  return mix(uColors[idx], uColors[idx2], frac);
}

vec3 getMappedColor(float t) {
  return mapValueToColor(applyFieldContrast(t, uContrast));
}`;
}

export function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

export function linkProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }
  return program;
}

// One canvas + WebGL2 context shared by every field gradient, not one each.
// Browsers cap the number of live WebGL contexts a page can hold (commonly
// 8-16 before the oldest gets silently lost, going blank) — as more
// gradients get ported to this pattern, one context per gradient would risk
// running into that ceiling. Contexts are the scarce resource here, not
// programs: each gradient module compiles and caches its own WebGLProgram
// against this same shared context (cheap, no practical limit), and since
// every field shader fully repaints the fullscreen triangle each call,
// there's no cross-gradient state to worry about reusing the canvas.
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedGL: WebGL2RenderingContext | null = null;

export function getSharedFieldGL(width: number, height: number): { gl: WebGL2RenderingContext; canvas: HTMLCanvasElement } {
  if (!sharedCanvas || !sharedGL) {
    sharedCanvas = document.createElement('canvas');
    sharedGL = sharedCanvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false }) as WebGL2RenderingContext;
  }
  const w = Math.max(1, width), h = Math.max(1, height);
  if (sharedCanvas.width !== w) sharedCanvas.width = w;
  if (sharedCanvas.height !== h) sharedCanvas.height = h;
  return { gl: sharedGL, canvas: sharedCanvas };
}

export function drawFieldFullscreen(gl: WebGL2RenderingContext) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Every field shader that splices in colorMappingGLSL() sets its uniforms
// the same way — one shared place for that instead of copy-pasting the
// packing loop into each gradient's draw function.
export function setColorUniforms(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  gradientColors: { r: number; g: number; b: number }[],
  fieldContrast: number,
  paletteMode: string,
  paletteBands: number,
  maxColors: number = MAX_FIELD_COLORS,
) {
  const colorCount = Math.max(1, Math.min(maxColors, gradientColors.length));
  const colorArr = new Float32Array(maxColors * 3);
  for (let i = 0; i < colorCount; i++) {
    colorArr[i * 3] = gradientColors[i].r / 255;
    colorArr[i * 3 + 1] = gradientColors[i].g / 255;
    colorArr[i * 3 + 2] = gradientColors[i].b / 255;
  }
  gl.uniform1f(gl.getUniformLocation(program, 'uContrast'), fieldContrast);
  const paletteModeIdx = paletteMode === 'banded' ? 1 : paletteMode === 'cyclic' ? 2 : 0;
  gl.uniform1i(gl.getUniformLocation(program, 'uPaletteMode'), paletteModeIdx);
  gl.uniform1f(gl.getUniformLocation(program, 'uBands'), paletteBands);
  gl.uniform3fv(gl.getUniformLocation(program, 'uColors'), colorArr);
  gl.uniform1i(gl.getUniformLocation(program, 'uColorCount'), colorCount);
}

// Feature-detects what these field shaders need: a WebGL2 context and
// nothing else (no float framebuffers, no extensions — they render straight
// to the default RGBA8 backbuffer of an offscreen canvas). A much lower bar
// than Reaction-Diffusion GL's detectRDGLSupport, kept separate rather than
// shared so a device that fails RD's stricter float-framebuffer check can
// still get these simpler renderers. Memoized for the session.
let basicSupportCache: boolean | null = null;
export function detectFieldGLSupport(): boolean {
  if (basicSupportCache !== null) return basicSupportCache;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { antialias: false });
    basicSupportCache = !!gl;
  } catch {
    basicSupportCache = false;
  }
  return basicSupportCache;
}
