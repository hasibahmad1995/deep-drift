/* Jellyfish: a glowing bell with trailing tentacles. */
import * as THREE from '../lib/three.js';
import { scene } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { TAU } from '../util/math.js';

/* ---- jellyfish: a glowing bell with trailing tentacles ---- */
const jellyBellGeo = new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI * 0.56);
function makeJelly(hue, glow) {
  const g = new THREE.Group(), R = Math.random;
  const uni = { uTime: U.time, uPhase: { value: R() * 6 }, uCol: { value: new THREE.Color().setHSL(hue, 0.65, 0.65) }, uFog: { value: scene.fog.color }, uAbs: U.absorb, uGlow: { value: glow }, uLight: { value: 1 } };
  const bell = new THREE.Mesh(jellyBellGeo, new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: `uniform float uTime; uniform float uPhase; varying vec3 vN; varying vec3 vV; varying vec3 vWP; varying vec3 vL;
      void main(){ vec3 p = position; float pulse = sin(uTime * 1.5 + uPhase);
        p.xz *= 1.0 + 0.10 * pulse * (1.0 - p.y) - 0.04 * pulse; p.y *= 1.0 + 0.10 * pulse; vL = position;
        vec4 w = modelMatrix * vec4(p, 1.0); vWP = w.xyz; vN = normalize(mat3(modelMatrix) * normalize(position)); vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uCol; uniform vec3 uFog; uniform vec3 uAbs; uniform float uGlow; uniform float uLight; varying vec3 vN; varying vec3 vV; varying vec3 vWP; varying vec3 vL;
      void main(){ float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float ang = atan(vL.z, vL.x); float rib = pow(abs(sin(ang * 8.0)), 10.0) * smoothstep(0.1, 0.9, 1.0 - vL.y);
        float rim = smoothstep(0.86, 1.0, 1.0 - vL.y);
        vec3 c = uCol * (0.35 * uLight + uGlow) * (0.5 + 0.9 * fr) + uCol * rib * 0.5 * (uLight + uGlow) + vec3(1.0, 0.9, 0.95) * rim * 0.35 * (uLight + uGlow);
        float a = 0.16 + 0.55 * fr + 0.22 * rib + 0.3 * rim;
        float dist = length(vWP - cameraPosition); vec3 T = exp(-uAbs * dist);
        c = c * T + uFog * (vec3(1.0) - T) * 0.0;
        gl_FragColor = vec4(c, a * (0.4 + 0.6 * T.b));
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  }));
  // tentacles: many thin lines that sway
  const n = 46, seg = 14, pos = [], sd = [];
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, rr = i < 30 ? 0.9 : 0.35 * R(), len = (i < 30 ? 1.3 : 2.0) + R() * 1.2;
    const seed = R() * 6;
    for (let k = 0; k < seg; k++) {
      for (const kk of [k, k + 1]) { pos.push(Math.cos(a) * rr * (1 - 0.15 * kk / seg), -len * kk / seg, Math.sin(a) * rr * (1 - 0.15 * kk / seg)); sd.push(seed); }
    }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('aSeed', new THREE.Float32BufferAttribute(sd, 1));
  const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, fog: false,
    vertexShader: `uniform float uTime; attribute float aSeed; varying float vY; varying vec3 vWP; void main(){ vec3 p = position; float k = -p.y;
        p.x += sin(uTime * 0.9 + aSeed + k * 2.2) * 0.12 * k; p.z += cos(uTime * 0.7 + aSeed + k * 2.0) * 0.12 * k; vY = k;
        vec4 w = modelMatrix * vec4(p, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uCol; uniform vec3 uAbs; uniform float uGlow; uniform float uLight; varying float vY; varying vec3 vWP;
      void main(){ float d = length(vWP - cameraPosition); vec3 T = exp(-uAbs * d);
        gl_FragColor = vec4(uCol * (0.4 * uLight + uGlow) , (0.5 - vY * 0.12) * T.b);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  }));
  g.add(bell, lines); g.userData.uni = uni;
  return g;
}

export { makeJelly };
