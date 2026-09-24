/* Drifting specks in the water (marine snow) and glowing specks in the deep. */
import * as THREE from '../lib/three.js';
import { SMALL } from './device.js';
import { display, scene } from './renderer.js';
import { U } from './uniforms.js';
import { seeded } from '../util/math.js';

/* ---- drifting specks in the water (marine snow) ---- */
function makeSnow(count, size, additive) {
  const R = seeded(9 + count), pos = new Float32Array(count * 3), seed = new Float32Array(count), colr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([R() * 60, R() * 60, R() * 60], i * 3); seed[i] = R();
    const c = additive ? new THREE.Color().setHSL([0.5, 0.45, 0.6, 0.85, 0.33][Math.floor(R() * 5)], 0.9, 0.6) : new THREE.Color(0.85, 0.95, 1);
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(colr, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uCam: { value: new THREE.Vector3() }, uTime: U.time, uSize: { value: size }, uAlpha: { value: 0.6 }, uAbs: U.absorb, uPix: { value: display.pixelRatio } },
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false,
    vertexShader: `attribute float aSeed; attribute vec3 aCol; uniform vec3 uCam; uniform float uTime; uniform float uSize; uniform float uPix; varying float vDist; varying vec3 vC; varying float vTw;
      void main(){ vec3 p = position; p.y += uTime * (0.03 + aSeed * 0.05); p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.4;
        vec3 q = mod(p - uCam + 30.0, 60.0) - 30.0; vec4 mv = viewMatrix * vec4(uCam + q, 1.0); vDist = -mv.z; vC = aCol; vTw = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 60.0);
        gl_Position = projectionMatrix * mv; gl_PointSize = uSize * uPix * (60.0 / max(-mv.z, 0.5)) * (0.6 + aSeed * 0.8); }`,
    fragmentShader: `uniform float uAlpha; uniform vec3 uAbs; varying float vDist; varying vec3 vC; varying float vTw;
      void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r) * uAlpha * exp(-uAbs.b * vDist * 1.4) * ${additive ? 'vTw' : '1.0'};
        gl_FragColor = vec4(vC, a);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 8;
  scene.add(p); return p;
}
const snow = makeSnow(SMALL ? 500 : 1100, 1.8, false);
const glowSpecks = makeSnow(SMALL ? 250 : 500, 2.6, true);

export { makeSnow, snow, glowSpecks };
