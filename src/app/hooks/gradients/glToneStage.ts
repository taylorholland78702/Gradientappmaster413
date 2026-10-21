// Exposure + tone curve as a GL pipeline stage, for the gradients that draw
// without their own finishing (Noise, Marble, Julia, Caustics, ...). The styled
// field gradients apply the same math inside their shaders (drawStyleFieldGL.ts,
// `finish`), where it can act on colors above 1.0; this stage reads the already
// 8-bit gradient, so it brightens, darkens and rolls off what is there but can't
// recover highlights that were clipped before it ran.
import { FULLSCREEN_VERT_SRC, linkProgram, drawFieldFullscreen, setSizeUniform } from './glShared';
import type { GLEffectStage } from '../effects/glEffectPipeline';

const TONE_FRAG_SRC = `#version 300 es
precision highp float;
uniform sampler2D uTex;
uniform vec2 uSize;
uniform float uExposure;
uniform int uTone;
in vec2 vUv;
out vec4 outColor;

void main() {
  vec3 c = max(texture(uTex, vUv).rgb, vec3(0.0)) * exp2(uExposure);
  if (uTone == 1) {
    c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  } else if (uTone == 2) {
    c = (1.0 - exp(-1.5 * c)) / (1.0 - exp(-1.5));
  }
  outColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

let program: WebGLProgram | null = null;
let programGL: WebGL2RenderingContext | null = null;

export type ToneCurve = 'off' | 'aces' | 'soft';

export function getToneStage(exposure: number, tone: ToneCurve): GLEffectStage {
  return {
    type: 'tone',
    render: (gl, inputTexture, outputFramebuffer, width, height) => {
      if (!program || programGL !== gl) {
        program = linkProgram(gl, FULLSCREEN_VERT_SRC, TONE_FRAG_SRC);
        programGL = gl;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
      gl.viewport(0, 0, width, height);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputTexture);
      gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
      setSizeUniform(gl, program, width, height);
      gl.uniform1f(gl.getUniformLocation(program, 'uExposure'), exposure);
      gl.uniform1i(gl.getUniformLocation(program, 'uTone'), tone === 'aces' ? 1 : tone === 'soft' ? 2 : 0);
      drawFieldFullscreen(gl);
    },
  };
}
