// A family of WebGL2 "styled field" gradients — Smoke, Glass, Mesh, Mercury,
// Contour, Tunnel, Nebula, Prism, Raindrops, Holographic, Waves, Halftone.
// Each is a pure function of (position, time) rendered in one fragment pass
// and colored through the shared palette machinery in glShared.ts
// (getMappedColor: Contrast, Palette Mode/Bands, and the sRGB/OKLab/OKLCH
// Blend all apply), so a new look inherits every existing color control
// instead of reinventing them.
//
// They share one pair of controls (fieldScale, fieldSpeed) rather than each
// carrying its own sliders: these are atmospheric looks where "how zoomed in"
// and "how fast" are the two knobs that matter, and a shared pair keeps the
// state/snapshot/UI surface to a single addition instead of one per style.
//
// There is deliberately no bespoke CPU twin per style (the older field
// gradients each have one). On a device without WebGL2 these fall back to the
// existing CPU Noise gradient — see _registry.ts — which is a graceful
// degrade rather than a blank canvas.
import { FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport, DITHER_GLSL } from './glShared';

export type StyleFieldId =
  | 'smoke' | 'glass' | 'mesh' | 'mercury' | 'contour' | 'tunnel'
  | 'nebula' | 'prism' | 'raindrops' | 'holographic' | 'waves' | 'halftone-screen';

// Shared noise toolkit + the per-pixel entry point. Each style supplies
// `vec3 shade(vec2 p, vec2 uv, float t)`:
//   p  — aspect-correct, centered, zoom-scaled plane coordinates (so features
//        stay round and the drag-to-move center / zoom work for free)
//   uv — raw 0-1 screen position (for styles anchored to the frame)
//   t  — seconds of animation time, already scaled by the Speed control
const PRELUDE = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uScale;
uniform float uTime;
uniform float uSeed;
uniform float uBass;
uniform float uMids;
uniform float uTreble;
in vec2 vUv;
out vec4 outColor;
${DITHER_GLSL}
${JS_MOD_GLSL}
${colorMappingGLSL()}

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n + 19.19));
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = m * p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}
// Three octaves only: broad, gently undulating surfaces for the styles that
// light a height field (Glass, Mercury) — the 5-octave fbm adds fine detail
// that turns a lit surface into noise once slopes are taken.
float fbm3(vec2 p) {
  float v = 0.0;
  float a = 0.55;
  mat2 m = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = m * p * 2.0 + vec2(1.7, 9.2);
    a *= 0.45;
  }
  return v;
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
`;

const MAIN = `
void main() {
  vec2 fp = vUv * uSize;
  vec2 p = (fp - uCenter) / uSize.y * uScale + vec2(uSeed * 1.7, uSeed * 2.3);
  outColor = vec4(antiBand(clamp(shade(p, vUv, uTime), 0.0, 1.0)), 1.0);
}`;

// Domain-warped fractal noise (the "warp the warp" construction) — wispy,
// folding tendrils that never repeat, drifting slowly.
const SMOKE = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.10)), fbm(p + vec2(5.2, 1.3) - t * 0.08));
  vec2 r = vec2(fbm(p + 3.6 * q + vec2(1.7, 9.2) + 0.12 * t), fbm(p + 3.6 * q + vec2(8.3, 2.8) - 0.10 * t));
  float f = fbm(p + 3.2 * r);
  float v = smoothstep(0.12, 0.88, f + 0.30 * length(q) - 0.10 + uBass * 0.12);
  vec3 col = getMappedColor(v);
  // Thin, dark gaps between the wisps sell the volume.
  col *= mix(0.45, 1.0, smoothstep(0.0, 0.55, v));
  return col;
}`;

