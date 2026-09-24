/* The open water around you, the surface seen from below, and shafts of sunlight. */
import * as THREE from '../lib/three.js';
import { SMALL } from './device.js';
import { sunDir } from './lights.js';
import { scene } from './renderer.js';
import { U } from './uniforms.js';
import { seeded } from '../util/math.js';

/* ---- sky dome: the colour of the open water all around you ---- */
const domeUniforms = { uUp: { value: new THREE.Color() }, uDown: { value: new THREE.Color() }, uSun: { value: sunDir }, uGlow: { value: 1 } };
const dome = new THREE.Mesh(new THREE.SphereGeometry(1000, 24, 16), new THREE.ShaderMaterial({
  uniforms: domeUniforms, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform vec3 uUp; uniform vec3 uDown; uniform vec3 uSun; uniform float uGlow; varying vec3 vP;
    void main(){ vec3 d = normalize(vP); vec3 c = mix(uDown, uUp, smoothstep(-0.55, 0.75, d.y));
      float s = max(dot(d, normalize(uSun)), 0.0); c += vec3(0.55, 0.8, 0.9) * pow(s, 6.0) * 0.55 * uGlow + vec3(1.0, 0.98, 0.9) * pow(s, 90.0) * 1.4 * uGlow;
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`
}));
dome.renderOrder = -20; dome.frustumCulled = false;
scene.add(dome);

/* ---- the surface seen from below (with the bright circle where you can see out) ---- */
const surfaceUniforms = { uTime: U.time, uSun: { value: sunDir }, uFogCol: { value: new THREE.Color() }, uAbs: U.absorb, uDay: { value: 1 } };
const surface = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400, 1, 1), new THREE.ShaderMaterial({
  uniforms: surfaceUniforms, side: THREE.DoubleSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vWP; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform float uTime; uniform vec3 uSun; uniform vec3 uFogCol; uniform vec3 uAbs; uniform float uDay; varying vec3 vWP;
    float h(vec2 p){ return sin(p.x*0.9+uTime*1.1)*0.5 + sin(p.y*1.3-uTime*0.9)*0.4 + sin((p.x+p.y)*2.1+uTime*1.7)*0.2 + sin(p.x*3.7-p.y*2.9+uTime*2.3)*0.1 + sin(p.x*7.1+p.y*5.3-uTime*3.1)*0.05; }
    void main(){
      vec3 v = normalize(vWP - cameraPosition);
      vec2 e = vec2(0.06, 0.0);
      vec3 n = normalize(vec3(-(h(vWP.xz+e.xy)-h(vWP.xz-e.xy))*0.34, 1.0, -(h(vWP.xz+e.yx)-h(vWP.xz-e.yx))*0.34));
      vec3 nn = -n;
      float cosI = clamp(-dot(v, nn), 0.0, 1.0);
      vec3 r = refract(v, nn, 1.33);
      vec3 sky = vec3(0.6, 0.85, 1.0);
      float f = 1.0;
      if (length(r) > 0.001) { r = normalize(r);
        sky = mix(vec3(0.6, 0.85, 1.0), vec3(0.12, 0.45, 1.0), clamp(r.y * 1.6, 0.0, 1.0));
        sky += vec3(1.0, 0.97, 0.88) * pow(max(dot(r, normalize(uSun)), 0.0), 220.0) * 12.0 + vec3(1.0, 0.95, 0.8) * pow(max(dot(r, normalize(uSun)), 0.0), 14.0) * 0.7;
        f = 0.02 + 0.98 * pow(1.0 - cosI, 5.0);
      }
      vec3 refl = uFogCol * (0.9 + 0.5 * h(vWP.xz * 1.7)) ;
      vec3 c = mix(sky * 1.25, refl, clamp(f, 0.0, 1.0));
      float dist = length(vWP - cameraPosition);
      vec3 T = exp(-uAbs * dist * 0.5);
      c = c * T + uFogCol * (vec3(1.0) - T);
      c = mix(uFogCol, c, uDay);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`
}));
surface.rotation.x = Math.PI / 2; surface.renderOrder = -15; surface.frustumCulled = false;
scene.add(surface);

/* ---- shafts of sunlight ---- */
const rayGroup = new THREE.Group();
const rayUniforms = { uTime: U.time, uI: { value: 1 }, uCol: { value: new THREE.Color(0.55, 0.85, 1.0) } };
const rayMat = new THREE.ShaderMaterial({
  uniforms: rayUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  vertexShader: 'varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform float uTime; uniform float uI; uniform vec3 uCol; varying vec2 vUv; varying vec3 vWP;
    float hs(float x){ return fract(sin(x * 91.3) * 437.5); }
    void main(){
      float across = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
      float along = pow(1.0 - vUv.y, 1.4) * smoothstep(0.0, 0.03, 1.0 - vUv.y);
      float fl = 0.65 + 0.35 * sin(uTime * 0.7 + vUv.x * 9.0 + vUv.y * 3.0) * sin(uTime * 0.43 + vUv.y * 7.0);
      float d = length(vWP - cameraPosition);
      float a = across * along * fl * uI * smoothstep(1.5, 9.0, d) * 0.16;
      gl_FragColor = vec4(uCol * a, a);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`
});
(function makeRays() {
  const R = seeded(5), n = SMALL ? 12 : 22;
  for (let i = 0; i < n; i++) {
    const w = 3 + R() * 9, hgt = 130;
    const g = new THREE.PlaneGeometry(w, hgt, 1, 1);
    g.translate(0, -hgt / 2, 0);   // hangs down from the surface
    const m = new THREE.Mesh(g, rayMat);
    m.position.set((R() - 0.5) * 90, 0, (R() - 0.5) * 90);
    m.rotation.y = R() * Math.PI;
    m.rotation.z = 0.0;
    // slant the sheet the same way as the sun (shear top to bottom)
    g.applyMatrix4(new THREE.Matrix4().set(1, -sunDir.x / sunDir.y, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1));
    m.frustumCulled = false; m.renderOrder = 5;
    rayGroup.add(m);
  }
  scene.add(rayGroup);
})();

export { domeUniforms, dome, surfaceUniforms, surface, rayGroup, rayUniforms };
