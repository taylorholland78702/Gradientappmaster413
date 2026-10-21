// A family of WebGL2 "styled field" gradients — Smoke, Glass, Mesh, Mercury,
// Contour, Tunnel, Nebula, Prism, Raindrops, Holographic, Waves, Halftone, and
// the dark single-light looks (Light Beam, Edge Glow, Curtains, Eclipse, Rays,
// Bokeh), plus Vortex, Spectral, Drape and Flow Mesh.
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
import { FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, detectFieldGLSupport, DITHER_GLSL, setSizeUniform, getSharedFieldGL } from './glShared';

export type StyleFieldId =
  | 'smoke' | 'glass' | 'mesh' | 'mercury' | 'contour' | 'tunnel'
  | 'nebula' | 'prism' | 'raindrops' | 'holographic' | 'waves' | 'halftone-screen'
  | 'light-beam' | 'edge-glow' | 'curtains' | 'eclipse' | 'rays' | 'bokeh'
  | 'vortex' | 'spectral' | 'drape' | 'flow-mesh'
  | 'plasma' | 'ribbon' | 'strands' | 'iridescent' | 'embers' | 'bands'
  | 'soft' | 'sheen';

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
// The two per-gradient shape sliders (constants/styleShapeControls.ts): 1.0 is the
// gradient's original look, and what each one does is specific to the gradient.
uniform float uA;
uniform float uB;
uniform float uExposure;
uniform int uTone;
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
// Exposure (in stops) then an optional tone curve, applied to the shaded color before
// it is clamped for output — so colors a shader pushes above 1.0 (hot cores,
// highlights) roll off instead of clipping flat. Off with 0 EV is the old plain clamp.
vec3 finish(vec3 c) {
  c = max(c, vec3(0.0)) * exp2(uExposure);
  if (uTone == 1) {
    c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  } else if (uTone == 2) {
    c = (1.0 - exp(-1.5 * c)) / (1.0 - exp(-1.5));
  }
  return clamp(c, 0.0, 1.0);
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

// Centered, aspect-correct, zoom-scaled position WITHOUT the structural-seed
// offset that shade()'s p carries. The radial looks (Eclipse, Rays, Bokeh) use
// this so their center follows the drag-to-move center instead of wandering
// off with the seed.
vec2 cpos() { return (vUv * uSize - uCenter) / uSize.y * uScale; }

// Turns a 0..1+ light intensity into color for the dark, single-light looks:
// near-black ground (the palette's first color, heavily darkened) rising
// through the palette as intensity grows, with a hot near-white core at the
// very top. Intensity above 1 is allowed and just burns toward white.
vec3 lightRamp(float I) {
  I = max(I, 0.0);
  vec3 deep = getMappedColor(0.0) * 0.10;
  vec3 c = getMappedColor(clamp(0.12 + 0.88 * I, 0.0, 1.0));
  float k = smoothstep(0.0, 0.8, I);
  return mix(deep, c, k) * (0.30 + 0.70 * smoothstep(0.0, 1.0, I)) + pow(clamp(I, 0.0, 1.5), 4.0) * 0.22;
}
`;

const MAIN = `
void main() {
  vec2 fp = vUv * uSize;
  vec2 p = (fp - uCenter) / uSize.y * uScale + vec2(uSeed * 1.7, uSeed * 2.3);
  outColor = vec4(antiBand(finish(shade(p, vUv, uTime))), 1.0);
}`;

// Domain-warped fractal noise (the "warp the warp" construction) — wispy,
// folding tendrils that never repeat, drifting slowly.
const SMOKE = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.10)), fbm(p + vec2(5.2, 1.3) - t * 0.08));
  vec2 r = vec2(fbm(p + 3.6 * uA * q + vec2(1.7, 9.2) + 0.12 * t), fbm(p + 3.6 * uA * q + vec2(8.3, 2.8) - 0.10 * t));
  float f = fbm(p + 3.2 * uA * r);
  float v = smoothstep(0.12, 0.88, f + 0.30 * length(q) - 0.10 + (uB - 1.0) * 0.25 + uBass * 0.12);
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
  vec3 n = normalize(vec3(-g * 0.95 * uA, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.65, 0.65));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 60.0);
  float broad = pow(max(dot(n, H), 0.0), 7.0) * 0.07;
  float fres = pow(1.0 - max(n.z, 0.0), 2.2);
  float k = h * 0.85;
  vec3 base = getMappedColor(clamp(k, 0.0, 1.0));
  vec3 bent = getMappedColor(clamp(k + 0.55 * n.x - 0.4 * n.y, 0.0, 1.0));
  vec3 col = mix(base, bent, 0.7) * (0.55 + 0.5 * n.z);
  col += (spec * (0.4 + uTreble * 0.4) + broad) * uB + fres * 0.12;
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
      sin(t * (0.10 + 0.16 * h.x) + fi * 2.399 + h.y * 6.28) * 0.46 * uB * asp,
      cos(t * (0.12 + 0.14 * h.y) + fi * 1.731 + h.x * 6.28) * 0.46 * uB);
    float d = length(q - c);
    float w = pow(1.0 / (d * d + 0.015 * uA * uA), 1.55);
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
  vec3 n = normalize(vec3(-g * 0.7 * uA, 1.0));
  float env = 0.5 + 0.5 * sin(dot(n.xy, vec2(2.7, 1.9)) * 2.6 + h * 3.4);
  env = pow(env, 1.5);
  vec3 H = normalize(normalize(vec3(-0.4, 0.55, 0.75)) + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), 110.0);
  vec3 col = getMappedColor(clamp(env, 0.0, 1.0));
  col *= 0.42 + 0.95 * env + uBass * 0.15;
  return col + spec * 0.85 * uB;
}`;

// Elevation-style isolines over a flowing height field: dim palette fill,
// anti-aliased lines, and a heavier line every fifth level.
const CONTOUR = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 w = vec2(fbm3(p * 0.5 + t * 0.03), fbm3(p * 0.5 - 5.0 - t * 0.025));
  float f = fbm3(p * 0.45 + w * 1.3 + vec2(0.0, t * 0.02));
  float levels = 14.0 * uA;
  float x = f * levels;
  float fw = max(fwidth(x), 1e-4);
  float d = abs(fract(x - 0.5) - 0.5) / fw;
  float line = 1.0 - smoothstep(0.0, 1.3 * uB, d);
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
  float z = depth * 1.15 * uB + t * 0.7;
  float twist = a / TAU * 8.0 + (depth * 0.18 + sin(t * 0.2) * 0.4) * uA;
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
  float cloud = smoothstep(0.45, 1.05, n2 * 1.2 + n1 * 0.30 + (uA - 1.0) * 0.25 + uBass * 0.08);
  float core = pow(cloud, 3.0);
  vec3 void_ = getMappedColor(0.0) * 0.18;
  vec3 col = mix(void_, getMappedColor(clamp(cloud * 0.7 + 0.05, 0.0, 1.0)), smoothstep(0.0, 0.7, cloud));
  col *= 0.18 + 0.62 * cloud;
  col += core * 0.14;
  vec2 g = floor(p * 16.0);
  float h = hash21(g);
  vec2 f = fract(p * 16.0) - 0.5 - (hash22(g) - 0.5) * 0.6;
  float star = smoothstep(0.085, 0.0, length(f)) * step(1.0 - 0.065 * uB, h) * (0.55 + 0.45 * sin(t * 2.0 + h * 40.0));
  return col + star * (1.0 - 0.6 * cloud);
}`;

// Light split by a faceted crystal: diagonal facets, each carrying its own
// slice of the palette, with the red/green/blue channels sampled at slightly
// different positions so edges fringe like real dispersion.
const PRISM = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 dir = vec2(cos(0.55), sin(0.55));
  float s = dot(p, dir) * 3.4 * uA + sin(p.y * 1.7 + t * 0.18) * 0.9 + sin(p.x * 1.2 - t * 0.12) * 0.7;
  float id = floor(s);
  float local = fract(s);
  float base = hash21(vec2(id, 3.1)) * 0.7 + t * 0.03;
  float k = base + local * 0.45;
  vec3 c0 = getMappedColor(fract(k - 0.07 * uB));
  vec3 c1 = getMappedColor(fract(k));
  vec3 c2 = getMappedColor(fract(k + 0.07 * uB));
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
  vec2 sp = p * 2.6 * uB;
  vec2 id = floor(sp);
  float h = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = id + vec2(float(i), float(j));
      vec2 rnd = hash22(cell);
      vec2 c = cell + 0.15 + 0.7 * rnd;
      float ph = fract(t * 0.26 * uA * (0.6 + rnd.x * 0.8) + rnd.y);
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
  float film = (h * 2.2 + h2 * 0.6 + dot(p, vec2(0.35, 0.5)) * 0.9) * uA + t * 0.05 + uBass * 0.1;
  vec3 col = vec3(
    getMappedColor(fract(film)).r,
    getMappedColor(fract(film + 0.09)).g,
    getMappedColor(fract(film + 0.18)).b);
  float sp = pow(max(0.0, sin(film * 12.566 + h2 * 6.0)), 10.0) * 0.38 * uB;
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
      + 0.30 * uA * sin(p.x * (0.95 + fi * 0.09) + t * (0.26 + fi * 0.04) + fi * 1.3)
      + 0.09 * sin(p.x * 2.4 - t * 0.33 + fi * 2.1)
      + uBass * 0.05 * sin(fi + t);
    float thick = 0.62 * uB;
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
  float cell = 0.105 * uA;
  float c45 = 0.70710678;
  vec2 r = vec2(c45 * p.x + c45 * p.y, -c45 * p.x + c45 * p.y);
  vec2 gp = r / cell;
  vec2 f = fract(gp) - 0.5;
  vec2 id = floor(gp);
  vec2 centerP = vec2(c45 * (id.x + 0.5) - c45 * (id.y + 0.5), c45 * (id.x + 0.5) + c45 * (id.y + 0.5)) * cell;
  float tone = fbm(centerP * 0.55 + vec2(t * 0.03, -t * 0.02)) * 1.25
             + 0.35 * sin(centerP.x * 0.9 + t * 0.3) * sin(centerP.y * 0.8 - t * 0.2) + uBass * 0.1;
  tone = smoothstep(0.12, 0.9, clamp(tone, 0.0, 1.0));
  float rad = sqrt(tone) * 0.54 * uB;
  float d = length(f);
  float aa = max(fwidth(d), 1e-3);
  float dotMask = 1.0 - smoothstep(rad - aa, rad + aa, d);
  vec3 paper = getMappedColor(0.0) * 0.14;
  vec3 ink = getMappedColor(clamp(tone * 1.1, 0.0, 1.0));
  return mix(paper, ink, dotMask);
}`;


