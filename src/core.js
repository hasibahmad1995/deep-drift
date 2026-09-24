
/* =====================================================================
   1. EASY-TO-CHANGE SETTINGS
   ===================================================================== */
const SETTINGS = {
  siteName: 'Deep Drift',
  tagline: 'A dive from the sunlit surface to the deepest trench.',
  speed: 1,            // 1 = normal dive speed. 0.5 = half speed. 2 = double speed.
  musicVolume: 0.5,    // 0 is silent, 1 is loudest
  lookRange: 1.25,     // how far you can turn your head (in radians)
  reefDetail: 1,       // 1 = full coral and fish. Phones use half of this automatically.
  maxPixelRatio: 2     // lower (for example 1.5) if a phone feels slow
};

// The dive, one row per place. seconds = how long it lasts at normal speed.
const STAGES = [
  { id: 'reef',   name: 'Coral reef',          seconds: 80 },
  { id: 'blue',   name: 'Open ocean',          seconds: 62 },
  { id: 'mid',    name: 'Midnight zone',       seconds: 44 },
  { id: 'vents',  name: 'Hydrothermal vents',  seconds: 30 },
  { id: 'wreck',  name: 'The abyss',           seconds: 30 },
  { id: 'trench', name: 'Deep trench',         seconds: 36 }
];

// Colour of the water at each depth (metres) and how fast each colour of light fades per metre.
// Red fades first, then green, then blue. This is why deep water looks blue and then black.
const ENV = [
  { d: 0,     fog: '#1a9cc8', abs: [0.115, 0.042, 0.020] },
  { d: 60,    fog: '#0e6e9c', abs: [0.150, 0.056, 0.028] },
  { d: 200,   fog: '#0b5583', abs: [0.220, 0.090, 0.050] },
  { d: 500,   fog: '#07345a', abs: [0.300, 0.130, 0.080] },
  { d: 1000,  fog: '#041a33', abs: [0.340, 0.170, 0.110] },
  { d: 3000,  fog: '#020c1a', abs: [0.320, 0.170, 0.120] },
  { d: 11000, fog: '#010409', abs: [0.320, 0.170, 0.120] }
];

/* =====================================================================
   2. SMALL HELPERS
   ===================================================================== */
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);
const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const $ = id => document.getElementById(id);
const SMALL = Math.min(window.innerWidth, window.innerHeight) < 600 || /Mobi|Android/i.test(navigator.userAgent);
const DETAIL = SETTINGS.reefDetail * (SMALL ? 0.5 : 1);
const col = h => new THREE.Color(h).convertSRGBToLinear();   // hex colour to the linear colour three.js needs

/* =====================================================================
   3. RENDERER, SCENE AND CAMERA
   ===================================================================== */
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !SMALL, powerPreference: 'high-performance', preserveDrawingBuffer: /still/.test(location.search) });
let pixelRatio = Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : SETTINGS.maxPixelRatio);
renderer.setPixelRatio(pixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a9cc8, 0.0001);
const camera = new THREE.PerspectiveCamera(74, 1, 0.08, 1500);
scene.add(camera);

/* Light, fog and colour of the water change with depth. */
const sunDir = new THREE.Vector3(0.6, 1, 0.15).normalize();
const sun = new THREE.DirectionalLight(0xfff2dc, 3);
sun.position.copy(sunDir).multiplyScalar(100);
const hemi = new THREE.HemisphereLight(0x7fd0ff, 0x1a3b4a, 1);
const torch = new THREE.SpotLight(0xfff0d8, 0, 80, 0.75, 0.85, 1.0);   // the diver's torch
camera.add(torch); camera.add(torch.target);
torch.position.set(0.15, -0.15, 0); torch.target.position.set(0, 0, -10);
scene.add(sun, hemi);

const U = {   // values shared by every material
  time: { value: 0 },
  absorb: { value: new THREE.Vector3(0.115, 0.042, 0.02) },
  caust: { value: 1 }
};

// three.js r128 blends fog after colour encoding. We blend it ourselves inside wet(), before tone mapping,
// so the fog matches the sky dome exactly. So the stock fog step is switched off.
THREE.ShaderChunk.fog_fragment = '';

const GLSL_NOISE = `
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y); }
float caust(vec3 p, float t){ vec2 q = vec2(p.x * 0.6 + p.z * 0.5, p.y * 0.5 + p.z * 0.35 + p.x * 0.15); float a = vnoise(q + vec2(t * 0.15, t * 0.1));
  float b = vnoise(q * 1.8 - vec2(t * 0.12, -t * 0.09) + a * 2.0); float c = 1.0 - abs(b * 2.0 - 1.0); return pow(c, 7.0) * 1.5; }
`;

