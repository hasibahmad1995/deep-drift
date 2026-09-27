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
      #include <colorspace_fragment>
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
    // A web of thin bright lines along the borders of moving cells (distance to the nearest two of a set of drifting points):
    // the crisscross pattern that light makes after passing through a rippled surface. 0 on a border, growing inside a cell.
    vec2 hash2(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
    float web(vec2 p, float t){ vec2 g = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 r = o + 0.5 + 0.5 * sin(t + 6.2831 * hash2(g + o)) - f; float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
      return sqrt(d2) - sqrt(d1); }
    float h(vec2 p){ return sin(p.x*0.9+uTime*1.1)*0.5 + sin(p.y*1.3-uTime*0.9)*0.4 + sin((p.x+p.y)*2.1+uTime*1.7)*0.2 + sin(p.x*3.7-p.y*2.9+uTime*2.3)*0.1 + sin(p.x*7.1+p.y*5.3-uTime*3.1)*0.05; }
    void main(){
      vec3 v = normalize(vWP - cameraPosition);
      vec2 e = vec2(0.06, 0.0);
      float hx = h(vWP.xz+e.xy)-h(vWP.xz-e.xy), hz = h(vWP.xz+e.yx)-h(vWP.xz-e.yx);   // the slope of the ripples
      vec3 n = normalize(vec3(-hx*0.75, 1.0, -hz*0.75));   // gentle: strong tilts broke the bright window into small puddles and let little light through
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
      // The window must not look like open sky: tint it with the water, and let the ripples break it up with moving light and dark
      // lines, brighter along the ripple crests (a focus of light, like the patterns on a pool floor but seen from below).
      float crest = h(vWP.xz+e.xy)+h(vWP.xz-e.xy)+h(vWP.xz+e.yx)+h(vWP.xz-e.yx)-4.0*h(vWP.xz);
      // two layers of the web (big and small cells, drifting differently), slightly bent by the ripples so it is not regular
      float lines = 0.0;
      if (length(vWP - cameraPosition) < 70.0) {   // only where it can be seen (far away it is lost in the water)
        vec2 q = vWP.xz + vec2(hx, hz) * 2.5;
        lines = 0.75 * (1.0 - smoothstep(0.0, 0.2, web(q * 1.35 + vec2(uTime * 0.05, 0.0), uTime * 0.7)))
              + 0.55 * (1.0 - smoothstep(0.0, 0.2, web(q * 3.1 + vec2(3.7, -uTime * 0.08), uTime * 1.0 + 2.0)));
      }
      float ripple = 0.2 + 0.26 * smoothstep(-0.12, 0.1, crest) + 0.2 * length(vec2(hx, hz));
      sky = mix(sky, uFogCol * 1.7 + vec3(0.0, 0.12, 0.28), 0.72) * ripple;   // a deeper water blue
      sky += vec3(0.4, 0.75, 1.0) * (lines * 0.26 + pow(lines, 3.0) * 0.2);   // sharp, bright lines of light
      refl *= 0.85 + 0.3 * lines;   // the mirror part is not smooth either: the same light web shows faintly in it (no silky sheet)
      refl += vec3(0.05, 0.16, 0.22) * pow(lines, 2.0);
      vec3 c = mix(sky, refl, clamp(f, 0.0, 1.0));
      c += vec3(0.75, 0.93, 1.0) * smoothstep(0.04, 0.3, f) * (1.0 - smoothstep(0.3, 0.75, f)) * 0.7;   // a clear silvery rim where the window meets the mirror part
      float dist = length(vWP - cameraPosition);
      vec3 T = exp(-uAbs * dist * 0.5);
      c = c * T + uFogCol * (vec3(1.0) - T);
      c = mix(uFogCol, c, uDay);
      gl_FragColor = vec4(c, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
}));
surface.rotation.x = Math.PI / 2; surface.renderOrder = -15; surface.frustumCulled = false;
scene.add(surface);

/* ---- shafts of sunlight ----
   The sun's light bends toward the vertical when it enters the water (Snell's law, water 1.33): a sun 32 degrees from
   overhead makes beams that lean only about 23 degrees. Every beam leans the same way (away from the sun), so they are
   parallel. The lean is applied last, after each sheet is turned, so turning a sheet cannot change where it leans. */
