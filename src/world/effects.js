/* Vent smoke, liquid CO2 droplets and soft glows. */
import * as THREE from '../lib/three.js';
import { U } from '../engine/uniforms.js';
import { canvasTexture } from '../util/textures.js';

/* ---- smoke rising from a hot vent ---- */
function makeSmoke(x, y, z) {
  const n = 40, pos = new Float32Array(n * 3), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); sd[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uAbs: U.absorb, uPix: U.pix }, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPix; varying float vA; varying float vD;
      void main(){ float k = fract(uTime * 0.07 + aSeed); vec3 p = position + vec3(sin(k * 6.0 + aSeed * 20.0) * 1.2 * k, k * 22.0, cos(k * 5.0 + aSeed * 30.0) * 1.2 * k);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); vA = (1.0 - k) * smoothstep(0.0, 0.08, k); vD = -mv.z; gl_Position = projectionMatrix * mv; gl_PointSize = (30.0 + k * 150.0) * uPix * (12.0 / max(-mv.z, 2.0)); }`,
    fragmentShader: `uniform vec3 uAbs; varying float vA; varying float vD; void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard;
        gl_FragColor = vec4(vec3(0.05, 0.05, 0.06), smoothstep(0.5, 0.1, r) * vA * 0.5 * exp(-uAbs.b * vD * 0.5));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 6; return p;
}
/* ---- droplets of liquid carbon dioxide rising from cracks in the floor, as at the Champagne vent (Mariana Arc, ~1,600 m) ----
   They are small, bright and wobble a little as they rise, then fade out a few metres up. */
function makeDroplets(x, y, z) {
  const n = 60, pos = new Float32Array(n * 3), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([x + (Math.random() - 0.5) * 0.8, y, z + (Math.random() - 0.5) * 0.8], i * 3); sd[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uAbs: U.absorb, uPix: U.pix }, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPix; varying float vA; varying float vD;
      void main(){ float k = fract(uTime * 0.12 + aSeed); vec3 p = position + vec3(sin(uTime * 3.0 + aSeed * 40.0) * 0.06, k * 6.0, cos(uTime * 2.6 + aSeed * 30.0) * 0.06);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); vA = smoothstep(0.0, 0.05, k) * (1.0 - smoothstep(0.7, 1.0, k)); vD = -mv.z;
        gl_Position = projectionMatrix * mv; gl_PointSize = (0.05 + aSeed * 0.04) * uPix * 900.0 / max(-mv.z, 0.5); }`,
    fragmentShader: `uniform vec3 uAbs; varying float vA; varying float vD; void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard;
        float ring = smoothstep(0.5, 0.35, r) * (0.5 + 0.5 * smoothstep(0.15, 0.4, r));   // a clear droplet: brighter at the edge
        gl_FragColor = vec4(vec3(0.85, 0.92, 1.0), ring * vA * 0.8 * exp(-uAbs.b * vD * 0.6));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 7; return p;
}
function glowSprite(size, color) {
  const tex = canvasTexture(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const m = new THREE.SpriteMaterial({ map: tex, color: color, blending: THREE.AdditiveBlending, depthWrite: false, fog: true, transparent: true });
  // the glow fades with distance through the water like everything else (each colour at its own rate), so a far glow
  // melts away instead of shining at full strength until its place stops being drawn
  m.onBeforeCompile = sh => {
    sh.uniforms.uAbsorb = U.absorb;
    sh.fragmentShader = 'uniform vec3 uAbsorb;\n' + sh.fragmentShader.replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb *= exp(-uAbsorb * vFogDepth);\n#include <tonemapping_fragment>');
  };
  m.customProgramCacheKey = () => 'glow';
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1); return s;
}

export { makeSmoke, makeDroplets, glowSprite };
