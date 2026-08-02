// WebGL2 pilot renderer for Metaballs — see the CPU version
// (drawMetaballs.ts) for the reference implementation. Same shape as Lava
// Lamp GL: ball positions/radii (at most 14, cheap) computed on the CPU
// exactly as the CPU path does, passed in as a uniform array; the
// expensive per-pixel field-sum over every ball moves to the fragment
// shader, at full display resolution instead of the CPU path's
// half-res-then-upscale compromise.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport } from './glShared';

const MAX_BALLS = 14;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uZoomScale;
uniform float uColorShift;
uniform int uBallCount;
uniform vec3 uBalls[${MAX_BALLS}]; // x, y, r
in vec2 vUv;
out vec4 outColor;
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  vec2 p = uCenter + (fp - uCenter) * uZoomScale;
  float field = 0.0;
  for (int b = 0; b < ${MAX_BALLS}; b++) {
    if (b >= uBallCount) break;
    vec2 d = p - uBalls[b].xy;
    float dist2 = dot(d, d);
    field += (uBalls[b].z * uBalls[b].z) / (dist2 + 1.0);
  }
  float tVal = (1.0 - 1.0 / (1.0 + field * 0.6)) * (1.0 - uColorShift) + uColorShift;
  vec3 mapped = getMappedColor(tVal);
  float brightness = min(1.0, field * 0.9);
  outColor = vec4(mapped * brightness, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectMetaballsGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawMetaballsGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors, structuralSeed,
    metaballAnimTime, metaballCount, metaballSize, gradientAngle, zoom,
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

  const metaAudio = isAudioEnabled && isAudioReactive;
  const audioBassMb = metaAudio ? audioSubBassLevel / 5 : 0;
  const audioMidsMb = metaAudio ? audioMidsLevel / 5 : 0;
  const mbTime = (metaballAnimTime + gradientAngle * 0.02) * (1 + audioMidsMb * 2);
  const mbScaleBoost = 1 + audioBassMb * 2.0;
  const mbColorShift = metaAudio ? audioTrebleLevel * 0.8 : 0;
  const numBalls = Math.max(2, Math.min(metaballCount, MAX_BALLS));

  const ballArr = new Float32Array(MAX_BALLS * 3);
  for (let i = 0; i < numBalls; i++) {
    const seedPhase = structuralSeed * (i + 1) * 0.9;
    const angle = (i / numBalls) * Math.PI * 2 + mbTime * (0.25 + i * 0.05) + seedPhase;
    const orbitR = 0.2 + 0.18 * Math.sin(mbTime * 0.3 + i * 1.3 + seedPhase);
    ballArr[i * 3] = centerX + displayWidth * orbitR * Math.cos(angle);
    ballArr[i * 3 + 1] = centerY + displayHeight * orbitR * Math.sin(angle * 0.8 + mbTime * 0.15);
    ballArr[i * 3 + 2] = Math.min(displayWidth, displayHeight) * metaballSize * mbScaleBoost;
  }

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uZoomScale'), 1 / zoom);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), mbColorShift);
  gl.uniform1i(gl.getUniformLocation(program, 'uBallCount'), numBalls);
  gl.uniform3fv(gl.getUniformLocation(program, 'uBalls'), ballArr);
  setColorUniforms(gl, program, gradientColors, fieldContrast ?? 1, paletteMode ?? 'linear', paletteBands ?? 4);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