const SUN_HORIZ = Math.hypot(sunDir.x, sunDir.z), SUN_FROM_UP = Math.asin(Math.min(1, SUN_HORIZ / sunDir.length()));   // angle from overhead, in air
const BEAM_FROM_UP = Math.asin(Math.sin(SUN_FROM_UP) / 1.33), BEAM_TAN = Math.tan(BEAM_FROM_UP);                        // in the water
const BEAM_LEAN = [sunDir.x / SUN_HORIZ * BEAM_TAN, sunDir.z / SUN_HORIZ * BEAM_TAN];   // horizontal shift per metre of depth is minus this, away from the sun
const rayGroup = new THREE.Group();
/* Real sunbeams are not tubes. Waves bend the light into curved sheets: in the water they show as vertical streaks of light and
   shadow, like luminous zebra stripes, sharpest near the surface and larger, blurrier and fainter with depth, shimmering as the
   waves move. So each sheet here is only a carrier: how bright it is at a point comes from where that point's light entered the
   surface (the point moved back along the beam), so the stripes stay fixed in the water as you swim and all lean the same way. */
const rayUniforms = { uTime: U.time, uI: { value: 1 }, uCol: { value: new THREE.Color(0.55, 0.85, 1.0) }, uLean: { value: new THREE.Vector2(BEAM_LEAN[0], BEAM_LEAN[1]) } };
const rayMat = new THREE.ShaderMaterial({
  uniforms: rayUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  vertexShader: 'varying vec2 vUv; varying vec3 vWP; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform float uTime; uniform float uI; uniform vec3 uCol; uniform vec2 uLean; varying vec2 vUv; varying vec3 vWP;
    // streaks of light and shadow over the surface: bands of different widths that bend and drift (cheap: a few sines)
    float streaks(vec2 p, float t){
      float a = sin(p.x * 0.85 + sin(p.y * 0.7 + t * 0.6) * 1.4 + t * 0.8) * sin(p.y * 1.05 + sin(p.x * 0.55 - t * 0.5) * 1.2 - t * 0.7);
      vec2 q = p * 2.3 + vec2(3.1, -1.7);
      float b = sin(q.x + sin(q.y * 0.8 - t) * 1.1 + t * 1.3) * sin(q.y * 1.1 + sin(q.x * 0.7 + t * 0.9) - t * 1.1);
      return 0.5 + 0.5 * clamp(a * 0.65 + b * 0.35, -1.0, 1.0);
    }
    void main(){
      float depth = max(-vWP.y, 0.0);
      vec2 entry = vWP.xz - uLean * vWP.y;   // where this light came in at the surface (the beam leans away from the sun)
      float band = smoothstep(0.2, 0.8, streaks(entry, uTime));
      float sharp = exp(-depth / 30.0);      // sharp and contrasty near the surface, blurred and even deeper down
      float stripe = mix(0.5, band, clamp(sharp + 0.15, 0.0, 1.0));
      float across = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
      float along = exp(-depth / 42.0) * smoothstep(0.0, 1.5, depth) * smoothstep(0.0, 0.12, vUv.y);
      float d = length(vWP - cameraPosition);
      float a = across * along * stripe * uI * smoothstep(1.5, 9.0, d) * 0.34;
      gl_FragColor = vec4(uCol * a, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
});
(function makeRays() {
  const R = seeded(5), n = SMALL ? 8 : 14;   // wide sheets: the stripes on them make the beams
  for (let i = 0; i < n; i++) {
    const w = 30 + R() * 30, hgt = 130;
    const g = new THREE.PlaneGeometry(w, hgt, 1, 1);
    g.translate(0, -hgt / 2, 0);   // hangs down from the surface
    const m = new THREE.Mesh(g, rayMat);
    m.position.set((R() - 0.5) * 110, 0, (R() - 0.5) * 110);
    g.rotateY(R() * Math.PI);   // turn the sheet first (this bakes the turn into the shape) ...
    // ... then lean it: a point at height y (below the surface, so negative) moves by BEAM_LEAN * y, i.e. away from the sun as it goes down
    g.applyMatrix4(new THREE.Matrix4().set(1, BEAM_LEAN[0], 0, 0,  0, 1, 0, 0,  0, BEAM_LEAN[1], 1, 0,  0, 0, 0, 1));
    m.frustumCulled = false; m.renderOrder = 5;
    rayGroup.add(m);
  }
  scene.add(rayGroup);
})();

export { domeUniforms, dome, surfaceUniforms, surface, rayGroup, rayUniforms };