// A shaft of light from an off-screen source: a cone whose width grows with
// distance, streaked by drifting noise across its width and fading with
// distance, over a faint ambient wash.
const LIGHT_BEAM = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  float ang = 0.78 + (uB - 1.0) * 0.6 + 0.10 * sin(t * 0.14);
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 src = vec2(-2.4, -2.2);
  vec2 d = c - src;
  float along = dot(d, dir);
  float perp = d.x * dir.y - d.y * dir.x;
  float width = (0.30 + 0.20 * max(along, 0.0)) * uA;
  float core = exp(-pow(perp / width, 2.0)) * smoothstep(0.0, 1.2, along);
  float streak = 0.72 + 0.28 * vnoise(vec2(perp * 5.0 / width, along * 0.5 - t * 0.18));
  float fall = exp(-max(along - 1.5, 0.0) * 0.16);
  float I = core * streak * fall * 1.15 * (1.0 + uBass * 0.45);
  float halo = 0.10 * exp(-max(along, 0.0) * 0.12) * exp(-pow(perp / (width * 3.0), 2.0));
  return lightRamp(I + halo);
}`;

// A glow welling up from the bottom edge, its crest rippled by slow noise.
const EDGE_GLOW = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  float fromBottom = 1.0 - uv.y;
  float wob = (fbm3(vec2(c.x * 0.9, t * 0.10)) - 0.45) * 0.30 * uB;
  float reach = (0.44 + uBass * 0.10) * uA;
  // The +0.2 keeps the crest's zero point below the frame so the glow never
  // clips to a flat saturated band at the very edge.
  float I = exp(-pow(max(fromBottom + wob + 0.2, 0.0) / reach, 1.35));
  I *= 0.88 + 0.12 * sin(c.x * 3.0 + t * 0.4);
  I += 0.10 * exp(-pow(uv.y / 0.30, 1.6));
  return lightRamp(I);
}`;

