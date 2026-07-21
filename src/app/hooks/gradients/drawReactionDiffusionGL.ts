// WebGL2 proof-of-concept renderer for Reaction-Diffusion — see the CPU
// version (drawReactionDiffusion.ts) for the reference implementation and
// full commentary on the Gray-Scott math/stability tuning this must match.
// This file replicates that same math on the GPU (ping-ponged RGBA32F
// framebuffers, one step-shader pass per simulation step) instead of a
// per-frame CPU loop over two Float32Arrays, for headroom at higher
// resolutions/framerates. If the browser/GPU can't support the floating-
// point render targets this needs (checked once via detectRDGLSupport,
// memoized), _registry.ts falls back to the CPU implementation for the
// whole session — this file is never reached in that case.
import { RGB } from '../../utils/fieldCurve';

const RD_W = 220, RD_H = 140;
const MAX_COLORS = 12;
const MAX_SPRINKLES = 16;

const VERT_SRC = `#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 pos = verts[gl_VertexID];
  vUv = (pos + 1.0) * 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

// One Gray-Scott explicit-Euler step. Du/Dv/dt match the CPU version
// exactly (drawReactionDiffusion.ts:275) — dt=0.2 keeps the 4-neighbor
// discrete Laplacian under its numerical-stability limit, the same fix
// that resolved the earlier speckled-noise bug on the CPU path. Texture
// wrap is set to REPEAT (see setupTexture below) so `texture(uState, uv +
// offset)` wraps toroidally on its own, matching the CPU's `idx()` modulo
// wraparound without any extra shader logic.
const STEP_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uFeed;
uniform float uKill;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 c = texture(uState, vUv);
  vec4 l = texture(uState, vUv - vec2(uTexel.x, 0.0));
  vec4 r = texture(uState, vUv + vec2(uTexel.x, 0.0));
  vec4 d = texture(uState, vUv - vec2(0.0, uTexel.y));
  vec4 up = texture(uState, vUv + vec2(0.0, uTexel.y));
  float uu = c.r, vv = c.g;
  float lapU = l.r + r.r + d.r + up.r - 4.0 * uu;
  float lapV = l.g + r.g + d.g + up.g - 4.0 * vv;
  float reaction = uu * vv * vv;
  const float Du = 1.0, Dv = 0.5, dt = 0.2;
  float nu = clamp(uu + dt * (Du * lapU - reaction + uFeed * (1.0 - uu)), 0.0, 1.0);
  float nv = clamp(vv + dt * (Dv * lapV + reaction - (uKill + uFeed) * vv), 0.0, 1.0);
  outColor = vec4(nu, nv, 0.0, 1.0);
}`;

// Replicates the CPU version's per-frame perturbations (drawReactionDiffusion.ts:295-310):
// a sprinkle of single-cell v=1 pokes plus an occasional 7x7-disc reseed
// blob, applied once before the step passes each frame so the field never
// settles into permanent equilibrium. u is left untouched at poked cells,
// matching the CPU's `v[idx] = 1` (never touches u).
const POKE_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSize;
uniform int uSprinkleCount;
uniform vec2 uSprinklePos[${MAX_SPRINKLES}];
uniform int uBlobActive;
uniform vec2 uBlobCenter;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 c = texture(uState, vUv);
  vec2 texel = floor(vUv * uSize);
  float vv = c.g;
  for (int i = 0; i < ${MAX_SPRINKLES}; i++) {
    if (i >= uSprinkleCount) break;
    if (distance(texel + 0.5, uSprinklePos[i]) < 0.5) vv = 1.0;
  }
  if (uBlobActive == 1) {
    vec2 d = texel + 0.5 - uBlobCenter;
    if (dot(d, d) <= 9.0) vv = 1.0;
  }
  outColor = vec4(c.r, vv, 0.0, 1.0);
}`;

// Ports applyFieldContrast + mapValueToColor (src/app/utils/fieldCurve.ts)
// to GLSL — same power-curve contrast reshaping and linear/banded/cyclic
// palette lookup, so the color ramp matches the CPU path's getMappedColor
// call (drawReactionDiffusion.ts:336) rather than just being "similar."
const COLOR_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uState;
uniform float uContrast;
uniform int uPaletteMode;
uniform float uBands;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
in vec2 vUv;
out vec4 outColor;

float applyFieldContrast(float t, float amount) {
  if (amount == 1.0) return t;
  float centered = t - 0.5;
  float s = centered < 0.0 ? -1.0 : 1.0;
  float shaped = s * pow(abs(centered) * 2.0, amount) * 0.5;
  return clamp(shaped + 0.5, 0.0, 1.0);
}