// A smooth refractive slab: a height field lit like polished glass — broad
// specular streaks, a fresnel rim, and the palette sampled through a slightly
// bent lookup so colors appear refracted rather than painted on.
const GLASS = `
float glassH(vec2 p, float t) {
  return fbm3(p * 0.95 + vec2(t * 0.04, -t * 0.03)) * 1.6
       + 0.20 * sin(p.x * 1.2 + t * 0.25) * sin(p.y * 1.0 - t * 0.2);
}
vec3 shade(vec2 p, vec2 uv, float t) {
  float e = 0.03;
  float h = glassH(p, t);
  vec2 g = vec2(glassH(p + vec2(e, 0.0), t) - h, glassH(p + vec2(0.0, e), t) - h) / e;
  vec3 n = normalize(vec3(-g * 0.95, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.65, 0.65));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 60.0);
  float broad = pow(max(dot(n, H), 0.0), 7.0) * 0.07;
  float fres = pow(1.0 - max(n.z, 0.0), 2.2);
  float k = h * 0.85;
  vec3 base = getMappedColor(clamp(k, 0.0, 1.0));
  vec3 bent = getMappedColor(clamp(k + 0.55 * n.x - 0.4 * n.y, 0.0, 1.0));
  vec3 col = mix(base, bent, 0.7) * (0.55 + 0.5 * n.z);
  col += spec * (0.4 + uTreble * 0.4) + broad + fres * 0.12;
  return col;
}`;

// Apple-style mesh gradient: one soft color blob per palette color, drifting
// on slow Lissajous paths, blended by inverse-distance weighting. Blending is
// done in OKLab when the Blend setting asks for it so the soft overlaps stay
// clean instead of going muddy.
const MESH = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float asp = uSize.x / uSize.y;
  vec2 q = (uv - 0.5) * vec2(asp, 1.0) / max(uScale * 0.33, 0.05) + 0.5 * vec2(asp, 1.0);
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${12}; i++) {
    if (i >= uColorCount) break;
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 7.13, 3.7 + uSeed * 0.01));
    vec2 c = vec2(0.5 * asp, 0.5) + vec2(
      sin(t * (0.10 + 0.16 * h.x) + fi * 2.399 + h.y * 6.28) * 0.46 * asp,
      cos(t * (0.12 + 0.14 * h.y) + fi * 1.731 + h.x * 6.28) * 0.46);
    float d = length(q - c);
    float w = pow(1.0 / (d * d + 0.015), 1.55);
    w *= 1.0 + 0.5 * uBass * step(0.5, fract(fi * 0.5));
    vec3 col = uColors[i];
    acc += w * (uBlendMode == 0 ? col : rgbToOklab(col));
    wsum += w;
  }
  acc /= max(wsum, 1e-5);
  return uBlendMode == 0 ? acc : oklabToRgb(acc);
}`;

// Liquid chrome: steep, blobby height field shaded as a mirror — the palette
// is indexed by the reflected direction, so it bands and pools like metal
// reflecting a studio environment.
const MERCURY = `
float mercH(vec2 p, float t) {
  vec2 w = vec2(fbm3(p * 0.55 + t * 0.05), fbm3(p * 0.55 + 4.0 - t * 0.04));
  return fbm3(p * 0.5 + w * 1.5 + vec2(t * 0.03, 0.0)) * 2.4;
}
vec3 shade(vec2 p, vec2 uv, float t) {
  float e = 0.02;
  float h = mercH(p, t);
  vec2 g = vec2(mercH(p + vec2(e, 0.0), t) - h, mercH(p + vec2(0.0, e), t) - h) / e;
  vec3 n = normalize(vec3(-g * 0.7, 1.0));
  float env = 0.5 + 0.5 * sin(dot(n.xy, vec2(2.7, 1.9)) * 2.6 + h * 3.4);
  env = pow(env, 1.5);
  vec3 H = normalize(normalize(vec3(-0.4, 0.55, 0.75)) + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 110.0);
  vec3 col = getMappedColor(clamp(env, 0.0, 1.0));
  col *= 0.42 + 0.95 * env + uBass * 0.15;
  return col + spec * 0.85;
}`;

// Elevation-style isolines over a flowing height field: dim palette fill,
// anti-aliased lines, and a heavier line every fifth level.
const CONTOUR = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 w = vec2(fbm3(p * 0.5 + t * 0.03), fbm3(p * 0.5 - 5.0 - t * 0.025));
  float f = fbm3(p * 0.45 + w * 1.3 + vec2(0.0, t * 0.02));
  float levels = 14.0;
  float x = f * levels;
  float fw = max(fwidth(x), 1e-4);
  float d = abs(fract(x - 0.5) - 0.5) / fw;
  float line = 1.0 - smoothstep(0.0, 1.3, d);
  float major = 1.0 - smoothstep(0.0, 1.9, abs(fract(x / 5.0 - 0.5) - 0.5) * 5.0 / fw);
  vec3 fill = getMappedColor(clamp(f * 1.25 - 0.1, 0.0, 1.0));
  vec3 ink = getMappedColor(fract(f * 1.25 + 0.5));
  vec3 col = fill * 0.38;
  col = mix(col, ink * 1.15 + 0.1, line);
  col = mix(col, vec3(1.0), major * 0.55 * (0.7 + 0.3 * uMids));
  return col;
}`;