// Vertical folds of light rising from the bottom: two interfering sine
// harmonics set where each fold crests, with fine vertical grain.
const CURTAINS = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  float x = c.x * 1.1 * uA;
  float f1 = 0.5 + 0.5 * sin(x * 2.2 + 1.5 * sin(x * 1.1 + t * 0.15) + t * 0.20);
  float f2 = 0.5 + 0.5 * sin(x * 4.6 - t * 0.25 + 2.0 * fbm3(vec2(x * 0.8, t * 0.05)));
  float fold = mix(f1, f2, 0.30);
  float fromBottom = 1.0 - uv.y;
  float crest = (0.55 + 0.80 * fold + uBass * 0.15) * uB;
  float I = (0.30 + 0.70 * fold) * smoothstep(crest, 0.0, fromBottom) * 0.70;
  I += 0.10 * vnoise(vec2(x * 16.0, t * 0.3)) * smoothstep(0.9, 0.0, fromBottom);
  I += 0.14 * exp(-pow(fromBottom / 0.22, 1.5));
  return lightRamp(I);
}`;

// A dark disc ringed by a bright corona that swells brighter on one side and
// slowly turns, with a soft halo bleeding outward.
const ECLIPSE = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  float r = length(c);
  float a = atan(c.y, c.x);
  float R = (0.82 + uBass * 0.05) * uA;
  float side = 0.62 + 0.38 * cos(a - t * 0.12 - 0.8);
  float ring = exp(-pow((r - R) / (0.075 * uB), 2.0));
  float halo = exp(-max(r - R, 0.0) * 2.1 / uB) * 0.55 * smoothstep(R - 0.10, R + 0.05, r);
  float rays = 0.88 + 0.12 * sin(a * 11.0 + t * 0.3 + 3.0 * vnoise(vec2(a * 2.0, t * 0.1)));
  float I = (ring * 1.15 + halo * rays) * side;
  float inner = smoothstep(R - 0.02, R - 0.25, r) * 0.05;
  return lightRamp(I + inner);
}`;

