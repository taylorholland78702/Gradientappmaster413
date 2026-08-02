// WebGL2 pilot renderer for Plasma — see the CPU version (drawPlasma.ts)
// for the reference implementation. Plasma has no simulation state (every
// pixel is a pure function of (x, y, t)), so unlike Reaction-Diffusion GL
// this needs no ping-ponged framebuffers: one fragment shader pass, full
// display resolution, straight to the shared field canvas (glShared.ts).
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import {
  FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram,
  drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport,
} from './glShared';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uScale;
uniform float uAngle;
uniform float uSeedX;
uniform float uSeedY;
uniform float uColorShift;
uniform float uBassPulse;
uniform float uMaxDist;
in vec2 vUv;
out vec4 outColor;
${JS_MOD_GLSL}
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float cx = uSize.x * 0.5;
  float cy = uSize.y * 0.5;
  float dx = fp.x - cx;
  float dy = fp.y - cy;
  float spx = fp.x + uSeedX;
  float spy = fp.y + uSeedY;
  float value = (
    sin(spx * uScale + uAngle * 0.05) +
    sin(spy * uScale + uAngle * 0.05) +
    sin((spx + spy) * uScale * 0.75) +
    sin(sqrt(dx * dx + dy * dy) * uScale + uAngle * 0.05)
  ) / 4.0 + 0.5;
  float shiftedValue = jsMod(value + uColorShift, 1.0);
  vec3 color1 = getMappedColor(shiftedValue);
  float dist = sqrt(dx * dx + dy * dy);
  float radialBoost = 1.0 + uBassPulse * (1.0 - dist / uMaxDist) * 0.8;
  outColor = vec4(min(vec3(1.0), color1 * radialBoost), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectPlasmaGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawPlasmaGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, structuralSeed, gradientColors,
    gradientAngle, plasmaComplexity, plasmaZoomScale, zoom,
    isAudioEnabled, isAudioReactive, audioSubBassLevel, audioTrebleLevel,
    canvas, ctx, displayWidth, displayHeight, centerX, centerY,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }

  const plasmaAudioActive = isAudioEnabled && isAudioReactive;
  const audioPlasmaComplexity = plasmaAudioActive ? audioSubBassLevel * 50 : 0;
  const plasmaZoom = plasmaAudioActive ? 1 : zoom;
  const plasmaScale = ((plasmaComplexity + audioPlasmaComplexity) * 0.004) / (plasmaZoom * plasmaZoomScale);
  const plasmaColorShift = plasmaAudioActive ? audioTrebleLevel * 0.6 : 0;
  const plasmaBassPulse = plasmaAudioActive ? audioSubBassLevel : 0;
  const plasmaMaxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
  const plasmaSeedX = structuralSeed * 210;
  const plasmaSeedY = structuralSeed * 140;

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), plasmaScale);
  gl.uniform1f(gl.getUniformLocation(program, 'uAngle'), gradientAngle);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedX'), plasmaSeedX);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedY'), plasmaSeedY);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), plasmaColorShift);
  gl.uniform1f(gl.getUniformLocation(program, 'uBassPulse'), plasmaBassPulse);
  gl.uniform1f(gl.getUniformLocation(program, 'uMaxDist'), plasmaMaxDist);
  setColorUniforms(gl, program, gradientColors, fieldContrast, paletteMode, paletteBands);
  drawFieldFullscreen(gl);

  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