// Perspective tunnel: polar coordinates folded into rings and spokes that
// stream toward the viewer, with a twist and fog that deepens to the center.
const TUNNEL = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 q = (uv - 0.5) * vec2(uSize.x / uSize.y, 1.0) * 2.0;
  float r = max(length(q), 0.02);
  float a = atan(q.y, q.x);
  float depth = 1.0 / (r * uScale * 0.45);
  float z = depth * 1.15 + t * 0.7;
  float twist = a / TAU * 8.0 + depth * 0.18 + sin(t * 0.2) * 0.4;
  float rings = smoothstep(0.30, 0.50, abs(fract(z) - 0.5));
  float spokes = smoothstep(0.38, 0.5, abs(fract(twist) - 0.5));
  float v = fract(z * 0.5 + twist * 0.08);
  vec3 col = getMappedColor(v);
  col = mix(col, getMappedColor(fract(v + 0.5)), rings * 0.55);
  col *= 0.65 + 0.5 * (1.0 - rings) * (1.0 - spokes * 0.6);
  col *= smoothstep(0.0, 0.22, r) * (1.0 + uBass * 0.25);
  return col;
}`;

// Deep-space cloud: layered warped noise with dark voids, hot cores and a
// scatter of twinkling stars.
const NEBULA = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float n1 = fbm(p * 0.8 + t * 0.02);
  vec2 w = vec2(fbm(p + 3.0 + t * 0.04), fbm(p - 4.0 - t * 0.03));
  float n2 = fbm(p * 1.25 + w * 1.7);
  float cloud = smoothstep(0.45, 1.05, n2 * 1.2 + n1 * 0.30 + uBass * 0.08);
  float core = pow(cloud, 3.0);
  vec3 void_ = getMappedColor(0.0) * 0.18;
  vec3 col = mix(void_, getMappedColor(clamp(cloud * 0.7 + 0.05, 0.0, 1.0)), smoothstep(0.0, 0.7, cloud));
  col *= 0.18 + 0.62 * cloud;
  col += core * 0.14;
  vec2 g = floor(p * 16.0);
  float h = hash21(g);
  vec2 f = fract(p * 16.0) - 0.5 - (hash22(g) - 0.5) * 0.6;
  float star = smoothstep(0.085, 0.0, length(f)) * step(0.935, h) * (0.55 + 0.45 * sin(t * 2.0 + h * 40.0));
  return col + star * (1.0 - 0.6 * cloud);
}`;