// Light fanning out of a dark center: angular spokes (a coarse sine warped by
// noise, plus a fine grain) darkening toward the middle, over a soft vertical
// wash.
const RAYS = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  float r = length(c);
  float a = atan(c.y, c.x);
  float spokes = 0.5 + 0.5 * sin(a * floor(14.0 * uA + 0.5) + t * 0.28 + 2.0 * vnoise(vec2(a * 3.0, t * 0.2)));
  float grain = vnoise(vec2(a * 22.0, t * 0.15 + r * 0.4));
  float ray = pow(mix(spokes, grain, 0.5), 2.0);
  float reach = smoothstep(0.15, 1.8 * uB, r);
  float I = (0.10 + 0.55 * reach) * (0.55 + 0.75 * ray) + 0.28 * uv.y + uBass * 0.12 * reach;
  return lightRamp(I);
}`;

// Out-of-focus lights: three depth layers of soft discs drifting at different
// speeds, each with a faintly brighter rim, additively blended over near-black.
const BOKEH = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  vec3 acc = getMappedColor(0.0) * 0.10;
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float sz = (0.85 + 0.75 * fl) / uB;
    vec2 q = c / sz + vec2(t * 0.022 * (1.0 + fl), t * 0.016) + fl * 7.3;
    vec2 id = floor(q);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 cell = id + vec2(float(i), float(j));
        vec2 rnd = hash22(cell + fl * 13.0);
        vec2 cc = cell + 0.2 + 0.6 * rnd + 0.15 * vec2(sin(t * 0.2 + rnd.x * 6.28), cos(t * 0.17 + rnd.y * 6.28));
        float rad = (0.17 + 0.21 * hash21(cell * 1.7 + fl)) * uA;
        float d = length(q - cc);
        float disc = smoothstep(rad, rad * 0.80, d);
        float rim = smoothstep(rad * 0.68, rad, d) * smoothstep(rad + 0.025, rad, d);
        float a = (0.42 + 0.50 * hash21(cell * 3.1)) * (1.0 - 0.20 * fl) * (1.0 + uBass * 0.5);
        vec3 dc = getMappedColor(fract(hash21(cell * 5.3) * 0.9 + 0.05 * fl));
        acc += dc * 1.25 * (disc * 0.55 + rim * 0.65) * a;
      }
    }
  }
  return acc;
}`;

