// Shared WebGL2 infrastructure for post-process effects that need to
// re-sample the CURRENT canvas as their input (unlike gradients/particles
// in src/app/hooks/gradients/glShared.ts and glParticleShared.ts, which
// generate their own content from scratch). Uploads the live <canvas> as a
// texture each call (GPU-side upload via texImage2D, no CPU ImageData
// round-trip needed — a real win over getDisplayImageData()'s readback),
// then a fragment shader samples it.
//
// texImage2D's default (no Y-flip) uploads the canvas's top row to texture
// row v=0, which already matches this codebase's top-down vUv convention
// (see gradients/glShared.ts) — texture(uTex, vUv) samples correctly with
// no flip needed.

export const FULLSCREEN_VERT_SRC = `#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 pos = verts[gl_VertexID];
  vUv = vec2((pos.x + 1.0) * 0.5, 1.0 - (pos.y + 1.0) * 0.5);
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${info}`);
  }
  return shader;
}

export function linkProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vert = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram()!;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link failed: ${info}`);
  }
  return program;
}

// One canvas + WebGL2 context shared by every post-process effect, same
// reasoning as the field-shader gradients' shared canvas: browsers cap the
// number of live WebGL contexts a page can hold, so one context serves all
// of these rather than one each.
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedGL: WebGL2RenderingContext | null = null;

export function getSharedEffectGL(width: number, height: number): { gl: WebGL2RenderingContext; canvas: HTMLCanvasElement } {
  if (!sharedCanvas || !sharedGL) {
    sharedCanvas = document.createElement('canvas');
    sharedGL = sharedCanvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: false }) as WebGL2RenderingContext;
  }
  const w = Math.max(1, width), h = Math.max(1, height);
  if (sharedCanvas.width !== w) sharedCanvas.width = w;
  if (sharedCanvas.height !== h) sharedCanvas.height = h;
  return { gl: sharedGL, canvas: sharedCanvas };
}

let inputTexture: WebGLTexture | null = null;
let inputTextureGL: WebGL2RenderingContext | null = null;

// Uploads the live canvas as this frame's input texture and binds it to
// texture unit 0. NEAREST/CLAMP since this is a one-shot per-frame upload
// (no mipmaps needed) sampled at the same resolution it was uploaded at.
export function uploadCanvasTexture(gl: WebGL2RenderingContext, source: HTMLCanvasElement) {
  if (!inputTexture || inputTextureGL !== gl) {
    inputTexture = gl.createTexture();
    inputTextureGL = gl;
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, inputTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  return inputTexture;
}

export function drawFullscreen(gl: WebGL2RenderingContext) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

let basicSupportCache: boolean | null = null;
export function detectEffectGLSupport(): boolean {
  if (basicSupportCache !== null) return basicSupportCache;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { antialias: false });
    basicSupportCache = !!gl;
  } catch {
    basicSupportCache = false;
  }
  return basicSupportCache;
}
