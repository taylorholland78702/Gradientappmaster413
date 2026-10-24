// Shared WebGL2 infrastructure for the per-pixel "field" gradients (Noise,
// ...) — the ones that are a pure function of (x, y, t) with no
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

import { createQualityController, type QualityController } from '../../utils/adaptiveQuality';
import { getActivePaletteMap, biasToGamma } from '../../utils/color';

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

// GLSL twin of color.ts's blendRgb: palette colors mix with a plain per-channel lerp in sRGB. The three helpers are the
// hooks every shader that lerps between palette stops (or accumulates many colors, like the mesh gradients) calls in
// place of mix(), kept so those shaders need no changes.
export const BLEND_COLORS_GLSL = `
vec3 blendIn(vec3 c) { return c; }
vec3 blendOut(vec3 c) { return c; }
vec3 blendColors(vec3 a, vec3 b, float t) { return mix(a, b, t); }

// Palette lookup with stop positions, Bias and Sharpness — the GLSL twin of
// paletteSegmentFor in color.ts (keep them in step). Needs uColors and
// uColorCount declared before this is spliced in. With even stops, Bias 0.5
// and Sharpness 0 it reduces to the plain even-spaced linear blend every
// shader used before these controls existed.
uniform float uStops[${MAX_FIELD_COLORS}];
uniform float uBiasGamma; // 1 = neutral
uniform float uSharp;     // 0 = linear
float sharpenFrac(float f) {
  if (uSharp <= 0.0) return f;
  float half_ = 0.5 - (0.5 - 0.03) * uSharp;
  float x = clamp((f - (0.5 - half_)) / (2.0 * half_), 0.0, 1.0);
  float sm = x * x * (3.0 - 2.0 * x);
  return mix(f, sm, uSharp);
}
vec3 paletteLookup(float t) {
  if (uColorCount <= 1) return uColors[0];
  float tt = clamp(t, 0.0, 1.0);
  if (uBiasGamma != 1.0) tt = pow(tt, uBiasGamma);
  int i0 = 0;
  for (int k = 1; k < ${MAX_FIELD_COLORS} - 1; k++) {
    if (k >= uColorCount - 1) break;
    if (tt >= uStops[k]) i0 = k;
  }
  float a = uStops[i0];
  float b = uStops[i0 + 1];
  float f = b > a ? clamp((tt - a) / (b - a), 0.0, 1.0) : (tt >= b ? 1.0 : 0.0);
  return blendColors(uColors[i0], uColors[i0 + 1], sharpenFrac(f));
}`;

// Uploads everything paletteLookup/blendColors read besides the colors
// themselves: the stop positions, Bias (as a gamma) and
// Sharpness. `colorCount` is how many colors were uploaded; custom stops only
// apply when there is exactly one per uploaded color (otherwise even spacing).
export function setPaletteMapUniforms(gl: WebGL2RenderingContext, program: WebGLProgram, colorCount: number) {
  const { stops, bias, sharp } = getActivePaletteMap();
  const arr = new Float32Array(MAX_FIELD_COLORS);
  const custom = stops && stops.length === colorCount;
  for (let i = 0; i < MAX_FIELD_COLORS; i++) {
    arr[i] = custom ? stops![i] : colorCount > 1 ? i / (colorCount - 1) : 0;
  }
  gl.uniform1fv(gl.getUniformLocation(program, 'uStops'), arr);
  gl.uniform1f(gl.getUniformLocation(program, 'uBiasGamma'), biasToGamma(bias));
  gl.uniform1f(gl.getUniformLocation(program, 'uSharp'), sharp);
}