// A tilted glowing ring on black — an orbit seen at an angle — with bright
// hotspots circling it, a thinner inner ring running the other way, and a soft
// halo.
const VORTEX = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  float rot = 0.30 + 0.14 * sin(t * 0.12);
  float cs = cos(rot), sn = sin(rot);
  vec2 q = vec2(cs * c.x + sn * c.y, -sn * c.x + cs * c.y);
  q.y *= 1.75 * uB;
  float r = length(q);
  float a = atan(q.y, q.x);
  float R = (1.32 + uBass * 0.07) * uA;
  float ring = exp(-pow((r - R) / 0.12, 2.0));
  float inner = exp(-pow((r - R * 0.80) / 0.055, 2.0)) * 0.50;
  float hot = pow(0.5 + 0.5 * cos(a * 2.0 - t * 0.5 + 0.8 * sin(t * 0.2)), 2.5);
  float hot2 = pow(0.5 + 0.5 * cos(a * 3.0 + t * 0.35), 3.0);
  float halo = exp(-abs(r - R) * 2.0) * 0.30;
  float I = ring * (0.28 + 0.95 * hot) + inner * (0.35 + 0.65 * hot2) + halo * (0.45 + 0.55 * hot);
  return lightRamp(I);
}`;

// A rainbow dispersion arc sweeping out of a corner over a flat base: the
// palette is sampled at a different position for each of R, G and B, so the arc
// fringes like light split by glass.
const SPECTRAL = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  vec2 corner = vec2(-2.2, -1.7) + 0.12 * vec2(sin(t * 0.13), cos(t * 0.17));
  float d = length(c - corner);
  float D = (2.45 + 0.20 * sin(t * 0.18) + uBass * 0.12) * uA;
  float band = exp(-pow((d - D) / (0.95 * uB), 2.0));
  float ph = (d - D) * 0.42 + 0.5 + t * 0.02;
  vec3 spec = vec3(
    getMappedColor(fract(ph - 0.07)).r,
    getMappedColor(fract(ph)).g,
    getMappedColor(fract(ph + 0.07)).b);
  vec3 base = getMappedColor(0.55) * 0.62;
  float inner = smoothstep(D, D - 1.8, d) * 0.28;
  vec3 col = mix(base, spec * 1.1, band);
  return col + inner * getMappedColor(0.85) * 0.35;
}`;

