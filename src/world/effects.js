/* Vent smoke and soft glows. */
import * as THREE from '../lib/three.js';
import { display } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { canvasTexture } from '../util/textures.js';

/* ---- smoke rising from a hot vent ---- */
function makeSmoke(x, y, z) {
  const n = 40, pos = new Float32Array(n * 3), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); sd[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uAbs: U.absorb, uPix: { value: display.pixelRatio } }, transparent: true, depthWrite: false, fog: false,
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
function glowSprite(size, color) {
  const tex = canvasTexture(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  s.scale.set(size, size, 1); return s;
}

export { makeSmoke, glowSprite };