void main() {
  float v = texture(uState, vUv).g;
  float t = clamp(v * 3.0, 0.0, 1.0);
  float shaped = applyFieldContrast(t, uContrast);
  float tt = mod(mod(shaped, 1.0) + 1.0, 1.0);
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
  vec3 color = mix(uColors[idx], uColors[idx2], frac);
  outColor = vec4(color, 1.0);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
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

function linkProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
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

function createStateTexture(gl: WebGL2RenderingContext, data: Float32Array | null): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, RD_W, RD_H, 0, gl.RGBA, gl.FLOAT, data);
  return tex;
}

function createFBO(gl: WebGL2RenderingContext, tex: WebGLTexture): WebGLFramebuffer {
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return fbo;
}

interface RDGLState {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  stepProgram: WebGLProgram;
  pokeProgram: WebGLProgram;
  colorProgram: WebGLProgram;
  texA: WebGLTexture; texB: WebGLTexture;
  fboA: WebGLFramebuffer; fboB: WebGLFramebuffer;
  current: 'A' | 'B'; // which texture holds the live state going into this frame
  readBuf: Float32Array; // scratch for gl.readPixels (RGBA)
  vOut: Float32Array; // extracted v channel, this is what gets broadcast to Display
  displayUploadBuf: Float32Array; // scratch for uploading a received `v` on the Display tab
}

let supportCache: boolean | null = null;

// Feature-detects everything this renderer needs: a WebGL2 context, the
// EXT_color_buffer_float extension (required to render into and read back
// an RGBA32F framebuffer — Gray-Scott is precision-sensitive, see the CPU
// version's dt-scaling comment, so this must not silently fall back to a
// lower-precision format), and that the GPU actually reports `highp` float
// support in fragment shaders (the WebGL spec permits silently downgrading
// `highp` to `mediump` on some mobile GPUs, which would risk reintroducing
// that same instability). Result is memoized for the session — if
// unsupported, every draw call permanently uses the CPU path instead.
export function detectRDGLSupport(): boolean {
  if (supportCache !== null) return supportCache;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { antialias: false }) as WebGL2RenderingContext | null;
    if (!gl) { supportCache = false; return false; }
    if (!gl.getExtension('EXT_color_buffer_float')) { supportCache = false; return false; }
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!precision || precision.precision === 0) { supportCache = false; return false; }
    // Confirm an RGBA32F framebuffer actually completes, not just that the
    // extension string is present — some implementations advertise it with
    // gaps.
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 1, 1, 0, gl.RGBA, gl.FLOAT, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    supportCache = complete;
    return complete;
  } catch {
    supportCache = false;
    return false;
  }
}

function initGLState(seedU: Float32Array, seedV: Float32Array): RDGLState {
  const canvas = document.createElement('canvas');
  canvas.width = RD_W;
  canvas.height = RD_H;
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false }) as WebGL2RenderingContext;
  gl.getExtension('EXT_color_buffer_float');

  const stepProgram = linkProgram(gl, VERT_SRC, STEP_FRAG_SRC);
  const pokeProgram = linkProgram(gl, VERT_SRC, POKE_FRAG_SRC);
  const colorProgram = linkProgram(gl, VERT_SRC, COLOR_FRAG_SRC);

  // Interleave the CPU-seeded u/v arrays into the RGBA32F layout (R=u,
  // G=v) so the initial pattern is bit-identical between the CPU and GL
  // paths, not just "similar" — both start from the exact same seed.
  const seed = new Float32Array(RD_W * RD_H * 4);
  for (let i = 0; i < RD_W * RD_H; i++) {
    seed[i * 4] = seedU[i];
    seed[i * 4 + 1] = seedV[i];
  }
  const texA = createStateTexture(gl, seed);
  const texB = createStateTexture(gl, null);
  const fboA = createFBO(gl, texA);
  const fboB = createFBO(gl, texB);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    gl, canvas, stepProgram, pokeProgram, colorProgram,
    texA, texB, fboA, fboB, current: 'A',
    readBuf: new Float32Array(RD_W * RD_H * 4),
    vOut: new Float32Array(RD_W * RD_H),
    displayUploadBuf: new Float32Array(RD_W * RD_H * 4),
  };
}

function drawFullscreen(gl: WebGL2RenderingContext) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

const IS_DISPLAY_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('display') === '1';