// Soft fabric folds: a height field of crossing diagonal swells, lit from one
// corner, mapped through the palette from shadow to highlight.
const DRAPE = `
float drapeH(vec2 p, float t) {
  vec2 q = p * 0.75;
  float h = 0.65 * sin(dot(q, vec2(0.9, 0.5)) * 1.7 + t * 0.16 + 1.1 * sin(dot(q, vec2(-0.3, 0.9)) * 1.1 - t * 0.10));
  h += 0.22 * sin(dot(q, vec2(0.6, -0.8)) * 2.6 - t * 0.20 + 0.7 * fbm3(q * 0.5 + t * 0.03));
  return h;
}
vec3 shade(vec2 p, vec2 uv, float t) {
  float e = 0.03;
  float h = drapeH(p, t);
  vec2 g = vec2(drapeH(p + vec2(e, 0.0), t) - h, drapeH(p + vec2(0.0, e), t) - h) / e;
  vec3 n = normalize(vec3(-g * 0.85 * uA, 1.0));
  vec3 L = normalize(vec3(-0.55, -0.45, 0.7));
  float diff = dot(n, L);
  // Shade within a narrow slice of the palette (so folds read as light and
  // shadow, not as a rainbow), with the slice itself drifting slowly across it.
  float drift = 0.5 + 0.22 * sin(t * 0.07 + dot(p, vec2(0.25, 0.15)));
  float k = drift + 0.55 * (diff - 0.66) + 0.05 * h + uBass * 0.05;
  vec3 col = getMappedColor(clamp(k, 0.0, 1.0));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float sheen = pow(max(dot(n, H), 0.0), 22.0) * 0.20 * uB;
  return col * (0.80 + 0.30 * diff) + sheen;
}`;

// A mesh gradient (one drifting color blob per palette color) whose lookup
// coordinates are pushed around by a slow flow field, with a satin sheen
// riding over the folds — like silk stretched over colored light.
const FLOW_MESH = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float asp = uSize.x / uSize.y;
  vec2 q = (uv - 0.5) * vec2(asp, 1.0) / max(uScale * 0.33, 0.05) + 0.5 * vec2(asp, 1.0);
  vec2 flow = vec2(fbm3(q * 1.1 + vec2(t * 0.05, 0.0)), fbm3(q * 1.1 + vec2(4.0, -t * 0.04))) - 0.5;
  vec2 w = q + flow * 0.85 * uA;
  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < ${12}; i++) {
    if (i >= uColorCount) break;
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 7.13, 3.7 + uSeed * 0.01));
    vec2 c = vec2(0.5 * asp, 0.5) + vec2(
      sin(t * (0.09 + 0.14 * h.x) + fi * 2.399 + h.y * 6.28) * 0.46 * asp,
      cos(t * (0.11 + 0.12 * h.y) + fi * 1.731 + h.x * 6.28) * 0.46);
    float d = length(w - c);
    float wt = pow(1.0 / (d * d + 0.012), 1.9);
    vec3 col = uColors[i];
    acc += wt * (uBlendMode == 0 ? col : rgbToOklab(col));
    wsum += wt;
  }
  acc /= max(wsum, 1e-5);
  vec3 base = uBlendMode == 0 ? acc : oklabToRgb(acc);
  float fold = fbm3(w * 1.5 + vec2(t * 0.03, 0.0)) * 5.5 + t * 0.2;
  float sat = pow(0.5 + 0.5 * sin(fold), 4.0);
  vec3 col = base * (0.82 + 0.30 * sat * uB) + sat * 0.14 * uB * (1.0 + uBass * 0.5);
  return mix(vec3(luma(col)), col, 1.15);
}`;


// Classic demoscene plasma: four interfering sine fields summed and fed through
// a sine so the palette swings back and forth without a seam.
const PLASMA = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 q = p * 1.2 * uA;
  float v = sin(q.x * 1.6 + t * 0.35);
  v += sin(q.y * 1.3 + t * 0.28);
  v += sin((q.x + q.y) * 1.1 + t * 0.22);
  v += sin(length(q + vec2(sin(t * 0.17), cos(t * 0.13)) * 1.5) * 2.2 - t * 0.4);
  float k = 0.5 + 0.5 * sin(v * 0.9 * uB + uBass * 0.6);
  // Push toward the palette's ends: a plain sine spends most of its time near the
  // middle, which averages a varied palette into one muddy tone.
  k = mix(k, smoothstep(0.05, 0.95, k), 0.5);
  return getMappedColor(k) * (0.88 + 0.24 * sin(v * 0.5 + t * 0.1));
}`;

