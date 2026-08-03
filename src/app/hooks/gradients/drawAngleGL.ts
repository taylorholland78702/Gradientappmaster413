// WebGL2 pilot renderer for Angle — see the CPU version (drawAngle.ts) for
// the reference implementation. Pure function of (x, y, t), no simulation
// state — one fragment shader pass at full display resolution instead of
// the CPU path's half-res-then-upscale compromise. Color mapping indexes/
// interpolates gradientColors directly by angle fraction (no contrast/
// palette-mode step), matching the CPU path exactly.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, MAX_FIELD_COLORS, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uZoom;
uniform float uStartAngle;
uniform vec3 uColors[${MAX_FIELD_COLORS}];
uniform int uColorCount;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 fp = vUv * uSize;
  float dx = (fp.x - uCenter.x) / uZoom;
  float dy = (fp.y - uCenter.y) / uZoom;
  float pixelAngle = atan(dy, dx) - uStartAngle;
  const float TWO_PI = 6.28318530718;
  pixelAngle = mod(mod(pixelAngle, TWO_PI) + TWO_PI, TWO_PI);
  float t = pixelAngle / TWO_PI;

  float n = float(uColorCount);
  float colorPos = t * (n - 1.0);
  int colorIdx = int(floor(colorPos));
  float colorFrac = colorPos - float(colorIdx);
  int colorIdx2 = min(colorIdx + 1, uColorCount - 1);
  outColor = vec4(mix(uColors[colorIdx], uColors[colorIdx2], colorFrac), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectAngleGLSupport(): boolean {
  return detectFieldGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    gradientColors, angleCenterX, angleCenterY, angleStartOffset, angleRad, zoom,
    isAudioEnabled, isAudioReactive, audioTrebleLevel,
    displayWidth, displayHeight,
  } = P;
  const audioActive = isAudioEnabled && isAudioReactive;
  const audioConicAngleOffset = audioActive ? audioTrebleLevel * Math.PI * 0.004 : 0;
  const conicCenterX = (displayWidth * angleCenterX) / 100;
  const conicCenterY = (displayHeight * angleCenterY) / 100;
  const conicZoom = audioActive ? 1 : Math.max(1, zoom);
  const conicStartAngle = angleRad + (angleStartOffset * Math.PI) / 180 + audioConicAngleOffset;

  const colorCount = Math.max(1, Math.min(MAX_FIELD_COLORS, gradientColors.length));
  const colorArr = new Float32Array(MAX_FIELD_COLORS * 3);
  for (let i = 0; i < colorCount; i++) {
    colorArr[i * 3] = gradientColors[i].r / 255;
    colorArr[i * 3 + 1] = gradientColors[i].g / 255;
    colorArr[i * 3 + 2] = gradientColors[i].b / 255;
  }

  return { centerX: conicCenterX, centerY: conicCenterY, zoom: conicZoom, startAngle: conicStartAngle, colorArr, colorCount };
}

function renderAngleStage(gl: WebGL2RenderingContext, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, u: ReturnType<typeof deriveUniforms>): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), u.centerX, u.centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uZoom'), u.zoom);
  gl.uniform1f(gl.getUniformLocation(program, 'uStartAngle'), u.startAngle);
  gl.uniform3fv(gl.getUniformLocation(program, 'uColors'), u.colorArr);
  gl.uniform1i(gl.getUniformLocation(program, 'uColorCount'), u.colorCount);
  drawFieldFullscreen(gl);
}

export function drawAngleGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderAngleStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts's gradient-pipeline eligibility check — see
// glEffectPipeline.ts for why chaining avoids a per-stage canvas round-trip.
export function getAngleGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'angle',
    render: (gl, _inputTexture, outputFramebuffer, width, height) => renderAngleStage(gl, outputFramebuffer, width, height, u),
  };
}
