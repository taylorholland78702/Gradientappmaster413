// WebGL2 pilot renderer for Lava Lamp — see the CPU version
// (drawLavaLamp.ts) for the reference implementation. Blob positions/radii/
// colors (at most 12, cheap) are computed on the CPU exactly as the CPU
// path does and passed in as uniform arrays; the expensive part — summing
// each blob's metaball influence at every pixel — moves to the fragment
// shader, at full display resolution instead of the CPU path's
// half-res-then-upscale compromise.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport } from './glShared';

const MAX_BLOBS = 12;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uZoomScale;
uniform float uBrightBoost;
uniform int uBlobCount;
uniform vec3 uBlobs[${MAX_BLOBS}]; // x, y, r
uniform vec3 uBlobColors[${MAX_BLOBS}];
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 fp = vUv * uSize;
  vec2 p = uCenter + (fp - uCenter) * uZoomScale;
  float field = 0.0;
  vec3 colorSum = vec3(0.0);
  float colorW = 0.0;
  for (int b = 0; b < ${MAX_BLOBS}; b++) {
    if (b >= uBlobCount) break;
    vec2 d = p - uBlobs[b].xy;
    float dist2 = dot(d, d);
    float influence = (uBlobs[b].z * uBlobs[b].z) / (dist2 + 1.0);
    field += influence;
    colorSum += uBlobColors[b] * influence;
    colorW += influence;
  }
  float t = clamp((field - 0.7) * 3.0, 0.0, 1.0);
  float brightness = (t > 0.0 ? 1.0 : min(1.0, field * 0.3)) * uBrightBoost;
  vec3 color = colorW > 0.0 ? colorSum / colorW : vec3(0.0);
  outColor = vec4(min(vec3(1.0), color * brightness), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectLavaLampGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawLavaLampGL(P: any): CanvasGradient | undefined {
  const {
    gradientColors, lavaAnimTime, lavaSpeed, lavaBlobCount, lavaBlobSize, gradientAngle, zoom,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
    canvas, ctx, displayWidth, displayHeight, centerX, centerY,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }

  const lavaAudio = isAudioEnabled && isAudioReactive;
  const audioBassL = lavaAudio ? audioSubBassLevel / 5 : 0;
  const audioMidsL = lavaAudio ? audioMidsLevel / 5 : 0;
  const lt = lavaAnimTime + gradientAngle * 0.02;
  const lavaAudioScale = 1 + audioBassL * 3.0;
  const lavaOrbitBoost = 1 + audioMidsL * 3.0;
  const lavaBrightBoost = 1 + audioBassL * 2.0;
  const lavaColorShift = lavaAudio ? audioTrebleLevel * 0.8 : 0;
  const lavaTime = lt * lavaSpeed * lavaOrbitBoost;
  const numBlobs = Math.max(2, Math.min(lavaBlobCount, MAX_BLOBS));

  const blobArr = new Float32Array(MAX_BLOBS * 3);
  const colorArr = new Float32Array(MAX_BLOBS * 3);
  for (let i = 0; i < numBlobs; i++) {
    const angle = (i / numBlobs) * Math.PI * 2 + lavaTime * (0.3 + i * 0.07);
    const orbitR = 0.25 + 0.15 * Math.sin(lavaTime * 0.4 + i * 1.1);
    const bx = centerX + displayWidth * orbitR * Math.cos(angle);
    const by = centerY + displayHeight * orbitR * Math.sin(angle * 0.7 + lavaTime * 0.2);
    const br = (Math.min(displayWidth, displayHeight) * lavaBlobSize + Math.sin(lavaTime + i) * 0.04 * displayWidth) * lavaAudioScale;
    blobArr[i * 3] = bx;
    blobArr[i * 3 + 1] = by;
    blobArr[i * 3 + 2] = br;
    const ci = ((i + Math.floor(lavaColorShift * gradientColors.length)) % gradientColors.length + gradientColors.length) % gradientColors.length;
    const c = gradientColors[ci] || { r: 255, g: 80, b: 20 };
    colorArr[i * 3] = c.r / 255;
    colorArr[i * 3 + 1] = c.g / 255;
    colorArr[i * 3 + 2] = c.b / 255;
  }

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uZoomScale'), 1 / zoom);
  gl.uniform1f(gl.getUniformLocation(program, 'uBrightBoost'), lavaBrightBoost);
  gl.uniform1i(gl.getUniformLocation(program, 'uBlobCount'), numBlobs);
  gl.uniform3fv(gl.getUniformLocation(program, 'uBlobs'), blobArr);
  gl.uniform3fv(gl.getUniformLocation(program, 'uBlobColors'), colorArr);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