// One wide ribbon bending across the frame, shaded across its width with the
// palette twisting along its length.
const RIBBON = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float y = p.y * 0.9 + 0.55 * sin(p.x * 0.8 + t * 0.22) + 0.25 * sin(p.x * 1.9 - t * 0.31);
  float w = 0.55 * uA;
  float d = abs(y) / w;
  float body = 1.0 - smoothstep(0.86, 1.0, d);
  float shade = 1.0 - d * d;
  float k = 0.5 + 0.5 * sin(p.x * 0.9 + y * 3.0 * uB + t * 0.3);
  vec3 bg = getMappedColor(0.0) * 0.30;
  vec3 col = getMappedColor(k) * (0.50 + 0.50 * shade);
  col += pow(max(shade, 0.0), 6.0) * 0.07 * (1.0 + uTreble * 0.5);
  return mix(bg, col, body);
}`;

// A bundle of thin flowing lines, each its own palette color, added together
// over a dark ground so crossings glow.
const STRANDS = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec3 col = getMappedColor(0.0) * 0.20;
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    float y = p.y * 1.3 + (fi - 6.5) * 0.18 * uA
      + 0.35 * sin(p.x * (0.7 + fi * 0.05) + t * (0.2 + fi * 0.02) + fi)
      + 0.10 * sin(p.x * 2.3 - t * 0.3 + fi * 1.7)
      + uBass * 0.04 * sin(fi + t);
    float line = smoothstep(0.034 * uB, 0.0, abs(y));
    col += getMappedColor(fract(fi / 14.0 + 0.03 * t)) * line * 0.85;
  }
  return col;
}`;

// Oil on water: a slowly shifting film whose color comes from the palette
// sampled at a different phase for each of R, G and B, triangle-folded so there
// is no seam where the palette wraps.
const IRIDESCENT = `
float tri(float x) { return abs(fract(x) * 2.0 - 1.0); }
vec3 shade(vec2 p, vec2 uv, float t) {
  float h = fbm3(p * 0.6 * uA + vec2(t * 0.03, -t * 0.02));
  float film = h * 3.0 * uB + dot(p, vec2(0.20, 0.35)) + t * 0.04 + uBass * 0.08;
  vec3 col = vec3(
    getMappedColor(tri(film)).r,
    getMappedColor(tri(film + 0.10)).g,
    getMappedColor(tri(film + 0.20)).b);
  col = mix(vec3(luma(col)), col, 1.12);
  return col * (0.80 + 0.30 * h);
}`;

// Sparks drifting up out of a glowing floor: three depth layers of tiny, flickering
// points over near-black.
const EMBERS = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 c = cpos();
  // uv.y is 1 at the bottom of the frame: heat is highest there and fades as sparks rise.
  float heat = clamp(uv.y, 0.0, 1.0);
  vec3 acc = getMappedColor(0.0) * 0.07;
  acc += getMappedColor(0.30) * 0.34 * pow(heat, 3.2);
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    vec2 q = c * (1.5 + 0.9 * fl) * uB;
    q.y -= t * (0.30 + 0.16 * fl);
    q += fl * 5.7;
    vec2 id = floor(q);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 cell = id + vec2(float(i), float(j));
        vec2 rnd = hash22(cell + fl * 17.0);
        if (rnd.x < 0.42) continue;
        vec2 cc = cell + 0.2 + 0.6 * rnd + vec2(0.22 * sin(t * 0.8 + rnd.x * 6.28 + q.y * 0.6), 0.0);
        vec2 dv = q - cc;
        // Stretched along the rise so each spark leaves a short streak.
        float d = length(vec2(dv.x, dv.y * 0.55));
        float r = (0.035 + 0.045 * rnd.y) * uA;
        float flick = 0.55 + 0.45 * sin(t * 2.4 + rnd.x * 40.0);
        float core = exp(-pow(d / r, 2.0));
        float halo = 0.22 * exp(-pow(d / (r * 3.2), 2.0));
        float life = 0.35 + 0.65 * heat;
        // Hot, bright sparks low in the frame cool toward the palette's early colors as they rise.
        vec3 sc = getMappedColor(clamp(0.30 + 0.65 * (heat * 0.75 + rnd.y * 0.25), 0.0, 1.0));
        acc += sc * (core * 1.5 + halo) * flick * life * (1.0 + uTreble * 0.5);
      }
    }
  }
  return acc;
}`;

// Soft-edged horizontal color bands whose boundaries undulate.
const BANDS = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float w = p.y * 0.8 + (0.25 * sin(p.x * 0.9 + t * 0.2) + 0.12 * sin(p.x * 2.1 - t * 0.27 + p.y)) * uA;
  float N = 6.0;
  float s = abs(fract(w * 0.24 + t * 0.012 + uBass * 0.05) * 2.0 - 1.0) * N;
  float id = floor(s);
  float f = fract(s);
  float e = smoothstep(1.0 - 0.12 * uB, 1.0, f);
  vec3 a = getMappedColor(clamp(id / (N - 1.0), 0.0, 1.0));
  vec3 b = getMappedColor(clamp((id + 1.0) / (N - 1.0), 0.0, 1.0));
  return mix(a, b, e);
}`;