// Anti-banding dither. A screen shows 256 levels per channel, so a slow
// gradient quantizes into flat strips with a one-level jump at each edge, and
// the eye picks the edges out. Adding a tiny random offset (up to +/-1 level,
// triangular distribution, independent per channel) BEFORE the value is
// rounded to 8 bits trades those strips for noise too fine to see. The
// amplitude fades to zero at exactly 0 and 1 so flat black/white stay clean,
// and the noise is a pure function of the pixel position, so it is static
// (no shimmer) and identical frame to frame. Call it on the final color.
export const DITHER_GLSL = `
uint ditherHash(uint x) {
  x ^= x >> 16;
  x *= 0x7feb352dU;
  x ^= x >> 15;
  x *= 0x846ca68bU;
  x ^= x >> 16;
  return x;
}
float ditherUnit(uint h) { return float(h >> 8) * (1.0 / 16777216.0); }
vec3 antiBand(vec3 c) {
  uvec2 px = uvec2(gl_FragCoord.xy);
  uint h0 = ditherHash(px.x + ditherHash(px.y + 0x68e31da4U));
  uint h1 = ditherHash(h0 ^ 0x9e3779b9U);
  uint h2 = ditherHash(h1 + 0x85ebca6bU);
  uint h3 = ditherHash(h2 ^ 0xc2b2ae35U);
  uint h4 = ditherHash(h3 + 0x27d4eb2fU);
  uint h5 = ditherHash(h4 ^ 0x165667b1U);
  vec3 n = vec3(ditherUnit(h0), ditherUnit(h1), ditherUnit(h2))
         + vec3(ditherUnit(h3), ditherUnit(h4), ditherUnit(h5)) - 1.0;
  vec3 a = clamp(min(c, 1.0 - c) * 255.0, 0.0, 1.0);
  return clamp(c + n * a / 255.0, 0.0, 1.0);
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
${BLEND_COLORS_GLSL}

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
  return paletteLookup(tt);
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

// `width`/`height` are the DISPLAY size callers have always passed; the canvas
// actually comes back at the frame's render size (see beginGLFrame above).
export function getSharedFieldGL(width: number, height: number): { gl: WebGL2RenderingContext; canvas: HTMLCanvasElement } {
  if (!sharedCanvas || !sharedGL) {
    sharedCanvas = document.createElement('canvas');
    sharedGL = sharedCanvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false }) as WebGL2RenderingContext;
  }
  const w = Math.max(1, Math.round(width * frameScaleX)), h = Math.max(1, Math.round(height * frameScaleY));
  if (sharedCanvas.width !== w) sharedCanvas.width = w;
  if (sharedCanvas.height !== h) sharedCanvas.height = h;
  return { gl: sharedGL, canvas: sharedCanvas };
}

// ---------------------------------------------------------------------------
// Full-resolution rendering for everything that runs on the shared GL canvas
//
// The GL gradients and GL effects used to render into a canvas the size of the
// display in CSS pixels and let drawImage stretch it over the main canvas,
// whose backing store is display size x resolution multiplier (2x on a Retina
// screen) -- a quarter of the pixels the screen actually has.
//
// useCanvasDraw now calls beginGLFrame once per frame; from then on
// getSharedFieldGL hands back a canvas at the frame's render size (the main
// canvas's backing resolution, possibly scaled down -- see below) no matter
// what size its caller asked for. Callers keep passing the display size and
// keep working in display (CSS) pixels: setSizeUniform still reports the
// display size as uSize while the viewport is the finer render size, so
// `vUv * uSize` just lands on sub-pixel positions and every center, radius,
// blur distance and scale a shader was written against keeps its meaning. The
// look is unchanged; the sampling is denser.
//
// It is one canvas and one context for gradient AND effect stages on purpose:
// the effect pipeline chains them through shared ping-pong textures, which
// can't cross contexts, and a single size per frame means nothing ever resizes
// the drawing buffer mid-frame.
// ---------------------------------------------------------------------------

// Per-frame fragment budgets. A Retina display is ~5M pixels, which light
// shaders handle easily but the iteration-heavy ones (Julia, Caustics, ...)
// may not on a weak GPU, so those get a lower ceiling. Over budget, the render
// scales down uniformly (never below the display's own CSS-pixel size) and is
// upscaled by the final drawImage.
export const FIELD_PIXEL_BUDGET = 4_200_000;
export const HEAVY_FIELD_PIXEL_BUDGET = 2_600_000;
const HEAVY_GRADIENTS = new Set(['julia', 'caustics', 'noise', 'marble', 'metaballs', 'voronoi', 'lava-lamp', 'embers', 'bokeh', 'waves', 'spectral', 'prism']);
// The slowest gradients overall (ranked in the performance audit). They may also drop below the display's native size
// when frames are still slow after every normal step (see EMERGENCY_FLOORS in adaptiveQuality.ts).
const SLOW_GRADIENTS = new Set([...HEAVY_GRADIENTS, 'raindrops', 'iridescent', 'glass', 'contour', 'ring']);

// The render-target size for a frame: the main canvas's backing size, scaled
// down uniformly if it exceeds `budget` pixels, but never below the display
// size (nor below the canvas itself when that is smaller, as it is when effects
// scale resolution down).
export function fieldRenderDims(
  canvasWidth: number, canvasHeight: number, displayWidth: number, displayHeight: number, budget: number = FIELD_PIXEL_BUDGET,
): { w: number; h: number } {
  let w = canvasWidth > 0 ? canvasWidth : displayWidth;
  let h = canvasHeight > 0 ? canvasHeight : displayHeight;
  const px = w * h;
  if (px > budget) {
    const k = Math.sqrt(budget / px);
    w = Math.max(Math.min(displayWidth, w), Math.round(w * k));
    h = Math.max(Math.min(displayHeight, h), Math.round(h * k));
  }
  return { w, h };
}

// One quality controller per gradient type (only one is ever on screen, but a
// heavy gradient's learned level shouldn't be forgotten when you flip to a
// light one and back -- that would replay a slow stretch every time). The frame
// interval each watches is the whole frame's (gradient + effects), since that
// is what decides whether the page feels smooth.
const frameQualityByGradient = new Map<string, QualityController>();
let lastFrameT = 0;
let lastFrameKey: string | null = null;
let frameScaleX = 1;
let frameScaleY = 1;
let frameLogicalSize: { w: number; h: number } | null = null;

// While a high-resolution export is rendering, every field gradient draws at the
// canvas's full backing size: no pixel budget and no adaptive downscale.
let glExportMode = false;
export function setGLExportMode(on: boolean) { glExportMode = on; }

export function beginGLFrame(args: {
  canvasWidth: number; canvasHeight: number; displayWidth: number; displayHeight: number; gradientType?: string | null;
}) {
  const { canvasWidth, canvasHeight, displayWidth, displayHeight } = args;
  const key = String(args.gradientType ?? '');
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  // Switching gradients resets the interval clock so the gap between them isn't
  // read as one slow frame.
  if (key !== lastFrameKey) {
    lastFrameKey = key;
    lastFrameT = 0;
  }
  let quality = frameQualityByGradient.get(key);
  if (!quality) {
    quality = createQualityController({ emergency: SLOW_GRADIENTS.has(key) });
    frameQualityByGradient.set(key, quality);
  }
  const scale = glExportMode ? 1 : quality.update(lastFrameT ? now - lastFrameT : 0);
  lastFrameT = now;

  const budget = glExportMode ? Number.POSITIVE_INFINITY : HEAVY_GRADIENTS.has(key) ? HEAVY_FIELD_PIXEL_BUDGET : FIELD_PIXEL_BUDGET;
  const full = fieldRenderDims(canvasWidth, canvasHeight, displayWidth, displayHeight, budget);
  // Scale the full target down, but never below the display's CSS-pixel size
  // (or the canvas itself when that is smaller) -- the floor is the old behavior.
  const floor = glExportMode ? 1 : quality.floor;
  const minW = Math.round(Math.min(displayWidth, full.w) * floor), minH = Math.round(Math.min(displayHeight, full.h) * floor);
  const w = Math.max(minW, Math.round(full.w * scale));
  const h = Math.max(minH, Math.round(full.h * scale));
  frameScaleX = displayWidth > 0 ? w / displayWidth : 1;
  frameScaleY = displayHeight > 0 ? h / displayHeight : 1;
  frameLogicalSize = { w: displayWidth, h: displayHeight };
}

// The current frame's render size for a given display size (display size itself
// if beginGLFrame hasn't run).
export function frameRenderSize(displayWidth: number, displayHeight: number): { w: number; h: number } {
  return { w: Math.max(1, Math.round(displayWidth * frameScaleX)), h: Math.max(1, Math.round(displayHeight * frameScaleY)) };
}

// Sets uSize to the display size during a frame (regardless of the actual render
// target), so shader math written in CSS pixels keeps working at any render
// scale; outside a frame it is the target size, as before.
export function setSizeUniform(gl: WebGL2RenderingContext, program: WebGLProgram, width: number, height: number) {
  const s = frameLogicalSize;
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), s ? s.w : width, s ? s.h : height);
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
  setPaletteMapUniforms(gl, program, colorCount);
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
  // Adding ?nogl to the page URL pretends WebGL2 is unavailable, to exercise (and
  // let support reproduce) the CPU fallbacks without needing an old browser.
  try {
    if (new URLSearchParams(window.location.search).has('nogl')) return (basicSupportCache = false);
  } catch { /* no window/location: fall through to the real check */ }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { antialias: false });
    basicSupportCache = !!gl;
  } catch {
    basicSupportCache = false;
  }
  return basicSupportCache;
}
