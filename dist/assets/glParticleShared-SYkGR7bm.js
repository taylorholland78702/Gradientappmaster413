const b=`#version 300 es
const vec2 verts[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
void main() {
  gl_Position = vec4(verts[gl_VertexID], 0.0, 1.0);
}`,v=`#version 300 es
precision highp float;
uniform vec4 uColor;
out vec4 outColor;
void main() { outColor = uColor; }`,B=`#version 300 es
in vec2 a_position;
in vec4 a_color;
in float a_size;
out vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = a_color;
}`,F=`#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() { outColor = v_color; }`,P=`#version 300 es
in vec2 a_position;
in vec4 a_color;
out vec4 v_color;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_color = a_color;
}`,S=`#version 300 es
precision highp float;
in vec4 v_color;
out vec4 outColor;
void main() { outColor = v_color; }`;function R(e,a,t){const n=e.createShader(a);if(e.shaderSource(n,t),e.compileShader(n),!e.getShaderParameter(n,e.COMPILE_STATUS)){const o=e.getShaderInfoLog(n);throw e.deleteShader(n),new Error(`Shader compile failed: ${o}`)}return n}function f(e,a,t){const n=R(e,e.VERTEX_SHADER,a),o=R(e,e.FRAGMENT_SHADER,t),r=e.createProgram();if(e.attachShader(r,n),e.attachShader(r,o),e.linkProgram(r),e.deleteShader(n),e.deleteShader(o),!e.getProgramParameter(r,e.LINK_STATUS)){const i=e.getProgramInfoLog(r);throw e.deleteProgram(r),new Error(`Program link failed: ${i}`)}return r}function h(e,a){const t=document.createElement("canvas");t.width=Math.max(1,e),t.height=Math.max(1,a);const n=t.getContext("webgl2",{antialias:!1,preserveDrawingBuffer:!0,alpha:!1});return{gl:n,canvas:t,fadeProgram:f(n,b,v),pointProgram:f(n,B,F),triProgram:f(n,P,S),width:t.width,height:t.height}}let s=null;function L(){if(s!==null)return s;try{s=!!document.createElement("canvas").getContext("webgl2",{antialias:!1})}catch{s=!1}return s}function m(e,a){const{gl:t,fadeProgram:n}=e;t.useProgram(n),t.uniform4f(t.getUniformLocation(n,"uColor"),0,0,0,a),t.enable(t.BLEND),t.blendFunc(t.SRC_ALPHA,t.ONE_MINUS_SRC_ALPHA),t.drawArrays(t.TRIANGLES,0,3)}function p(e,a,t,n){return[e/t*2-1,1-a/n*2]}const _=new WeakMap;function l(e,a){let t=_.get(e);if(t)return t;const n=e.createVertexArray();e.bindVertexArray(n);const o=e.createBuffer(),r=e.createBuffer(),i=e.createBuffer(),c=e.getAttribLocation(a,"a_position");e.bindBuffer(e.ARRAY_BUFFER,o),e.enableVertexAttribArray(c),e.vertexAttribPointer(c,2,e.FLOAT,!1,0,0);const A=e.getAttribLocation(a,"a_color");e.bindBuffer(e.ARRAY_BUFFER,r),e.enableVertexAttribArray(A),e.vertexAttribPointer(A,4,e.FLOAT,!1,0,0);const u=e.getAttribLocation(a,"a_size");return e.bindBuffer(e.ARRAY_BUFFER,i),e.enableVertexAttribArray(u),e.vertexAttribPointer(u,1,e.FLOAT,!1,0,0),e.bindVertexArray(null),t={posBuf:o,colorBuf:r,sizeBuf:i,vao:n},_.set(e,t),t}function C(e,a,t,n,o){if(o===0)return;const{gl:r,pointProgram:i}=e,c=l(r,i);r.useProgram(i),r.bindVertexArray(c.vao),r.bindBuffer(r.ARRAY_BUFFER,c.posBuf),r.bufferData(r.ARRAY_BUFFER,a,r.DYNAMIC_DRAW),r.bindBuffer(r.ARRAY_BUFFER,c.colorBuf),r.bufferData(r.ARRAY_BUFFER,t,r.DYNAMIC_DRAW),r.bindBuffer(r.ARRAY_BUFFER,c.sizeBuf),r.bufferData(r.ARRAY_BUFFER,n,r.DYNAMIC_DRAW),r.enable(r.BLEND),r.blendFunc(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA),r.drawArrays(r.POINTS,0,o),r.bindVertexArray(null)}const d=new WeakMap;function E(e,a){let t=d.get(e);if(t)return t;const n=e.createVertexArray();e.bindVertexArray(n);const o=e.createBuffer(),r=e.createBuffer(),i=e.getAttribLocation(a,"a_position");e.bindBuffer(e.ARRAY_BUFFER,o),e.enableVertexAttribArray(i),e.vertexAttribPointer(i,2,e.FLOAT,!1,0,0);const c=e.getAttribLocation(a,"a_color");return e.bindBuffer(e.ARRAY_BUFFER,r),e.enableVertexAttribArray(c),e.vertexAttribPointer(c,4,e.FLOAT,!1,0,0),e.bindVertexArray(null),t={posBuf:o,colorBuf:r,vao:n},d.set(e,t),t}function x(e,a,t,n){if(n===0)return;const{gl:o,triProgram:r}=e,i=E(o,r);o.useProgram(r),o.bindVertexArray(i.vao),o.bindBuffer(o.ARRAY_BUFFER,i.posBuf),o.bufferData(o.ARRAY_BUFFER,a,o.DYNAMIC_DRAW),o.bindBuffer(o.ARRAY_BUFFER,i.colorBuf),o.bufferData(o.ARRAY_BUFFER,t,o.DYNAMIC_DRAW),o.enable(o.BLEND),o.blendFunc(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA),o.drawArrays(o.TRIANGLES,0,n),o.bindVertexArray(null)}export{m as a,C as b,x as c,L as d,h as i,p as t};
