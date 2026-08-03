// WebGL2 pilot renderer for Radial Burst's "sweep" (radar) submode only —
// see the CPU version (drawRadialBurst.ts) for the reference
// implementation. Only 'sweep' mode has a genuine per-pixel software loop
// (createImageData); the default burst mode already composites via native
// ctx.createRadialGradient + 'lighter' blending, which is browser/GPU-
// accelerated already and not part of this port. _registry.ts's wrapper
// only calls this for 'sweep' and always uses the CPU path otherwise.
// Falls back to the CPU implementation if WebGL2 isn't available or this
// throws.
import { FULLSCREEN_VERT_SRC, MAX_FIELD_COLORS, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uSweepAngle;
uniform float uBeamHalf;
uniform float uFadeLength;
uniform float uAudioFlash;
uniform vec3 uColors[${MAX_FIELD_COLORS}];
uniform int uColorCount;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 fp = vUv * uSize;
  float dx = fp.x - uCenter.x;
  float dy = fp.y - uCenter.y;
  float pixelAngle = mod(atan(dy, dx) * 180.0 / 3.14159265359 + 360.0, 360.0);
  float angleDiff = mod(uSweepAngle - pixelAngle + 360.0, 360.0);

  float brightness = 0.0;
  if (angleDiff <= uBeamHalf) {
    brightness = 1.0;
  } else if (angleDiff <= uBeamHalf + uFadeLength) {
    brightness = 1.0 - ((angleDiff - uBeamHalf) / uFadeLength);
  }
  if (angleDiff <= uBeamHalf + 3.0) brightness = max(brightness, uAudioFlash);

  float n = float(uColorCount);
  float colorPos = (pixelAngle / 360.0) * (n - 1.0);
  int colorIdx = int(floor(colorPos));
  float colorFrac = colorPos - float(colorIdx);
  int colorIdx2 = min(colorIdx + 1, uColorCount - 1);
  vec3 color = mix(uColors[colorIdx], uColors[colorIdx2], colorFrac);

  outColor = vec4(color * brightness, 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectRadialBurstGLSupport(): boolean {
  return detectFieldGLSupport();
}

function deriveUniforms(P: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  const {
    gradientColors, radarSweepAngle, radarBeamWidth, radarFadeLength,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioMidsLevel,
    centerX, centerY,
  } = P;
  const audioActive = isAudioEnabled && isAudioReactive;
  const audioRadarTrail = audioActive ? audioSubBassLevel * 120 : 0;
  const audioRadarFlash = audioActive ? audioMidsLevel : 0;
  const effectiveRadarFadeLength = Math.min(360, radarFadeLength + audioRadarTrail);

  const colorCount = Math.max(1, Math.min(MAX_FIELD_COLORS, gradientColors.length));
  const colorArr = new Float32Array(MAX_FIELD_COLORS * 3);
  for (let i = 0; i < colorCount; i++) {
    colorArr[i * 3] = gradientColors[i].r / 255;
    colorArr[i * 3 + 1] = gradientColors[i].g / 255;
    colorArr[i * 3 + 2] = gradientColors[i].b / 255;
  }

  return {
    centerX, centerY, sweepAngle: radarSweepAngle, beamHalf: radarBeamWidth / 2,
    fadeLength: effectiveRadarFadeLength, audioFlash: audioRadarFlash, colorArr, colorCount,
  };
}

function renderRadialBurstSweepStage(gl: WebGL2RenderingContext, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number, u: ReturnType<typeof deriveUniforms>): void {
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
  gl.viewport(0, 0, width, height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), width, height);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), u.centerX, u.centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uSweepAngle'), u.sweepAngle);
  gl.uniform1f(gl.getUniformLocation(program, 'uBeamHalf'), u.beamHalf);
  gl.uniform1f(gl.getUniformLocation(program, 'uFadeLength'), u.fadeLength);
  gl.uniform1f(gl.getUniformLocation(program, 'uAudioFlash'), u.audioFlash);
  gl.uniform3fv(gl.getUniformLocation(program, 'uColors'), u.colorArr);
  gl.uniform1i(gl.getUniformLocation(program, 'uColorCount'), u.colorCount);
  drawFieldFullscreen(gl);
}

export function drawRadialBurstSweepGL(P: any): CanvasGradient | undefined {
  const { canvas, ctx, displayWidth, displayHeight } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  renderRadialBurstSweepStage(gl, null, glCanvas.width, glCanvas.height, deriveUniforms(P));

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}

// Used by useCanvasDraw.ts's gradient-pipeline eligibility check — only
// wired up when radialBurstMode === 'sweep' (see glEffectPipeline.ts for
// why chaining avoids a per-stage canvas round-trip). Background fill
// skipped here (see Caustics comment in drawCausticsGL.ts).
export function getRadialBurstSweepGLStage(P: any): GLEffectStage {
  const u = deriveUniforms(P);
  return {
    type: 'radial-burst-sweep',
    render: (gl, _inputTexture, outputFramebuffer, width, height) => renderRadialBurstSweepStage(gl, outputFramebuffer, width, height, u),
  };
}