/* Makes an ordinary material feel wet: colour fading with distance, moving light patches (caustics),
   rock grain, and swimming movement.
   bend = { mode, amp, speed, wave, len }
     mode 1 = swims side to side (fish, sharks, squid arms)
     mode 2 = swims up and down (whales)
     mode 3 = flaps wings (manta)
     mode 4 = sways upward-pointing things (tube worms) */
function wet(mat, o = {}) {
  const bend = o.bend || null;
  mat.customProgramCacheKey = () => JSON.stringify(o);
  mat.onBeforeCompile = sh => {
    sh.uniforms.uAbsorb = U.absorb; sh.uniforms.uTime = U.time; sh.uniforms.uCaust = U.caust;
    let vs = 'varying vec3 vWP;\nuniform float uTime;\nattribute float aPhase;\n', fs = 'varying vec3 vWP;\nuniform float uTime;\nuniform float uCaust;\nuniform vec3 uAbsorb;\n' + GLSL_NOISE;
    if (bend) {
      sh.uniforms.uBend = { value: new THREE.Vector4(bend.amp, bend.speed, bend.wave, bend.len) };
      vs += 'uniform vec4 uBend;\n';
      let code = '';
      if (bend.mode === 1) code = 'float bt = clamp((0.5*uBend.w - position.x)/uBend.w, 0.0, 1.4); transformed.z += sin(uBend.y*uTime - bt*uBend.z + aPhase)*uBend.x*uBend.w*bt*bt;';
      if (bend.mode === 2) code = 'float bt = clamp((0.5*uBend.w - position.x)/uBend.w, 0.0, 1.4); transformed.y += sin(uBend.y*uTime - bt*uBend.z + aPhase)*uBend.x*uBend.w*bt*bt;';
      if (bend.mode === 3) code = 'float az = abs(position.z); transformed.y += sin(uBend.y*uTime - az*uBend.z + aPhase)*uBend.x*az;';
      if (bend.mode === 4) code = 'float bt = clamp(position.y/uBend.w, 0.0, 1.4); transformed.x += sin(uBend.y*uTime + aPhase)*uBend.x*uBend.w*bt*bt; transformed.z += cos(uBend.y*uTime*0.8 + aPhase)*uBend.x*uBend.w*bt*bt*0.6;';
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + code);
    }
    sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvec4 wp4 = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwp4 = instanceMatrix * wp4;\n#endif\nvWP = (modelMatrix * wp4).xyz;');
    sh.vertexShader = vs + sh.vertexShader;
    let f = sh.fragmentShader;
    f = f.replace('#include <tonemapping_fragment>', '#ifdef USE_FOG\n vec3 fogT = exp(-uAbsorb * fogDepth);\n gl_FragColor.rgb = gl_FragColor.rgb * fogT + fogColor * (vec3(1.0) - fogT);\n#endif\n#include <tonemapping_fragment>');
    if (o.detail) f = f.replace('#include <color_fragment>', '#include <color_fragment>\n vec2 dp = vec2(vWP.x*0.8 + vWP.z*0.6, vWP.y*1.1 + vWP.z*0.3); float dn = vnoise(dp*1.3)*0.55 + vnoise(dp*4.5)*0.3 + vnoise(dp*14.0)*0.15; diffuseColor.rgb *= 0.35 + 1.25*dn * (0.75 + 0.5*vnoise(dp*40.0));');
    if (o.caust !== false) {
      f = f.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        'vec3 wn = inverseTransformDirection( normal, viewMatrix );\n outgoingLight += diffuseColor.rgb * caust(vWP, uTime) * uCaust * max(wn.y, 0.0) * vec3(0.9, 1.0, 0.85);\n gl_FragColor = vec4( outgoingLight, diffuseColor.a );');
    }
    sh.fragmentShader = fs + f;
  };
  return mat;
}

/* The colour, fog and light for a given depth (in metres). */
const envColor = new THREE.Color(), envAbs = new THREE.Vector3();
function envAt(D) {
  let i = 0;
  while (i < ENV.length - 2 && D > ENV[i + 1].d) i++;
  const a = ENV[i], b = ENV[i + 1], u = clamp((D - a.d) / (b.d - a.d));
  envColor.copy(col(a.fog)).lerp(col(b.fog), u);
  envAbs.set(lerp(a.abs[0], b.abs[0], u), lerp(a.abs[1], b.abs[1], u), lerp(a.abs[2], b.abs[2], u));
}

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
    uniforms: { uCam: { value: new THREE.Vector3() }, uTime: U.time, uSize: { value: size }, uAlpha: { value: 0.6 }, uAbs: U.absorb, uPix: { value: pixelRatio } },
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

