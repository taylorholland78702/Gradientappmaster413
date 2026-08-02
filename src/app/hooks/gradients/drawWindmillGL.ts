// WebGL2 pilot renderer for Windmill's "helix" submode only — see the CPU
// version (drawWindmill.ts) for the reference implementation. Only 'helix'
// has a genuine per-pixel software loop (createImageData); the default
// 'blades' mode already draws via vector ctx.arc/path segments, which is
// browser/GPU-accelerated already and not part of this port.
// _registry.ts's wrapper only calls this for 'helix' and always uses the
// CPU path otherwise. Falls back to the CPU implementation if WebGL2
// isn't available or this throws.
import { FULLSCREEN_VERT_SRC, MAX_FIELD_COLORS, linkProgram, drawFieldFullscreen, getSharedFieldGL, detectFieldGLSupport } from './glShared';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform vec2 uCenter;
uniform float uTightness;
uniform float uTurns;
uniform float uZoom;
uniform float uAngleOffset;
uniform float uColorShift;
uniform float uBassPulse;
uniform float uMaxDist;
uniform vec3 uColors[${MAX_FIELD_COLORS}];
uniform int uColorCount;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec2 fp = vUv * uSize;
  float dx = fp.x - uCenter.x;
  float dy = fp.y - uCenter.y;
  float dist = sqrt(dx * dx + dy * dy);
  float spiralAngle = atan(dy, dx);
  const float TWO_PI = 6.28318530718;
  float rawAngle = spiralAngle + (dist * uTightness * 0.01) * uTurns / uZoom + uAngleOffset;
  float finalAngle = mod(mod(rawAngle, TWO_PI) + TWO_PI, TWO_PI);
  float normalizedAngle = finalAngle / TWO_PI;

  float shiftedAngle = mod(normalizedAngle + uColorShift, 1.0);
  float n = float(uColorCount);
  float colorPos = shiftedAngle * (n - 1.0);
  int colorIdx = int(floor(colorPos));
  float colorFrac = colorPos - float(colorIdx);
  int colorIdx2 = min(colorIdx + 1, uColorCount - 1);
  vec3 color = mix(uColors[colorIdx], uColors[colorIdx2], colorFrac);

  float radialBoost = 1.0 + uBassPulse * (1.0 - dist / uMaxDist) * 0.8;
  outColor = vec4(min(vec3(1.0), color * radialBoost), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectWindmillGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawWindmillHelixGL(P: any): CanvasGradient | undefined {
  const {
    gradientColors, helixTightness, helixTurns, gradientAngle, zoom,
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

  const conicalAudioActive = isAudioEnabled && isAudioReactive;
  const audioConicalTightness = conicalAudioActive ? audioSubBassLevel * 4 : 0;
  const audioConicalTurns = conicalAudioActive ? audioMidsLevel * 3 : 0;
  const conicalZoom = conicalAudioActive ? 1 : zoom;
  const conicalColorShift = conicalAudioActive ? audioTrebleLevel * 0.6 : 0;
  const conicalBassPulse = conicalAudioActive ? audioSubBassLevel : 0;
  const conicalMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
  const DEG_TO_RAD = Math.PI / 180;

  const colorCount = Math.max(1, Math.min(MAX_FIELD_COLORS, gradientColors.length));
  const colorArr = new Float32Array(MAX_FIELD_COLORS * 3);
  for (let i = 0; i < colorCount; i++) {
    colorArr[i * 3] = gradientColors[i].r / 255;
    colorArr[i * 3 + 1] = gradientColors[i].g / 255;
    colorArr[i * 3 + 2] = gradientColors[i].b / 255;
  }

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform2f(gl.getUniformLocation(program, 'uCenter'), centerX, centerY);
  gl.uniform1f(gl.getUniformLocation(program, 'uTightness'), helixTightness + audioConicalTightness);
  gl.uniform1f(gl.getUniformLocation(program, 'uTurns'), helixTurns + audioConicalTurns);
  gl.uniform1f(gl.getUniformLocation(program, 'uZoom'), conicalZoom);
  gl.uniform1f(gl.getUniformLocation(program, 'uAngleOffset'), gradientAngle * DEG_TO_RAD);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), conicalColorShift);
  gl.uniform1f(gl.getUniformLocation(program, 'uBassPulse'), conicalBassPulse);
  gl.uniform1f(gl.getUniformLocation(program, 'uMaxDist'), conicalMaxDist);
  gl.uniform3fv(gl.getUniformLocation(program, 'uColors'), colorArr);
  gl.uniform1i(gl.getUniformLocation(program, 'uColorCount'), colorCount);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
