// Shared WebGL2 infrastructure for the persistent-buffer particle/vector
// gradients (Fireworks, Lightning) — a different shape from glShared.ts's
// stateless per-pixel field shaders. These need a canvas whose contents
// PERSIST frame to frame (for the fade-trail effect: each frame draws a
// low-alpha black quad over last frame's pixels, then draws new particles/
// segments on top), instead of being fully repainted every call. That's
// the same "persistent buffer + fade" mechanic the CPU versions already
// use (fireworksBufferRef/lightningBufferRef) — this just executes the
// per-particle drawing on the GPU instead of via ctx.fillRect/stroke calls,
// so the particle/segment cap that was limited by canvas-API call overhead
// can go much higher.
//
// Each gradient keeps its OWN persistent canvas (not the shared field
// canvas from glShared.ts, which is stateless-repaint by design and shared
// across many gradients) — created with preserveDrawingBuffer: true so the
// default framebuffer's contents survive between draw calls without
// needing a separate FBO/texture round-trip.

export interface PersistentGLState {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  fadeProgram: WebGLProgram;
  pointProgram: WebGLProgram;
  triProgram: WebGLProgram;
  width: number;
  height: number;
}

const FADE_VERT_SRC = `#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() {
  gl_Position = vec4(verts[gl_VertexID], 0.0, 1.0);
}`;

const FADE_FRAG_SRC = `#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = uColor; }`;

// a_position is already in clip space (-1..1, top-down Y flipped to match
// CPU pixel coords) — computed on the CPU per vertex when building the
// buffer, simpler than a uniform transform for buffers rebuilt every frame.
const POINT_VERT_SRC = `#version 300 es
in vec2 a_position;
in vec4 a_color;
in float a_size;
out vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = a_color;
}`;

// No circular falloff — CPU version draws square particles via fillRect,
// so a plain square point sprite (WebGL's default gl.POINTS shape) matches
// that look rather than a soft circular dot.
const POINT_FRAG_SRC = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() { outColor = v_color; }`;

const TRI_VERT_SRC = `#version 300 es
in vec2 a_position;
in vec4 a_color;
out vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_color = a_color;
}`;

const TRI_FRAG_SRC = `#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() { outColor = v_color; }`;

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

function linkProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
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

export function initPersistentGL(width: number, height: number): PersistentGLState {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, alpha: false }) as WebGL2RenderingContext;
  return {
    gl,
    canvas,
    fadeProgram: linkProgram(gl, FADE_VERT_SRC, FADE_FRAG_SRC),
    pointProgram: linkProgram(gl, POINT_VERT_SRC, POINT_FRAG_SRC),
    triProgram: linkProgram(gl, TRI_VERT_SRC, TRI_FRAG_SRC),
    width: canvas.width,
    height: canvas.height,
  };
}

let basicSupportCache: boolean | null = null;
export function detectParticleGLSupport(): boolean {
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

// Draws a fullscreen rgba(0,0,0,alpha) quad over the persistent buffer's
// existing contents — the GPU equivalent of the CPU path's
// `ctx.fillStyle = rgba(0,0,0,fadeAmount); ctx.fillRect(...)`.
export function drawFadeQuad(state: PersistentGLState, alpha: number) {
  const { gl, fadeProgram } = state;
  gl.useProgram(fadeProgram);
  gl.uniform4f(gl.getUniformLocation(fadeProgram, 'uColor'), 0, 0, 0, alpha);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// px/py in CPU pixel coords (top-down, origin top-left) -> WebGL clip space
// (-1..1, Y flipped to match).
export function toClipSpace(px: number, py: number, width: number, height: number): [number, number] {
  return [(px / width) * 2 - 1, 1 - (py / height) * 2];
}

interface PointBufferState {
  posBuf: WebGLBuffer;
  colorBuf: WebGLBuffer;
  sizeBuf: WebGLBuffer;
  vao: WebGLVertexArrayObject;
}
const pointBuffersByGL = new WeakMap<WebGL2RenderingContext, PointBufferState>();

function getPointBuffers(gl: WebGL2RenderingContext, program: WebGLProgram): PointBufferState {
  let bufs = pointBuffersByGL.get(gl);
  if (bufs) return bufs;
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const posBuf = gl.createBuffer()!;
  const colorBuf = gl.createBuffer()!;
  const sizeBuf = gl.createBuffer()!;
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  const colorLoc = gl.getAttribLocation(program, 'a_color');
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  const sizeLoc = gl.getAttribLocation(program, 'a_size');
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuf);
  gl.enableVertexAttribArray(sizeLoc);
  gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  bufs = { posBuf, colorBuf, sizeBuf, vao };
  pointBuffersByGL.set(gl, bufs);
  return bufs;
}

// positions: Float32Array of clip-space xy pairs (length count*2)
// colors: Float32Array of rgba (length count*4, 0-1 range)
// sizes: Float32Array of point sizes in pixels (length count)
export function drawPoints(state: PersistentGLState, positions: Float32Array, colors: Float32Array, sizes: Float32Array, count: number) {
  if (count === 0) return;
  const { gl, pointProgram } = state;
  const bufs = getPointBuffers(gl, pointProgram);
  gl.useProgram(pointProgram);
  gl.bindVertexArray(bufs.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.colorBuf);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.sizeBuf);
  gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.DYNAMIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.POINTS, 0, count);
  gl.bindVertexArray(null);
}

interface TriBufferState {
  posBuf: WebGLBuffer;
  colorBuf: WebGLBuffer;
  vao: WebGLVertexArrayObject;
}
const triBuffersByGL = new WeakMap<WebGL2RenderingContext, TriBufferState>();

function getTriBuffers(gl: WebGL2RenderingContext, program: WebGLProgram): TriBufferState {
  let bufs = triBuffersByGL.get(gl);
  if (bufs) return bufs;
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const posBuf = gl.createBuffer()!;
  const colorBuf = gl.createBuffer()!;
  const posLoc = gl.getAttribLocation(program, 'a_position');
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  const colorLoc = gl.getAttribLocation(program, 'a_color');
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuf);
  gl.enableVertexAttribArray(colorLoc);
  gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  bufs = { posBuf, colorBuf, vao };
  triBuffersByGL.set(gl, bufs);
  return bufs;
}

// positions: Float32Array of clip-space xy pairs, 3 verts per triangle
// colors: Float32Array of rgba per vertex (0-1 range)
export function drawTriangles(state: PersistentGLState, positions: Float32Array, colors: Float32Array, vertexCount: number) {
  if (vertexCount === 0) return;
  const { gl, triProgram } = state;
  const bufs = getTriBuffers(gl, triProgram);
  gl.useProgram(triProgram);
  gl.bindVertexArray(bufs.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs.colorBuf);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  gl.bindVertexArray(null);
}
