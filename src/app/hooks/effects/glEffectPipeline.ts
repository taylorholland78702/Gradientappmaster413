// Phase-3 pilot: chains multiple GL-capable effects through ping-ponged
// framebuffers on the shared effect GL context (glEffectShared.ts) instead
// of each effect independently uploading the main 2D canvas as a texture
// and blitting its own result back with ctx.drawImage. That per-effect
// round-trip (GPU -> 2D canvas -> GPU re-upload) is the actual reason
// porting individual effects to WebGL didn't fully close the smoothness gap
// against a single-shader-pipeline renderer: every GL effect boundary still
// paid a CPU-visible canvas composite. Chaining N GL effects back-to-back
// through this module costs exactly one upload (the current 2D canvas) and
// one blit-back (the final result) regardless of N, with every stage in
// between staying GPU-resident.
//
// Scope: this only pipelines a *contiguous run* of GL-eligible effects
// within the active effect stack (see useCanvasDraw.ts's callsite) — CPU
// effects before/after such a run, and gradient rendering itself, are
// untouched. A single GL effect isn't pipelined either (nothing to chain;
// it already pays exactly one upload + one blit today, same as this would
// give it). If anything throws, the caller falls back to running each
// effect through its normal standalone path — same capability-detect +
// try/catch safety net as every other GL port in this codebase.
import { getSharedEffectGL, uploadCanvasTexture } from './glEffectShared';

export interface GLEffectStage {
  type: string;
  // Renders from `inputTexture` into `outputFramebuffer` (null = the shared
  // GL canvas's own backbuffer, used for the final stage only).
  render: (gl: WebGL2RenderingContext, inputTexture: WebGLTexture, outputFramebuffer: WebGLFramebuffer | null, width: number, height: number) => void;
}

interface PingPongTarget {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

let fboA: PingPongTarget | null = null;
let fboB: PingPongTarget | null = null;
let fboGL: WebGL2RenderingContext | null = null;

function createPingPongTarget(gl: WebGL2RenderingContext, width: number, height: number): PingPongTarget {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // LINEAR, matching uploadCanvasTexture's filtering (glEffectShared.ts) —
  // a stage reading from a ping-pong texture should get the same sampling
  // quality it would if it were reading straight off the canvas.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  const framebuffer = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { framebuffer, texture, width, height };
}

function getPingPongTargets(gl: WebGL2RenderingContext, width: number, height: number): [PingPongTarget, PingPongTarget] {
  if (!fboA || !fboB || fboGL !== gl || fboA.width !== width || fboA.height !== height) {
    fboA = createPingPongTarget(gl, width, height);
    fboB = createPingPongTarget(gl, width, height);
    fboGL = gl;
  }
  return [fboA, fboB];
}

// Runs `stages` in order, ping-ponging between two offscreen framebuffers
// so only the first stage reads from the live 2D canvas and only the last
// stage's output gets blitted back to it. Returns false (caller must fall
// back to the normal per-effect path) if fewer than 2 stages were given —
// pipelining a single effect has nothing to chain — or if anything throws.
export function runGLEffectChain(
  stages: GLEffectStage[],
  sourceCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  displayWidth: number,
  displayHeight: number,
): boolean {
  if (stages.length < 2) return false;
  try {
    const { gl, canvas: glCanvas } = getSharedEffectGL(displayWidth, displayHeight);
    const [targetA, targetB] = getPingPongTargets(gl, glCanvas.width, glCanvas.height);

    let currentInput = uploadCanvasTexture(gl, sourceCanvas);
    let nextTarget = targetA;
    for (let i = 0; i < stages.length; i++) {
      const isLast = i === stages.length - 1;
      const outputFramebuffer = isLast ? null : nextTarget.framebuffer;
      stages[i].render(gl, currentInput, outputFramebuffer, glCanvas.width, glCanvas.height);
      if (!isLast) {
        currentInput = nextTarget.texture;
        nextTarget = nextTarget === targetA ? targetB : targetA;
      }
    }

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    ctx.drawImage(glCanvas, 0, 0, glCanvas.width, glCanvas.height, 0, 0, displayWidth, displayHeight);
    return true;
  } catch (err) {
    console.error('GL effect pipeline failed, falling back to per-effect path:', err);
    return false;
  }
}
