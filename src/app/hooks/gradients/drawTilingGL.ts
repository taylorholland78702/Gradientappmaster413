// WebGL2 pilot renderer for Tiling — see the CPU version (drawTiling.ts)
// for the reference implementation. Pure function of (x, y, t), one
// fragment shader pass at full display resolution instead of the CPU
// path's half-res-then-upscale compromise. Color mapping uses a fixed
// contrast=1/linear/bands=1 (matching the CPU path's hardcoded
// getMappedColor call — Tiling doesn't expose Contrast/Palette Mode/Bands
// as user controls), so this splices in colorMappingGLSL() but always
// passes those three uniforms as the identity values rather than reading
// them from P.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uTileSize;
uniform float uSymmetry;
uniform float uSectorAngle;
uniform float uComplexity;
uniform float uCosR;
uniform float uSinR;
uniform float uRowOffset;
in vec2 vUv;
out vec4 outColor;
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float fx = fp.x - uSize.x * 0.5;
  float fy = fp.y - uSize.y * 0.5;

  float tileIndexY = floor(fy / uTileSize);
  float rowStaggerAmt = mod(tileIndexY, 2.0) == 1.0 ? uRowOffset * 0.5 : 0.0;
  float sfx = fx - rowStaggerAmt;
  float tileIndexX = floor(sfx / uTileSize);
  float lx = (sfx / uTileSize - tileIndexX - 0.5) * uTileSize;
  float ly = (fy / uTileSize - tileIndexY - 0.5) * uTileSize;

  if (mod(tileIndexX + tileIndexY, 2.0) != 0.0) {
    float rx = -ly, ry = lx;
    lx = rx; ly = ry;
  }
  float gx = lx * uCosR - ly * uSinR;
  float gy = lx * uSinR + ly * uCosR;

  float angle = atan(gy, gx);
  float radius = sqrt(gx * gx + gy * gy);
  float folded = mod(mod(angle, uSectorAngle) + uSectorAngle, uSectorAngle);
  if (folded > uSectorAngle * 0.5) folded = uSectorAngle - folded;

  float value = (
    sin(radius * uComplexity * 0.15 + folded * uSymmetry) +
    sin(radius * uComplexity * 0.08) +
    1.0
  ) / 4.0 + 0.5;

  outColor = vec4(getMappedColor(value), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectTilingGLSupport(): boolean {
  return detectFieldGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    gradientColors, tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset,
  } = P;
  const tileSize = Math.max(8, tilingSize ?? 120);
  const symmetry = Math.max(2, Math.round(tilingSymmetry ?? 6));
  const sectorAngle = (Math.PI * 2) / symmetry;
  const complexity = Math.max(0.5, tilingComplexity ?? 3);
  const rotRad = ((tilingRotation ?? 0) + (tilingAnimTime ?? 0)) * Math.PI / 180;

  return {
    tileSize, symmetry, sectorAngle, complexity,
    cosR: Math.cos(rotRad), sinR: Math.sin(rotRad), rowOffset: tilingRowOffset ?? 0,
    gradientColors,
  };
}

function renderTilingStage(gl: WebGL2RenderingContext, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, u: ReturnType<typeof deriveUniforms>): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform1f(gl.getUniformLocation(program, 'uTileSize'), u.tileSize);
  gl.uniform1f(gl.getUniformLocation(program, 'uSymmetry'), u.symmetry);
  gl.uniform1f(gl.getUniformLocation(program, 'uSectorAngle'), u.sectorAngle);
  gl.uniform1f(gl.getUniformLocation(program, 'uComplexity'), u.complexity);
  gl.uniform1f(gl.getUniformLocation(program, 'uCosR'), u.cosR);
  gl.uniform1f(gl.getUniformLocation(program, 'uSinR'), u.sinR);
  gl.uniform1f(gl.getUniformLocation(program, 'uRowOffset'), u.rowOffset);
  setColorUniforms(gl, program, u.gradientColors, 1, 'linear', 1);
  drawFieldFullscreen(gl);
}

export function drawTilingGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderTilingStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts's gradient-pipeline eligibility check — see
// glEffectPipeline.ts for why chaining avoids a per-stage canvas round-trip.
export function getTilingGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'tiling',
    render: (gl, _inputTexture, outputFramebuffer, width, height) => renderTilingStage(gl, outputFramebuffer, width, height, u),
  };
}