/* Applies the depth to everything: fog, light, sky. */
const state = { D: 0, stage: 0, t: 0, playing: false, started: false };
let FRAME_DT = 0.016;   // seconds since the last picture
function applyEnvironment(D) {
  envAt(D);
  scene.fog.color.copy(envColor);
  U.absorb.value.copy(envAbs);
  const light = Math.exp(-D / 32), day = clamp(1 - D / 160);
  sun.intensity = 3.4 * light; hemi.intensity = 0.55 + 0.6 * Math.exp(-D / 130);
  hemi.color.copy(envColor).multiplyScalar(1.5).lerp(new THREE.Color(1, 1, 1), 0.3 * day).add(new THREE.Color(0.02, 0.05, 0.09).multiplyScalar(1 - day)); hemi.groundColor.copy(envColor).multiplyScalar(0.35);
  torch.intensity = clamp((D - 18) / 70) * 24;
  U.caust.value = clamp(1 - D / 45) * 1.0;
  domeUniforms.uUp.value.copy(envColor).multiplyScalar(1.15 + 0.6 * day);
  domeUniforms.uDown.value.copy(envColor).multiplyScalar(0.42);
  domeUniforms.uGlow.value = day;
  surfaceUniforms.uFogCol.value.copy(envColor); surfaceUniforms.uDay.value = clamp(1 - D / 120);
  surface.visible = D < 140;
  rayUniforms.uI.value = clamp(1 - D / 260);
  rayGroup.visible = D < 260;
  glowSpecks.material.uniforms.uAlpha.value = clamp((D - 120) / 500) * 0.9;
  snow.material.uniforms.uAlpha.value = 0.5 * (0.25 + 0.75 * clamp(1 - D / 400));
}

/* =====================================================================
   4. BUILDING TOOLS: shapes for animals, corals and rocks
   ===================================================================== */
// Reads rows like [t, a, b, c] and blends smoothly between them.
function tab(rows, t) {
  for (let i = 1; i < rows.length; i++) {
    if (t <= rows[i][0]) {
      const p = rows[i - 1], q = rows[i], e = smooth((t - p[0]) / ((q[0] - p[0]) || 1));
      return p.slice(1).map((v, k) => lerp(v, q[k + 1], e));
    }
  }
  return rows[rows.length - 1].slice(1);
}

// Joins many shapes into one, so the computer draws them in one go.
function mergeGeo(list) {
  const geos = list.map(g => (g.index ? g.toNonIndexed() : g));
  let n = 0; geos.forEach(g => { n += g.attributes.position.count; });
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), colr = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  geos.forEach(g => {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) colr.set(g.attributes.color.array, o * 3); else colr.fill(1, o * 3, (o + c) * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    o += c;
  });
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.BufferAttribute(pos, 3)); r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  r.setAttribute('color', new THREE.BufferAttribute(colr, 3)); r.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return r;
}
// Colours every point of a shape using fn(position, normal) -> hex or Color.
function paintGeo(g, fn) {
  const p = g.attributes.position, n = g.attributes.normal, c = new Float32Array(p.count * 3), a = new THREE.Vector3(), b = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    a.fromBufferAttribute(p, i); b.fromBufferAttribute(n, i);
    const v = fn(a, b), k = v.isColor ? v : col(v);
    c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g;
}
function place(g, x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
  g.applyMatrix4(m); return g;
}
// A flat fin or flipper from a list of [x, y] points.
function flat(pts, scale = 1) {
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(p => new THREE.Vector2(p[0] * scale, p[1] * scale))), 6);
  g.computeVertexNormals(); return g;
}
// A body built from rings. Nose at +x, tail at -x.
// rows: [t, halfWidth, heightTop, heightBottom, centreY], all as a fraction of the length L.
function loft(L, rows, rings = 44, radial = 22) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, s = tab(rows, t);
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU, c = Math.cos(a), sn = Math.sin(a);
      pos.push((0.5 - t) * L, (s[3] + (sn > 0 ? s[1] : s[2]) * sn) * L, Math.max(s[0], 0.0005) * c * L);
      uv.push(t, j / radial);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
function sphereAt(r, x, y, z, seg = 10) { return place(new THREE.SphereGeometry(r, seg, seg - 2), x, y, z); }

// Small pictures made in code: used as skins.
function canvasTexture(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (srgb) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
}