export function drawReactionDiffusionGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors,
    reactionDiffusionFeed, reactionDiffusionKill, reactionDiffusionSpeed,
    reactionDiffusionGridRef, canvas, ctx, displayWidth, displayHeight,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
  } = P;
  let gradient: CanvasGradient | undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  // Reuse the exact same CPU seeding logic/shape so a freshly-created grid
  // looks identical whichever path renders it first.
  if (!reactionDiffusionGridRef.current) {
    const u = new Float32Array(RD_W * RD_H).fill(1);
    const v = new Float32Array(RD_W * RD_H).fill(0);
    for (let b = 0; b < 6; b++) {
      const bcx = Math.floor(Math.random() * RD_W);
      const bcy = Math.floor(Math.random() * RD_H);
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (dx * dx + dy * dy > 9) continue;
          const x = (bcx + dx + RD_W) % RD_W;
          const y = (bcy + dy + RD_H) % RD_H;
          v[y * RD_W + x] = 1;
        }
      }
    }
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = RD_W;
    gridCanvas.height = RD_H;
    reactionDiffusionGridRef.current = { u, v, u2: new Float32Array(RD_W * RD_H), v2: new Float32Array(RD_W * RD_H), canvas: gridCanvas, time: 0 };
  }
  const rd = reactionDiffusionGridRef.current;
  if (!rd.gl) {
    rd.gl = initGLState(rd.u, rd.v);
  }
  const st: RDGLState = rd.gl;
  const gl = st.gl;

  const texOf = (which: 'A' | 'B') => (which === 'A' ? st.texA : st.texB);
  const fboOf = (which: 'A' | 'B') => (which === 'A' ? st.fboA : st.fboB);
  const other = (which: 'A' | 'B') => (which === 'A' ? 'B' : 'A');

  if (!IS_DISPLAY_MODE) {
    // Same feed/kill drift + perpetual-simmer perturbations as the CPU
    // path (drawReactionDiffusion.ts:291-310), computed once per frame
    // and reused across every sub-step, matching the CPU's per-frame
    // (not per-step) recompute.
    // Matches the CPU path's audio hook (drawReactionDiffusion.ts) exactly
    // so switching between the GL/CPU renderer mid-session (WebGL context
    // loss fallback) doesn't visibly change how the pattern responds to audio.
    const rdAudio = isAudioEnabled && isAudioReactive;
    const rdBassMod = rdAudio ? 1 + audioSubBassLevel * 0.8 : 1;
    const rdTrebleMod = rdAudio ? 1 + audioTrebleLevel * 1.2 : 1;
    rd.time += 0.0025 * reactionDiffusionSpeed * rdBassMod;
    const feed = reactionDiffusionFeed + Math.sin(rd.time * 0.6) * 0.006 * rdTrebleMod;
    const kill = reactionDiffusionKill + Math.cos(rd.time * 0.4) * 0.004 * rdTrebleMod;
    const steps = Math.max(1, Math.round(reactionDiffusionSpeed * 30));

    const sprinkleCount = Math.max(1, Math.round(reactionDiffusionSpeed * 2 * (rdAudio ? 1 + audioMidsLevel * 0.6 : 1)));
    const sprinklePos: number[] = [];
    for (let n = 0; n < sprinkleCount && sprinklePos.length < MAX_SPRINKLES * 2; n++) {
      if (Math.random() < 0.15) {
        sprinklePos.push(Math.floor(Math.random() * RD_W), Math.floor(Math.random() * RD_H));
      }
    }
    const blobActive = Math.random() < 0.01 * reactionDiffusionSpeed;
    const blobX = blobActive ? Math.floor(Math.random() * RD_W) : 0;
    const blobY = blobActive ? Math.floor(Math.random() * RD_H) : 0;

    gl.viewport(0, 0, RD_W, RD_H);

    // Poke pass: apply this frame's sprinkles/reseed blob before stepping.
    gl.useProgram(st.pokeProgram);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboOf(other(st.current)));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texOf(st.current));
    gl.uniform1i(gl.getUniformLocation(st.pokeProgram, 'uState'), 0);
    gl.uniform2f(gl.getUniformLocation(st.pokeProgram, 'uSize'), RD_W, RD_H);
    gl.uniform1i(gl.getUniformLocation(st.pokeProgram, 'uSprinkleCount'), Math.min(MAX_SPRINKLES, sprinklePos.length / 2));
    const posArr = new Float32Array(MAX_SPRINKLES * 2);
    posArr.set(sprinklePos.slice(0, MAX_SPRINKLES * 2));
    gl.uniform2fv(gl.getUniformLocation(st.pokeProgram, 'uSprinklePos'), posArr);
    gl.uniform1i(gl.getUniformLocation(st.pokeProgram, 'uBlobActive'), blobActive ? 1 : 0);
    gl.uniform2f(gl.getUniformLocation(st.pokeProgram, 'uBlobCenter'), blobX, blobY);
    drawFullscreen(gl);
    st.current = other(st.current);

    // Step passes: ping-pong the Gray-Scott update `steps` times.
    gl.useProgram(st.stepProgram);
    gl.uniform2f(gl.getUniformLocation(st.stepProgram, 'uTexel'), 1 / RD_W, 1 / RD_H);
    gl.uniform1f(gl.getUniformLocation(st.stepProgram, 'uFeed'), feed);
    gl.uniform1f(gl.getUniformLocation(st.stepProgram, 'uKill'), kill);
    gl.uniform1i(gl.getUniformLocation(st.stepProgram, 'uState'), 0);
    for (let s = 0; s < steps; s++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboOf(other(st.current)));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texOf(st.current));
      drawFullscreen(gl);
      st.current = other(st.current);
    }

    // Read back the v channel purely to keep the existing Display-mode
    // anim-sync broadcast (InteractiveGradient.tsx) fed — that code reads
    // `reactionDiffusionGridRef.current.v` every frame unconditionally, so
    // this must keep looking like a live Float32Array regardless of which
    // path is rendering. RD_W*RD_H is small (~30.8k texels) so this
    // readback is comparable in cost to the CPU path's own per-frame
    // typed-array/ImageData work, not a new bottleneck.
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboOf(st.current));
    gl.readPixels(0, 0, RD_W, RD_H, gl.RGBA, gl.FLOAT, st.readBuf);
    for (let i = 0; i < RD_W * RD_H; i++) st.vOut[i] = st.readBuf[i * 4 + 1];
    rd.v = st.vOut;
  } else {
    // Display tab: never simulates, only uploads whatever `v` the
    // controller last broadcast and renders it — same invariant as the
    // CPU path's `else { v = rd.v; }` branch.
    const incoming = rd.v;
    const buf = st.displayUploadBuf;
    for (let i = 0; i < RD_W * RD_H; i++) buf[i * 4 + 1] = incoming[i];
    gl.bindTexture(gl.TEXTURE_2D, texOf(st.current));
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RD_W, RD_H, gl.RGBA, gl.FLOAT, buf);
  }

  // Color pass, straight to the canvas's own default framebuffer at native
  // 220x140 — this canvas is then drawImage'd onto the main 2D canvas
  // below, identical to the CPU path's rd.canvas handoff.
  const colors: RGB[] = gradientColors;
  const colorCount = Math.max(1, Math.min(MAX_COLORS, colors.length));
  const colorArr = new Float32Array(MAX_COLORS * 3);
  for (let i = 0; i < colorCount; i++) {
    colorArr[i * 3] = colors[i].r / 255;
    colorArr[i * 3 + 1] = colors[i].g / 255;
    colorArr[i * 3 + 2] = colors[i].b / 255;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, RD_W, RD_H);
  gl.useProgram(st.colorProgram);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texOf(st.current));
  gl.uniform1i(gl.getUniformLocation(st.colorProgram, 'uState'), 0);
  gl.uniform1f(gl.getUniformLocation(st.colorProgram, 'uContrast'), fieldContrast);
  const paletteModeIdx = paletteMode === 'banded' ? 1 : paletteMode === 'cyclic' ? 2 : 0;
  gl.uniform1i(gl.getUniformLocation(st.colorProgram, 'uPaletteMode'), paletteModeIdx);
  gl.uniform1f(gl.getUniformLocation(st.colorProgram, 'uBands'), paletteBands);
  gl.uniform3fv(gl.getUniformLocation(st.colorProgram, 'uColors'), colorArr);
  gl.uniform1i(gl.getUniformLocation(st.colorProgram, 'uColorCount'), colorCount);
  drawFullscreen(gl);

  // Same smoothing/blur upscale as the CPU path (drawReactionDiffusion.ts:349-352)
  // — the sim grid is coarse relative to display resolution either way.
  ctx.imageSmoothingEnabled = true;
  ctx.filter = 'blur(1.5px)';
  ctx.drawImage(st.canvas, 0, 0, RD_W, RD_H, 0, 0, displayWidth, displayHeight);
  ctx.filter = 'none';

  return gradient;
}