// Very diffuse pastel haze: large, slow clouds with no dark gaps, so colors melt
// into each other.
const SOFT = `
vec3 shade(vec2 p, vec2 uv, float t) {
  vec2 q = p * 0.32 * uA;
  float f = fbm3(q + vec2(t * 0.020, -t * 0.015));
  float g = fbm3(q * 1.2 + 4.0 + f * 1.1 - t * 0.010);
  float k = clamp(0.5 + (g - 0.5) * 1.7 * uB + uBass * 0.05, 0.0, 1.0);
  vec3 col = getMappedColor(k);
  return mix(vec3(luma(col)), col, 0.92);
}`;

// Brushed satin: streaky stretched noise with broad highlight bands sweeping
// across it.
const SHEEN = `
vec3 shade(vec2 p, vec2 uv, float t) {
  float h = fbm3(vec2(p.x * 0.30 / uA, p.y * 0.55) + t * 0.015);
  float band = dot(p, vec2(0.94, 0.34)) * 0.5 + h * 1.5 + t * 0.05;
  float sheenL = pow(0.5 + 0.5 * sin(band * 2.2), 3.0);
  vec3 base = getMappedColor(clamp(0.18 + 0.55 * h, 0.0, 1.0));
  vec3 hi = getMappedColor(0.95);
  vec3 col = mix(base, hi, sheenL * 0.55 * uB);
  col += sheenL * sheenL * 0.10 * uB * (1.0 + uTreble * 0.5);
  return col * (0.82 + 0.28 * h);
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
  'light-beam': LIGHT_BEAM,
  'edge-glow': EDGE_GLOW,
  curtains: CURTAINS,
  eclipse: ECLIPSE,
  rays: RAYS,
  bokeh: BOKEH,
  vortex: VORTEX,
  spectral: SPECTRAL,
  drape: DRAPE,
  'flow-mesh': FLOW_MESH,
  plasma: PLASMA,
  ribbon: RIBBON,
  strands: STRANDS,
  iridescent: IRIDESCENT,
  embers: EMBERS,
  bands: BANDS,
  soft: SOFT,
  sheen: SHEEN,
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
    centerX, centerY, zoom, structuralSeed, fieldScale, fieldAnimTime, fieldShapeA, fieldShapeB, fieldExposure, fieldTone,
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
  // The app-driven clock (InteractiveGradient.tsx): frozen while paused, scaled by the
  // playback speed and this gradient's Speed, and synced to Display windows.
  const time = fieldAnimTime ?? 0;
  const scale = 3 * (fieldScale ?? 1) / Math.max(0.05, zoom ?? 1);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  setSizeUniform(gl, program, glCanvas.width, glCanvas.height);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), scale);
  gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
  // structuralSeed spans 0-1e6; wrapped so the hash noise keeps float precision.
  gl.uniform1f(gl.getUniformLocation(program, 'uA'), fieldShapeA ?? 1);
  gl.uniform1f(gl.getUniformLocation(program, 'uB'), fieldShapeB ?? 1);
  gl.uniform1f(gl.getUniformLocation(program, 'uExposure'), fieldExposure ?? 0);
  gl.uniform1i(gl.getUniformLocation(program, 'uTone'), fieldTone === 'aces' ? 1 : fieldTone === 'soft' ? 2 : 0);
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
