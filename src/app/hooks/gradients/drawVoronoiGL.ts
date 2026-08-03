// WebGL2 pilot renderer for Voronoi — see the CPU version (drawVoronoi.ts)
// for the reference implementation ("the most expensive per-pixel gradient
// in the app: a nested seed-count x pixel-count loop each doing sin/cos/
// sqrt per seed per pixel"). Seed positions/colors (at most ~45, cheap)
// are computed on the CPU exactly as the CPU path does — same
// voronoiSeed() hash, same audio-driven cell count/drift — and passed in
// as uniform arrays; the expensive nearest-seed search per pixel moves to
// the fragment shader, at full display resolution instead of the CPU
// path's half-res-then-upscale compromise.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const MAX_SEEDS = 48;

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uDistortion;
uniform float uBassPulse;
uniform float uMaxDist;
uniform int uSeedCount;
uniform vec2 uSeedPos[${MAX_SEEDS}];
uniform vec3 uSeedColor[${MAX_SEEDS}];
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 fp = vUv * uSize;
  float minDist = 1e9;
  vec3 nearestColor = uSeedColor[0];
  for (int i = 0; i < ${MAX_SEEDS}; i++) {
    if (i >= uSeedCount) break;
    float dx = fp.x - uSeedPos[i].x;
    float dy = fp.y - uSeedPos[i].y;
    float distortion = uDistortion * (sin(dx * 0.01) * cos(dy * 0.01)) * 100.0;
    float dist = sqrt(dx * dx + dy * dy) + distortion;
    if (dist < minDist) { minDist = dist; nearestColor = uSeedColor[i]; }
  }
  float vdx = fp.x - uCenter.x, vdy = fp.y - uCenter.y;
  float vDist = sqrt(vdx * vdx + vdy * vdy);
  float vBoost = 1.0 + uBassPulse * (1.0 - vDist / uMaxDist) * 0.9;
  outColor = vec4(min(vec3(1.0), nearestColor * vBoost), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectVoronoiGLSupport(): boolean {
  return detectFieldGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    gradientColors, structuralSeed, voronoiCellCount, voronoiAnimTime, voronoiDistortion,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel, audioTrebleLevel,
    displayWidth, displayHeight, centerX, centerY,
  } = P;

  const voronoiSeedFn = (x: number) => {
    const s = Math.sin(x * 12.9898 + voronoiCellCount * 78.233 + structuralSeed * 37.719) * 43758.5453;
    return s - Math.floor(s);
  };

  const voronoiAudioActive = isAudioEnabled && isAudioReactive;
  const audioVoronoiCount = voronoiAudioActive ? Math.floor(audioSubBassLevel * 15) : 0;
  const totalVoronoiCells = Math.min(MAX_SEEDS, voronoiCellCount + audioVoronoiCount);
  const voronoiColorOffset = voronoiAudioActive
    ? Math.floor(audioTrebleLevel * gradientColors.length * 3) % gradientColors.length
    : 0;

  const seedPosArr = new Float32Array(MAX_SEEDS * 2);
  const seedColorArr = new Float32Array(MAX_SEEDS * 3);
  for (let i = 0; i < totalVoronoiCells; i++) {
    const baseX = voronoiSeedFn(i * 2) * displayWidth;
    const baseY = voronoiSeedFn(i * 2 + 1) * displayHeight;
    const audioMorphBoost = voronoiAudioActive ? 1 + audioSubBassLevel * 3 : 1;
    const audioMidShift = voronoiAudioActive ? audioMidsLevel * 0.1 : 0;
    const offsetX = Math.sin(voronoiAnimTime * audioMorphBoost + i * 0.5 + audioMidShift) * displayWidth * 0.18;
    const offsetY = Math.cos(voronoiAnimTime * audioMorphBoost + i * 0.7 + audioMidShift) * displayHeight * 0.18;
    seedPosArr[i * 2] = baseX + offsetX;
    seedPosArr[i * 2 + 1] = baseY + offsetY;
    const colorIdx = (i % gradientColors.length + voronoiColorOffset) % gradientColors.length;
    const c = gradientColors[colorIdx] || { r: 255, g: 255, b: 255 };
    seedColorArr[i * 3] = c.r / 255;
    seedColorArr[i * 3 + 1] = c.g / 255;
    seedColorArr[i * 3 + 2] = c.b / 255;
  }

  const audioVoronoiDistortion = voronoiAudioActive ? audioSubBassLevel * 80 : 0;
  const totalVoronoiDistortion = (voronoiDistortion + audioVoronoiDistortion) * 0.01;
  const vMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
  const voronoiBassPulse = voronoiAudioActive ? audioSubBassLevel : 0;

  return {
    centerX, centerY, distortion: totalVoronoiDistortion, bassPulse: voronoiBassPulse, maxDist: vMaxDist,
    seedCount: totalVoronoiCells, seedPosArr, seedColorArr,
  };
}

function renderVoronoiStage(gl: WebGL2RenderingContext, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, u: ReturnType<typeof deriveUniforms>): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), u.centerX, u.centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uDistortion'), u.distortion);
  gl.uniform1f(gl.getUniformLocation(program, 'uBassPulse'), u.bassPulse);
  gl.uniform1f(gl.getUniformLocation(program, 'uMaxDist'), u.maxDist);
  gl.uniform1i(gl.getUniformLocation(program, 'uSeedCount'), u.seedCount);
  gl.uniform2fv(gl.getUniformLocation(program, 'uSeedPos'), u.seedPosArr);
  gl.uniform3fv(gl.getUniformLocation(program, 'uSeedColor'), u.seedColorArr);
  drawFieldFullscreen(gl);
}

export function drawVoronoiGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderVoronoiStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts's gradient-pipeline eligibility check — see
// glEffectPipeline.ts. Background fill skipped here (see Caustics comment).
export function getVoronoiGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'voronoi',
    render: (gl, _inputTexture, outputFramebuffer, width, height) => renderVoronoiStage(gl, outputFramebuffer, width, height, u),
  };
}