// Light split by a faceted crystal: diagonal facets, each carrying its own
// slice of the palette, with the red/green/blue channels sampled at slightly
// different positions so edges fringe like real dispersion.
const PRISM = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 dir = vec2(cos(0.55), sin(0.55));
  float s = dot(p, dir) * 3.4 + sin(p.y * 1.7 + t * 0.18) * 0.9 + sin(p.x * 1.2 - t * 0.12) * 0.7;
  float id = floor(s);
  float local = fract(s);
  float base = hash21(vec2(id, 3.1)) * 0.7 + t * 0.03;
  float k = base + local * 0.45;
  vec3 c0 = getMappedColor(fract(k - 0.07));
  vec3 c1 = getMappedColor(fract(k));
  vec3 c2 = getMappedColor(fract(k + 0.07));
  vec3 col = vec3(c0.r, c1.g, c2.b);
  col *= 0.62 + 0.6 * (1.0 - local);
  float edge = smoothstep(0.035, 0.0, min(local, 1.0 - local));
  col += edge * (0.32 + 0.3 * uTreble);
  return col;
}`;

// Rain on still water: expanding rings spawned from a jittered grid, summed
// into a height field whose slope refracts the palette beneath.
const RAINDROPS = `
float ripples(vec2 p, float t) {
  vec2 sp = p * 2.6;
  vec2 id = floor(sp);
  float h = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = id + vec2(float(i), float(j));
      vec2 rnd = hash22(cell);
      vec2 c = cell + 0.15 + 0.7 * rnd;
      float ph = fract(t * 0.26 * (0.6 + rnd.x * 0.8) + rnd.y);
      float d = length(sp - c);
      float r = ph * 1.0;
      float env = exp(-pow((d - r) * 4.5, 2.0)) * (1.0 - ph) * (1.0 - ph);
      h += sin((d - r) * 26.0) * env;
    }
  }
  return h;
}
vec3 shade(vec2 p, vec2 uv, float t) {
  float e = 0.012;
  float h = ripples(p, t);
  vec2 g = vec2(ripples(p + vec2(e, 0.0), t) - h, ripples(p + vec2(0.0, e), t) - h) / e;
  vec2 bent = p + g * 0.028;
  float bgv = fbm(bent * 0.6 + vec2(t * 0.02, 0.0));
  vec3 col = getMappedColor(clamp(bgv * 1.2 - 0.05, 0.0, 1.0));
  vec3 n = normalize(vec3(-g * 0.05, 1.0));
  vec3 Hh = normalize(normalize(vec3(-0.4, 0.6, 0.7)) + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, Hh), 0.0), 40.0);
  col *= 0.82 + 0.22 * h;
  return col + spec * 0.55;
}`;

// Holographic foil: thin-film interference approximated by sampling the
// palette at per-channel phase offsets along a warped surface coordinate, with
// a sparkle where the film flips.
const HOLOGRAPHIC = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float h = fbm3(p * 0.5 + vec2(t * 0.04, -t * 0.03));
  float h2 = fbm3(p * 1.3 - t * 0.05);
  float film = h * 2.2 + h2 * 0.6 + dot(p, vec2(0.35, 0.5)) * 0.9 + t * 0.05 + uBass * 0.1;
  vec3 col = vec3(
    getMappedColor(fract(film)).r,
    getMappedColor(fract(film + 0.09)).g,
    getMappedColor(fract(film + 0.18)).b);
  float sp = pow(max(0.0, sin(film * 12.566 + h2 * 6.0)), 10.0) * 0.38;
  float l = luma(col);
  col = mix(vec3(l), col, 1.18);
  return col + sp;
}`;

// Flowing layered ribbons: stacked sine bands with soft shaded edges, each
// layer offset in phase so they glide over one another.
const WAVES = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec3 col = getMappedColor(0.0) * 0.32;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float y = p.y * 1.1 + (fi - 3.5) * 0.30
      + 0.30 * sin(p.x * (0.95 + fi * 0.09) + t * (0.26 + fi * 0.04) + fi * 1.3)
      + 0.09 * sin(p.x * 2.4 - t * 0.33 + fi * 2.1)
      + uBass * 0.05 * sin(fi + t);
    float thick = 0.62;
    float cover = smoothstep(0.0, 0.014, y) * (1.0 - smoothstep(thick - 0.05, thick, y));
    float k = clamp(y / thick, 0.0, 1.0);
    vec3 band = getMappedColor(fract(fi / 8.0 + 0.04 * t + 0.12 * k));
    vec3 lit = band * (0.55 + 0.65 * (1.0 - k)) + smoothstep(0.05, 0.0, y) * 0.35;
    col = mix(col, lit, cover);
  }
  return col;
}`;

// Dot-screen shading: a 45-degree grid whose dots grow with a smooth tone
// field — the printed-halftone look, colored from the palette.
const HALFTONE = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float cell = 0.105;
  float c45 = 0.70710678;
  vec2 r = vec2(c45 * p.x + c45 * p.y, -c45 * p.x + c45 * p.y);
  vec2 gp = r / cell;
  vec2 f = fract(gp) - 0.5;
  vec2 id = floor(gp);
  vec2 centerP = vec2(c45 * (id.x + 0.5) - c45 * (id.y + 0.5), c45 * (id.x + 0.5) + c45 * (id.y + 0.5)) * cell;
  float tone = fbm(centerP * 0.55 + vec2(t * 0.03, -t * 0.02)) * 1.25
             + 0.35 * sin(centerP.x * 0.9 + t * 0.3) * sin(centerP.y * 0.8 - t * 0.2) + uBass * 0.1;
  tone = smoothstep(0.12, 0.9, clamp(tone, 0.0, 1.0));
  float rad = sqrt(tone) * 0.54;
  float d = length(f);
  float aa = max(fwidth(d), 1e-3);
  float dotMask = 1.0 - smoothstep(rad - aa, rad + aa, d);
  vec3 paper = getMappedColor(0.0) * 0.14;
  vec3 ink = getMappedColor(clamp(tone * 1.1, 0.0, 1.0));
  return mix(paper, ink, dotMask);
}`;

