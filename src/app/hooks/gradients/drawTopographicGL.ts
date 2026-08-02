// WebGL2 pilot renderer for Topographic — see the CPU version
// (drawTopographic.ts) for the reference implementation. Pure function of
// (x, y, t), one fragment shader pass at full display resolution instead
// of the CPU path's half-res-then-upscale compromise.
// _registry.ts falls back to the CPU implementation if WebGL2 isn't
// available or this throws.
import { FULLSCREEN_VERT_SRC, JS_MOD_GLSL, colorMappingGLSL, linkProgram, drawFieldFullscreen, setColorUniforms, getSharedFieldGL, detectFieldGLSupport } from './glShared';

const FRAG_SRC = `#version 300 es
precision highp float;
uniform vec2 uSize;
uniform float uScale;
uniform float uTopoBands;
uniform float uLineWidth;
uniform float uPhase;
uniform float uSeedX;
uniform float uSeedY;
uniform float uColorShift;
in vec2 vUv;
out vec4 outColor;
${JS_MOD_GLSL}
${colorMappingGLSL()}

void main() {
  vec2 fp = vUv * uSize;
  float dx = fp.x - uSize.x * 0.5 + uSeedX;
  float dy = fp.y - uSize.y * 0.5 + uSeedY;
  float n1 = sin(dx * uScale + uPhase) * cos(dy * uScale * 1.15 - uPhase);
  float n2 = sin((dx + dy) * uScale * 0.5) * 0.5;
  float n3 = cos((dx - dy) * uScale * 0.37) * 0.35;
  float raw = (n1 + n2 + n3) / 1.85;
  float elevation = (raw + 1.0) / 2.0;

  float bandPos = elevation * uTopoBands;
  float bandIdx = floor(bandPos);
  float bandFrac = bandPos - bandIdx;
  float distToLine = min(bandFrac, 1.0 - bandFrac);

  float t = jsMod((bandIdx / uTopoBands) + uColorShift, 1.0);
  vec3 mapped = getMappedColor(t);

  if (distToLine < uLineWidth) {
    float lineMix = 1.0 - (distToLine / uLineWidth);
    mapped *= (1.0 - lineMix * 0.85);
  }

  outColor = vec4(clamp(mapped, 0.0, 1.0), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export function detectTopographicGLSupport(): boolean {
  return detectFieldGLSupport();
}

export function drawTopographicGL(P: any): CanvasGradient | undefined {
  const {
    fieldContrast, paletteMode, paletteBands, gradientColors, structuralSeed,
    topographicScale, topographicBands, topographicLineWidth, gradientAngle,
    isAudioEnabled, isAudioReactive, audioTrebleLevel,
    canvas, ctx, displayWidth, displayHeight,
  } = P;
  const gradient: CanvasGradient | undefined = undefined;
  if (canvas.width === 0 || canvas.height === 0) return gradient;

  const { gl, canvas: glCanvas } = getSharedFieldGL(displayWidth, displayHeight);
  if (!program || programGL !== gl) {
    program = linkProgram(gl, FULLSCREEN_VERT_SRC, FRAG_SRC);
    programGL = gl;
  }

  const topoScaleFactor = topographicScale * 0.001;
  const topoBands = Math.max(2, Math.round(topographicBands));
  const topoAudioActive = isAudioEnabled && isAudioReactive;
  const topoColorShift = topoAudioActive ? audioTrebleLevel * 0.4 : 0;
  const topoPhase = gradientAngle * 0.01;
  const topoSeedX = structuralSeed * 130;
  const topoSeedY = structuralSeed * 90;

  gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  gl.useProgram(program);
  gl.uniform2f(gl.getUniformLocation(program, 'uSize'), displayWidth, displayHeight);
  gl.uniform1f(gl.getUniformLocation(program, 'uScale'), topoScaleFactor);
  gl.uniform1f(gl.getUniformLocation(program, 'uTopoBands'), topoBands);
  gl.uniform1f(gl.getUniformLocation(program, 'uLineWidth'), topographicLineWidth);
  gl.uniform1f(gl.getUniformLocation(program, 'uPhase'), topoPhase);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedX'), topoSeedX);
  gl.uniform1f(gl.getUniformLocation(program, 'uSeedY'), topoSeedY);
  gl.uniform1f(gl.getUniformLocation(program, 'uColorShift'), topoColorShift);
  setColorUniforms(gl, program, gradientColors, fieldContrast, paletteMode, paletteBands);
  drawFieldFullscreen(gl);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, displayWidth, displayHeight);
  ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
  return gradient;
}
