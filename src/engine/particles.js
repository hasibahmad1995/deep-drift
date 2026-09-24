/* Drifting specks in the water (marine snow), glowing specks in the deep, and backscatter:
   the bright flecks you see in real deep-sea footage where the light beam catches particles right in front of the camera. */
import * as THREE from '../lib/three.js';
import { SMALL } from './device.js';
import { display, scene } from './renderer.js';
import { U } from './uniforms.js';
import { seeded } from '../util/math.js';

/* count specks spread through a box (size `box` metres) that always surrounds the camera.
   beam = true: the specks light up inside the torch's cone (the torch points straight ahead from the mask). */
function makeSnow(count, size, additive, box = 60, beam = false) {
  const R = seeded(9 + count), pos = new Float32Array(count * 3), seed = new Float32Array(count), colr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos.set([R() * box, R() * box, R() * box], i * 3); seed[i] = R();
    const c = additive ? new THREE.Color().setHSL([0.5, 0.45, 0.6, 0.85, 0.33][Math.floor(R() * 5)], 0.9, 0.6) : new THREE.Color(0.85, 0.95, 1);
    colr.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(colr, 3));
  const m = new THREE.ShaderMaterial({
    uniforms: { uCam: { value: new THREE.Vector3() }, uTime: U.time, uSize: { value: size }, uAlpha: { value: 0.6 }, uAbs: U.absorb, uPix: { value: display.pixelRatio },
      uBox: { value: box }, uBeam: { value: 0 } },
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false,
    vertexShader: `attribute float aSeed; attribute vec3 aCol; uniform vec3 uCam; uniform float uTime; uniform float uSize; uniform float uPix; uniform float uBox; uniform float uBeam;
      varying float vDist; varying vec3 vC; varying float vTw; varying float vLit;
      void main(){ vec3 p = position; p.y += uTime * (0.03 + aSeed * 0.05); p.x += sin(uTime * 0.3 + aSeed * 40.0) * 0.4;
        vec3 q = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5; vec4 mv = viewMatrix * vec4(uCam + q, 1.0); vDist = -mv.z; vC = aCol; vTw = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 60.0);
        // inside the torch cone and close by: lit. Brightest near the lamp, fading with distance.
        float inCone = smoothstep(0.72, 0.9, dot(normalize(mv.xyz), vec3(0.0, 0.0, -1.0)));
        vLit = ${beam ? 'uBeam * inCone * smoothstep(0.25, 0.8, vDist) / (1.0 + vDist * vDist * 0.06)' : '0.0'};
        gl_Position = projectionMatrix * mv; gl_PointSize = min(uSize * uPix * (60.0 / max(-mv.z, 0.5)) * (0.6 + aSeed * 0.8), ${beam ? '9.0' : '64.0'} * uPix); }`,   // beam specks stay small, even right at the lens
    fragmentShader: `uniform float uAlpha; uniform vec3 uAbs; varying float vDist; varying vec3 vC; varying float vTw; varying float vLit;
      void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard; float a = smoothstep(0.5, 0.0, r) * uAlpha * exp(-uAbs.b * vDist * 1.4) * ${additive ? 'vTw' : '1.0'};
        a = max(a, smoothstep(0.5, 0.1, r) * min(vLit, 1.0));
        gl_FragColor = vec4(mix(vC, vec3(1.0, 0.97, 0.9) * 1.8, min(vLit, 1.0)), a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 8;
  scene.add(p); return p;
}
const snow = makeSnow(SMALL ? 500 : 1100, 1.8, false);
const glowSpecks = makeSnow(SMALL ? 250 : 500, 2.6, true);
const backscatter = makeSnow(SMALL ? 400 : 800, 0.45, false, 12, true);   // a dense cloud of tiny specks close to you, seen only in the light beam
backscatter.material.uniforms.uAlpha.value = 0.0;

export { makeSnow, snow, glowSpecks, backscatter };
