import{s as te,f as oe,B as re,D as ae}from"./index-CGtt7uIh.js";import"./icons-Cc2HnLEj.js";const n=220,i=140,H=12,x=16,G=`#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 pos = verts[gl_VertexID];
  vUv = (pos + 1.0) * 0.5;
  gl_Position = vec4(pos, 0.0, 1.0);
}`,ne=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform float uFeed;
uniform float uKill;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 c = texture(uState, vUv);
  vec4 l = texture(uState, vUv - vec2(uTexel.x, 0.0));
  vec4 r = texture(uState, vUv + vec2(uTexel.x, 0.0));
  vec4 d = texture(uState, vUv - vec2(0.0, uTexel.y));
  vec4 up = texture(uState, vUv + vec2(0.0, uTexel.y));
  float uu = c.r, vv = c.g;
  float lapU = l.r + r.r + d.r + up.r - 4.0 * uu;
  float lapV = l.g + r.g + d.g + up.g - 4.0 * vv;
  float reaction = uu * vv * vv;
  const float Du = 1.0, Dv = 0.5, dt = 0.2;
  float nu = clamp(uu + dt * (Du * lapU - reaction + uFeed * (1.0 - uu)), 0.0, 1.0);
  float nv = clamp(vv + dt * (Dv * lapV + reaction - (uKill + uFeed) * vv), 0.0, 1.0);
  outColor = vec4(nu, nv, 0.0, 1.0);
}`,ie=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform vec2 uSize;
uniform int uSprinkleCount;
uniform vec2 uSprinklePos[${x}];
uniform int uBlobActive;
uniform vec2 uBlobCenter;
in vec2 vUv;
out vec4 outColor;
void main() {
  vec4 c = texture(uState, vUv);
  vec2 texel = floor(vUv * uSize);
  float vv = c.g;
  for (int i = 0; i < ${x}; i++) {
    if (i >= uSprinkleCount) break;
    if (distance(texel + 0.5, uSprinklePos[i]) < 0.5) vv = 1.0;
  }
  if (uBlobActive == 1) {
    vec2 d = texel + 0.5 - uBlobCenter;
    if (dot(d, d) <= 9.0) vv = 1.0;
  }
  outColor = vec4(c.r, vv, 0.0, 1.0);
}`,ce=`#version 300 es
precision highp float;
uniform sampler2D uState;
uniform float uContrast;
uniform int uPaletteMode;
uniform float uBands;
uniform vec3 uColors[${H}];
uniform int uColorCount;
${re}
${ae}
in vec2 vUv;
out vec4 outColor;

float applyFieldContrast(float t, float amount) {
  if (amount == 1.0) return t;
  float centered = t - 0.5;
  float s = centered < 0.0 ? -1.0 : 1.0;
  float shaped = s * pow(abs(centered) * 2.0, amount) * 0.5;
  return clamp(shaped + 0.5, 0.0, 1.0);
}

// The sim grid is only 220x140, so it is magnified a few times over on screen.
// Plain nearest sampling shows blocks and plain bilinear shows diamond-shaped
// creases at every texel, so this blends the four surrounding texels with a
// quintic smootherstep weight (continuous in value, slope and curvature).
// Done by hand with texelFetch because the state textures are float RGBA32F
// with NEAREST filtering, which the sim itself relies on.
float sampleSmooth(vec2 uv) {
  ivec2 sz = textureSize(uState, 0);
  vec2 p = uv * vec2(sz) - 0.5;
  vec2 i = floor(p);
  vec2 f = p - i;
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  ivec2 i0 = clamp(ivec2(i), ivec2(0), sz - 1);
  ivec2 i1 = clamp(ivec2(i) + 1, ivec2(0), sz - 1);
  float a = texelFetch(uState, i0, 0).g;
  float b = texelFetch(uState, ivec2(i1.x, i0.y), 0).g;
  float c = texelFetch(uState, ivec2(i0.x, i1.y), 0).g;
  float d = texelFetch(uState, i1, 0).g;
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float v = sampleSmooth(vUv);
  float t = clamp(v * 3.0, 0.0, 1.0);
  float shaped = applyFieldContrast(t, uContrast);
  float tt = mod(mod(shaped, 1.0) + 1.0, 1.0);
  if (uPaletteMode == 1) {
    float steps = max(2.0, floor(uBands + 0.5));
    tt = min(1.0, floor(tt * steps) / (steps - 1.0));
  } else if (uPaletteMode == 2) {
    float repeats = max(1.0, floor(uBands + 0.5));
    tt = mod(tt * repeats, 1.0);
  }
  vec3 color = paletteLookup(tt);
  outColor = vec4(antiBand(color), 1.0);
}`;function $(t,r,u){const a=t.createShader(r);if(t.shaderSource(a,u),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS)){const l=t.getShaderInfoLog(a);throw t.deleteShader(a),new Error(`Shader compile failed: ${l}`)}return a}function I(t,r,u){const a=$(t,t.VERTEX_SHADER,r),l=$(t,t.FRAGMENT_SHADER,u),s=t.createProgram();if(t.attachShader(s,a),t.attachShader(s,l),t.linkProgram(s),t.deleteShader(a),t.deleteShader(l),!t.getProgramParameter(s,t.LINK_STATUS)){const A=t.getProgramInfoLog(s);throw t.deleteProgram(s),new Error(`Program link failed: ${A}`)}return s}function V(t,r){const u=t.createTexture();return t.bindTexture(t.TEXTURE_2D,u),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.REPEAT),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.NEAREST),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.NEAREST),t.texImage2D(t.TEXTURE_2D,0,t.RGBA32F,n,i,0,t.RGBA,t.FLOAT,r),u}function W(t,r){const u=t.createFramebuffer();return t.bindFramebuffer(t.FRAMEBUFFER,u),t.framebufferTexture2D(t.FRAMEBUFFER,t.COLOR_ATTACHMENT0,t.TEXTURE_2D,r,0),u}let R=null;function me(){if(R!==null)return R;try{const r=document.createElement("canvas").getContext("webgl2",{antialias:!1});if(!r||!r.getExtension("EXT_color_buffer_float"))return R=!1,!1;const u=r.getShaderPrecisionFormat(r.FRAGMENT_SHADER,r.HIGH_FLOAT);if(!u||u.precision===0)return R=!1,!1;const a=r.createTexture();r.bindTexture(r.TEXTURE_2D,a),r.texImage2D(r.TEXTURE_2D,0,r.RGBA32F,1,1,0,r.RGBA,r.FLOAT,null);const l=r.createFramebuffer();r.bindFramebuffer(r.FRAMEBUFFER,l),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,a,0);const s=r.checkFramebufferStatus(r.FRAMEBUFFER)===r.FRAMEBUFFER_COMPLETE;return R=s,s}catch{return R=!1,!1}}function ue(t,r){const u=document.createElement("canvas");u.width=n,u.height=i;const a=u.getContext("webgl2",{antialias:!1,preserveDrawingBuffer:!1});a.getExtension("EXT_color_buffer_float");const l=I(a,G,ne),s=I(a,G,ie),A=I(a,G,ce),p=new Float32Array(n*i*4);for(let E=0;E<n*i;E++)p[E*4]=t[E],p[E*4+1]=r[E];const F=V(a,p),S=V(a,null),b=W(a,F),g=W(a,S);return a.bindFramebuffer(a.FRAMEBUFFER,null),{gl:a,canvas:u,stepProgram:l,pokeProgram:s,colorProgram:A,texA:F,texB:S,fboA:b,fboB:g,current:"A",readBuf:new Float32Array(n*i*4),vOut:new Float32Array(n*i),displayUploadBuf:new Float32Array(n*i*4)}}function N(t){t.drawArrays(t.TRIANGLES,0,3)}const se=typeof window<"u"&&new URLSearchParams(window.location.search).get("display")==="1";function de(t){const{fieldContrast:r,paletteMode:u,paletteBands:a,gradientColors:l,reactionDiffusionFeed:s,reactionDiffusionKill:A,reactionDiffusionSpeed:p,reactionDiffusionGridRef:F,canvas:S,ctx:b,displayWidth:g,displayHeight:E,isAudioEnabled:Y,isAudioReactive:q,audioSubBassLevel:j,audioMidsLevel:J,audioTrebleLevel:Q}=t;let z;if(S.width===0||S.height===0)return z;if(!F.current){const c=new Float32Array(n*i).fill(1),h=new Float32Array(n*i).fill(0);for(let C=0;C<6;C++){const X=Math.floor(Math.random()*n),O=Math.floor(Math.random()*i);for(let T=-3;T<=3;T++)for(let d=-3;d<=3;d++){if(d*d+T*T>9)continue;const U=(X+d+n)%n,k=(O+T+i)%i;h[k*n+U]=1}}const f=document.createElement("canvas");f.width=n,f.height=i,F.current={u:c,v:h,u2:new Float32Array(n*i),v2:new Float32Array(n*i),canvas:f,time:0}}const m=F.current;m.gl||(m.gl=ue(m.u,m.v));const o=m.gl,e=o.gl,P=c=>c==="A"?o.texA:o.texB,w=c=>c==="A"?o.fboA:o.fboB,_=c=>c==="A"?"B":"A";if(se){const c=m.v,h=o.displayUploadBuf;for(let f=0;f<n*i;f++)h[f*4+1]=c[f];e.bindTexture(e.TEXTURE_2D,P(o.current)),e.texSubImage2D(e.TEXTURE_2D,0,0,0,n,i,e.RGBA,e.FLOAT,h)}else{const c=Y&&q,h=c?1+j*.8:1,f=c?1+Q*1.2:1;m.time+=.0025*p*h;const C=s+Math.sin(m.time*.6)*.006*f,X=A+Math.cos(m.time*.4)*.004*f,O=Math.max(1,Math.round(p*30)),T=Math.max(1,Math.round(p*2*(c?1+J*.6:1))),d=[];for(let v=0;v<T&&d.length<x*2;v++)Math.random()<.15&&d.push(Math.floor(Math.random()*n),Math.floor(Math.random()*i));const U=Math.random()<.01*p,k=U?Math.floor(Math.random()*n):0,ee=U?Math.floor(Math.random()*i):0;e.viewport(0,0,n,i),e.useProgram(o.pokeProgram),e.bindFramebuffer(e.FRAMEBUFFER,w(_(o.current))),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,P(o.current)),e.uniform1i(e.getUniformLocation(o.pokeProgram,"uState"),0),e.uniform2f(e.getUniformLocation(o.pokeProgram,"uSize"),n,i),e.uniform1i(e.getUniformLocation(o.pokeProgram,"uSprinkleCount"),Math.min(x,d.length/2));const K=new Float32Array(x*2);K.set(d.slice(0,x*2)),e.uniform2fv(e.getUniformLocation(o.pokeProgram,"uSprinklePos"),K),e.uniform1i(e.getUniformLocation(o.pokeProgram,"uBlobActive"),U?1:0),e.uniform2f(e.getUniformLocation(o.pokeProgram,"uBlobCenter"),k,ee),N(e),o.current=_(o.current),e.useProgram(o.stepProgram),e.uniform2f(e.getUniformLocation(o.stepProgram,"uTexel"),1/n,1/i),e.uniform1f(e.getUniformLocation(o.stepProgram,"uFeed"),C),e.uniform1f(e.getUniformLocation(o.stepProgram,"uKill"),X),e.uniform1i(e.getUniformLocation(o.stepProgram,"uState"),0);for(let v=0;v<O;v++)e.bindFramebuffer(e.FRAMEBUFFER,w(_(o.current))),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,P(o.current)),N(e),o.current=_(o.current);e.bindFramebuffer(e.FRAMEBUFFER,w(o.current)),e.readPixels(0,0,n,i,e.RGBA,e.FLOAT,o.readBuf);for(let v=0;v<n*i;v++)o.vOut[v]=o.readBuf[v*4+1];m.v=o.vOut}const M=l,y=Math.max(1,Math.min(H,M.length)),L=new Float32Array(H*3);for(let c=0;c<y;c++)L[c*3]=M[c].r/255,L[c*3+1]=M[c].g/255,L[c*3+2]=M[c].b/255;const{w:B,h:D}=oe(g,E);o.canvas.width!==B&&(o.canvas.width=B),o.canvas.height!==D&&(o.canvas.height=D),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,B,D),e.useProgram(o.colorProgram),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,P(o.current)),e.uniform1i(e.getUniformLocation(o.colorProgram,"uState"),0),e.uniform1f(e.getUniformLocation(o.colorProgram,"uContrast"),r);const Z=u==="banded"?1:u==="cyclic"?2:0;return e.uniform1i(e.getUniformLocation(o.colorProgram,"uPaletteMode"),Z),e.uniform1f(e.getUniformLocation(o.colorProgram,"uBands"),a),e.uniform3fv(e.getUniformLocation(o.colorProgram,"uColors"),L),e.uniform1i(e.getUniformLocation(o.colorProgram,"uColorCount"),y),te(e,o.colorProgram,y),N(e),b.imageSmoothingEnabled=!0,b.drawImage(o.canvas,0,0,B,D,0,0,g,E),z}export{me as detectRDGLSupport,de as drawReactionDiffusionGL};
