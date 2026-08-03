// GPU port of the two audio-reactive overlays useCanvasDraw.ts applies
// right after the gradient and before effects — vocal shimmer (scattered
// bright sparkle pixels) and the depth layer (a soft screen-blended radial
// light source). Both are native 2D canvas ops (ctx.fillRect scatter,
// ctx.createRadialGradient + globalCompositeOperation='screen'), which is
// exactly what blocked the gradient-pipeline pilot (glEffectPipeline.ts)
// from running while audio-reactive mode was on: either op would have
// forced a GPU->2D-canvas->GPU round-trip mid-chain. Folding both into one
// shader pass removes that restriction — the gradient pipeline can now run
// with audio active, which is most of this app's real usage.
//
// Shimmer isn't bit-identical to the CPU version: that one calls
// Math.random() to place N discrete sparkle points; a fragment shader has
// no equivalent (it evaluates per-pixel in parallel, it can't "place N
// points"). This instead hashes each pixel's coordinates (re-seeded every
// frame for flicker) and lights up the same *fraction* of pixels the CPU
// version's count would cover, with the same alpha/hue formulas — same
// density and intensity, different (but equally random-looking) pixels.
// Depth layer's math ports over exactly: it was already a deterministic
// radial gradient + screen blend, both trivial in a shader.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFieldFullscreen } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const OVERLAY_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uShimmerFraction;
uniform float uShimmerLevel;
uniform float uTrebleLevel;
uniform float uSeed;
uniform float uDepthEnabled;
uniform vec2 uDepthCenter;
uniform float uDepthRadius;
uniform float uDepthAlpha;
uniform vec3 uDepthColor;
in vec2 vUv;
out vec4 outColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 hsl2rgb(float h, float s, float l) {
  h = fract(h);
  float c = (1.0 - abs(2.0 * l - 1.0)) * s;
  float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
  float m = l - c * 0.5;
  vec3 rgb;
  if (h < 1.0 / 6.0) rgb = vec3(c, x, 0.0);
  else if (h < 2.0 / 6.0) rgb = vec3(x, c, 0.0);
  else if (h < 3.0 / 6.0) rgb = vec3(0.0, c, x);
  else if (h < 4.0 / 6.0) rgb = vec3(0.0, x, c);
  else if (h < 5.0 / 6.0) rgb = vec3(x, 0.0, c);
  else rgb = vec3(c, 0.0, x);
  return rgb + m;
}

void main() {
  vec2 fp = vUv * uSize;
  vec3 result = texture(uTex, vUv).rgb;

  // Depth layer — screen blend of a radial light source, alpha falling off
  // linearly from uDepthAlpha at the center to 0 at uDepthRadius (matching
  // a 2-stop canvas radial gradient), composited the same way canvas's
  // 'screen' blend mode does: dst + a*src*(1-dst) per channel.
  if (uDepthEnabled > 0.5) {
    float dist = length(fp - uDepthCenter);
    float t = clamp(dist / uDepthRadius, 0.0, 1.0);
    float a = uDepthAlpha * (1.0 - t);
    result = result + uDepthColor * a * (1.0 - result);
  }

  // Shimmer — see file header for why this hashes per-pixel instead of
  // placing discrete random points like the CPU version.
  if (uShimmerFraction > 0.0) {
    float h = hash(fp + uSeed);
    if (h > 1.0 - uShimmerFraction) {
      float hueRand = hash(fp * 1.7 + uSeed + 3.1);
      float alphaRand = hash(fp * 2.3 + uSeed + 7.7);
      float alpha = (0.25 + alphaRand * 0.35) * uShimmerLevel;
      float hueDeg = mod(hueRand * 60.0 + uTrebleLevel * 3.0, 360.0);
      vec3 sparkle = hsl2rgb(hueDeg / 360.0, 1.0, 0.88);
      result = mix(result, sparkle, alpha);
    }
  }

  outColor = vec4(result, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export interface PostGradientOverlayParams {
  shimmerFraction: number; // fraction of pixels that sparkle this frame, 0 disables
  shimmerLevel: number; // 0-1, matches CPU's `shimmer` — multiplies sparkle alpha
  trebleLevel: number;
  seed: number; // frame-varying, so the sparkle hash flickers instead of sitting static
  depthEnabled: boolean;
  depthCenterX: number;
  depthCenterY: number;
  depthRadius: number;
  depthAlpha: number;
  depthColor: { r: number; g: number; b: number };
}

function renderOverlayStage(
  gl: WebGL2RenderingContext,
  inputTexture: WebGLTexture,
  outputFramebuffer: WebGLFramebuffer | null,
  width: number,
  height: number,
  p: PostGradientOverlayParams,
): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, OVERLAY_FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'uShimmerFraction'), p.shimmerFraction);
  gl.uniform1f(gl.getUniformLocation(program, 'uShimmerLevel'), p.shimmerLevel);
  gl.uniform1f(gl.getUniformLocation(program, 'uTrebleLevel'), p.trebleLevel);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeed'), p.seed);
  gl.uniform1f(gl.getUniformLocation(program, 'uDepthEnabled'), p.depthEnabled ? 1 : 0);
  gl.uniform2f(gl.getUniformLocation(program, 'uDepthCenter'), p.depthCenterX, p.depthCenterY);
  gl.uniform1f(gl.getUniformLocation(program, 'uDepthRadius'), Math.max(1, p.depthRadius));
  gl.uniform1f(gl.getUniformLocation(program, 'uDepthAlpha'), p.depthAlpha);
  gl.uniform3f(gl.getUniformLocation(program, 'uDepthColor'), p.depthColor.r / 255, p.depthColor.g / 255, p.depthColor.b / 255);
  drawFieldFullscreen(gl);
}

// Always safe to include in a gradient-pipeline run regardless of audio
// state — a no-op passthrough when shimmerFraction is 0 and depthEnabled
// is false, which is exactly what the caller passes when audio isn't
// driving either overlay.
export function getPostGradientOverlayStage(p: PostGradientOverlayParams): GLEffectStage {
  return {
    type: 'post-gradient-overlay',
    render: (gl, inputTexture, outputFramebuffer, width, height) =>
      renderOverlayStage(gl, inputTexture, outputFramebuffer, width, height, p),
  };
}
