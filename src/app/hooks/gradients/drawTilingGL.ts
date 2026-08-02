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

export function drawTilingGL(P: any): CanvasGradient | undefined {
  const {
    gradientColors, tilingSize, tilingSymmetry, tilingComplexity, tilingRotation, tilingAnimTime, tilingRowOffset,
    canvas, ctx, displayWidth, displayHeight,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }

  const tileSize = Math.max(8, tilingSize ?? 120);
  const symmetry = Math.max(2, Math.round(tilingSymmetry ?? 6));
  const sectorAngle = (Math.PI * 2) / symmetry;
  const complexity = Math.max(0.5, tilingComplexity ?? 3);
  const rotRad = ((tilingRotation ?? 0) + (tilingAnimTime ?? 0)) * Math.PI / 180;

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform1f(gl.getUniformLocation(program, 'uTileSize'), tileSize);
  gl.uniform1f(gl.getUniformLocation(program, 'uSymmetry'), symmetry);
  gl.uniform1f(gl.getUniformLocation(program, 'uSectorAngle'), sectorAngle);
  gl.uniform1f(gl.getUniformLocation(program, 'uComplexity'), complexity);
  gl.uniform1f(gl.getUniformLocation(program, 'uCosR'), Math.cos(rotRad));
  gl.uniform1f(gl.getUniformLocation(program, 'uSinR'), Math.sin(rotRad));
  gl.uniform1f(gl.getUniformLocation(program, 'uRowOffset'), tilingRowOffset ?? 0);
  setColorUniforms(gl, program, gradientColors, 1, 'linear', 1);
  drawFieldFullscreen(gl);

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