const STYLE_BODIES: Record<StyleFieldId, string> = {
  smoke: SMOKE,
  glass: GLASS,
  mesh: MESH,
  mercury: MERCURY,
  contour: CONTOUR,
  tunnel: TUNNEL,
  nebula: NEBULA,
  prism: PRISM,
  raindrops: RAINDROPS,
  holographic: HOLOGRAPHIC,
  waves: WAVES,
  'halftone-screen': HALFTONE,
};

export const STYLE_FIELD_IDS = Object.keys(STYLE_BODIES) as StyleFieldId[];
export const isStyleFieldId = (id: string | null | undefined): id is StyleFieldId =>
  !!id && Object.prototype.hasOwnProperty.call(STYLE_BODIES, id);

const programs = new Map<string, WebGLProgram>();
let programsGL: WebGL2RenderingContext | null = null;
// A style whose shader fails to compile on this device is remembered so the
// registry falls back once, quietly, instead of retrying (and logging) every
// frame.
const failedStyles = new Set<string>();

export function detectStyleFieldGLSupport(): boolean {
  return detectFieldGLSupport();
}
export const hasStyleFieldFailed = (id: string): boolean => failedStyles.has(id);

// Animation clock. Lives here (not in per-gradient React state like the older
// gradients' *AnimTime values) because it is a single monotonic counter shared
// by every style — only one is ever on screen, and the shared Speed control is
// folded in as the time is accumulated so changing it never makes the picture
// jump.
let clock = 0;
let lastNow = 0;
function advanceClock(speed: number): number {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const dt = lastNow === 0 ? 0 : Math.min(0.1, (now - lastNow) / 1000);
  lastNow = now;
  clock += dt * speed;
  return clock;
}

function getProgram(gl: WebGL2RenderingContext, id: StyleFieldId): WebGLProgram {
  if (programsGL !== gl) {
    programs.clear();
    programsGL = gl;
  }
  let program = programs.get(id);
  if (!program) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, PRELUDE + STYLE_BODIES[id] + MAIN);
    programs.set(id, program);
  }
  return program;
}

export function drawStyleFieldGL(id: StyleFieldId, P: any): CanvasGradient | undefined { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    canvas, ctx, displayWidth, displayHeight, gradientColors, fieldContrast, paletteMode, paletteBands,
    centerX, centerY, zoom, structuralSeed, fieldScale, fieldSpeed,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
  } = P;
  if (canvas.width === 0 || canvas.height === 0) return undefined;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  let program: WebGLProgram;
  try {
    program = getProgram(gl, id);
  } catch (err) {
    failedStyles.add(id);
    throw err;
  }

  const audio = !!(isAudioEnabled && isAudioReactive);
  const time = advanceClock(Math.max(0, fieldSpeed ?? 1));
  const scale = 3 * (fieldScale ?? 1) / Math.max(0.05, zoom ?? 1);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), glCanvas.width, glCanvas.height);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), scale);
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
  // structuralSeed spans 0-1e6; wrapped so the hash noise keeps float precision.
  gl.uniform1f(gl.getUniformLocation(program, 'uSeed'), (structuralSeed ?? 0) % 97);
  gl.uniform1f(gl.getUniformLocation(program, 'uBass'), audio ? Math.min(1, audioSubBassLevel / 5) : 0);
  gl.uniform1f(gl.getUniformLocation(program, 'uMids'), audio ? Math.min(1, audioMidsLevel / 5) : 0);
  gl.uniform1f(gl.getUniformLocation(program, 'uTreble'), audio ? Math.min(1, audioTrebleLevel / 5) : 0);
  setColorUniforms(gl, program, gradientColors, fieldContrast, paletteMode, paletteBands);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return undefined;
}
