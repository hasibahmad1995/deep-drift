
/* =====================================================================
   6. THE PLACES: reef wall, open water, midnight, vents, wreck, trench
   Each place is built once and sits far from the others in space, so
   the dive simply moves the camera from one to the next.
   ===================================================================== */
const hash2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const vnoise2 = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), sx), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), sx), sy);
};
const fbm2 = (x, y, o = 4) => { let a = 0, f = 1, w = 0.5; for (let i = 0; i < o; i++) { a += vnoise2(x * f, y * f) * w; f *= 2; w *= 0.5; } return a; };
const UP = new THREE.Vector3(0, 1, 0);
const STAGE_ORIGIN = i => new THREE.Vector3(0, 0, i * 3000);
const wg = (i) => { const g = new THREE.Group(); g.position.copy(STAGE_ORIGIN(i)); scene.add(g); return g; };
const ACTORS = [];     // everything that moves by itself: { obj, update(t), name, range }

/* ---- coral shapes (each is one merged shape, so thousands cost little) ---- */
function branchGeo(seed, depth = 3) {
  const R = seeded(seed), parts = [];
  const grow = (m, len, r, d) => {
    const g = new THREE.CylinderGeometry(r * 0.7, r, len, 6, 1, true); g.translate(0, len / 2, 0); g.applyMatrix4(m); parts.push(g);
    if (d > 0) {
      const base = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, len, 0)), n = 2 + (R() < 0.6 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const rot = new THREE.Matrix4().makeRotationY(R() * TAU).multiply(new THREE.Matrix4().makeRotationX(0.5 + R() * 0.45));
        grow(base.clone().multiply(rot), len * 0.74, r * 0.72, d - 1);
      }
    }
  };
  grow(new THREE.Matrix4(), 0.36, 0.075, depth);
  const g = mergeGeo(parts); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#8b8b8b', '#ffffff', clamp(p.y / 1.0)));
}
function brainGeo() {
  const g = new THREE.SphereGeometry(1, 34, 20, 0, TAU, 0, Math.PI / 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), d = 1 + 0.05 * Math.sin(x * 22 + Math.sin(y * 11 + z * 7) * 2.2) + 0.03 * Math.sin(z * 19 + Math.sin(x * 9) * 2);
    p.setXYZ(i, x * d, y * d * 0.72, z * d);
  }
  g.computeVertexNormals();
  return paintGeo(g, p => mixc('#8a8a8a', '#ffffff', clamp((Math.sin(p.x * 22 + Math.sin(p.y * 11 + p.z * 7) * 2.2) + 1) / 2 * 0.8 + 0.2)));
}
function tableGeo() {
  const plate = new THREE.CylinderGeometry(1.25, 1.0, 0.1, 30, 2), p = plate.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); p.setY(i, p.getY(i) + Math.sin(Math.atan2(z, x) * 7) * 0.05 * r + (r > 1 ? -0.07 : 0)); }
  plate.translate(0, 0.55, 0); const stalk = new THREE.CylinderGeometry(0.12, 0.22, 0.55, 10); stalk.translate(0, 0.27, 0);
  plate.computeVertexNormals();
  return paintGeo(mergeGeo([plate, stalk]), (p, n) => mixc('#8a8a8a', '#ffffff', clamp(0.5 + n.y * 0.5)));
}
function fanGeo() {
  const g = new THREE.PlaneGeometry(1.5, 1.7, 10, 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, 0.18 * Math.sin(p.getX(i) * 2.2) + 0.06 * Math.sin(p.getY(i) * 5));
  g.translate(0, 0.95, 0); g.computeVertexNormals(); return g;
}
function softGeo() {
  const R = seeded(77), parts = [];
  for (let i = 0; i < 46; i++) {
    const a = R() * TAU, h = R() * 0.85, rr = Math.sqrt(R()) * 0.32 * (0.4 + h);
    parts.push(sphereAt(0.05 + R() * 0.05, Math.cos(a) * rr, 0.1 + h, Math.sin(a) * rr, 6));
  }
  const g = mergeGeo(parts); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#a0a0a0', '#ffffff', clamp(p.y)));
}
function spongeGeo() {
  const parts = [], R = seeded(31);
  for (let i = 0; i < 4; i++) {
    const h = 0.5 + R() * 0.7, g = new THREE.CylinderGeometry(0.15, 0.2, h, 14, 1, true); g.translate((R() - 0.5) * 0.55, h / 2, (R() - 0.5) * 0.55); parts.push(g);
  }
  const g = mergeGeo(parts); g.computeVertexNormals();
  return paintGeo(g, (p, n) => mixc('#909090', '#ffffff', clamp(p.y / 1.1)));
}
function anemoneGeo() {
  const parts = [], R = seeded(41);
  for (let i = 0; i < 60; i++) {
    const g = new THREE.CylinderGeometry(0.004, 0.022, 0.5, 5); g.translate(0, 0.25, 0);
    parts.push(place(g, (R() - 0.5) * 0.14, 0, (R() - 0.5) * 0.14, (R() - 0.5) * 1.6, R() * TAU, (R() - 0.5) * 1.6));
  }
  const g = mergeGeo(parts); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#b0b0b0', '#ffffff', clamp(p.y / 0.5)));
}
const fanTexture = canvasTexture(256, 256, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineCap = 'round';
  for (let i = 0; i < 30; i++) { c.lineWidth = 2.5; c.beginPath(); c.moveTo(w / 2, h); c.lineTo(w * (0.05 + i / 29 * 0.9), 0); c.stroke(); }
  c.lineWidth = 1.6; for (let k = 1; k < 12; k++) { c.beginPath(); c.moveTo(0, h * k / 12); c.bezierCurveTo(w * 0.3, h * k / 12 - 6, w * 0.7, h * k / 12 + 6, w, h * k / 12); c.stroke(); }
});

const CORAL_SETS = [
  { geo: () => branchGeo(5), n: 800, cols: ['#d0668f', '#e9a23b', '#8a63b4', '#e88a55', '#c9d18a', '#d05a4a'], s: [1.3, 3.0], rough: 0.7 },
  { geo: () => brainGeo(), n: 420, cols: ['#a7b06a', '#c9a86b', '#8fa8a0', '#c98a6a'], s: [0.5, 1.6], rough: 0.6 },
  { geo: () => tableGeo(), n: 140, cols: ['#c9b28a', '#a9b88a', '#d9a066'], s: [0.9, 2.2], rough: 0.7 },
  { geo: () => fanGeo(), n: 300, cols: ['#c23b57', '#b84fa0', '#e07a30', '#8a4fc2'], s: [1.2, 2.6], rough: 0.8, fan: true },
  { geo: () => softGeo(), n: 350, cols: ['#e0507a', '#f07a5a', '#d84a4a', '#e8a0b8'], s: [1.0, 2.5], rough: 0.5 },
  { geo: () => spongeGeo(), n: 200, cols: ['#e0b13a', '#c9862e', '#a8523a', '#8a63b4'], s: [1.2, 2.6], rough: 0.6 },
  { geo: () => branchGeo(9, 2), n: 1800, cols: ['#d0668f', '#e9a23b', '#8a63b4', '#e88a55', '#7fb59a', '#d05a4a'], s: [0.45, 1.0], rough: 0.7 },
  { geo: () => softGeo(), n: 700, cols: ['#e0507a', '#f07a5a', '#d84a4a', '#e8a0b8', '#e8c04a'], s: [0.45, 0.9], rough: 0.5 },
  { geo: () => anemoneGeo(), n: 140, cols: ['#e28fb0', '#f0a86a', '#d8d6a0'], s: [1.0, 2.0], rough: 0.5 }
];

// Puts many copies of each coral on the reef surface.
function scatterCorals(group, surf) {
  const R = seeded(123), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), nrm = new THREE.Vector3();
  CORAL_SETS.forEach(set => {
    const n = Math.max(6, Math.round(set.n * DETAIL));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: !set.fan, roughness: set.rough, side: THREE.DoubleSide, map: set.fan ? fanTexture : null, alphaTest: set.fan ? 0.5 : 0 });
    wet(mat, { detail: false });
    const mesh = new THREE.InstancedMesh(set.geo(), mat, n);
    for (let i = 0; i < n; i++) {
      const v = surf.candidates[Math.floor(R() * surf.candidates.length)];
      p.set(surf.pos[v * 3], surf.pos[v * 3 + 1], surf.pos[v * 3 + 2]);
      nrm.set(surf.nor[v * 3], surf.nor[v * 3 + 1], surf.nor[v * 3 + 2]).lerp(UP, 0.35).normalize();
      q.setFromUnitVectors(UP, nrm); q2.setFromAxisAngle(UP, R() * TAU); q.multiply(q2);
      s.setScalar(lerp(set.s[0], set.s[1], R()) * (0.8 + surf.size[v] * 0.6));
      p.addScaledVector(nrm, -0.05);
      m.compose(p, q, s); mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, col(set.cols[Math.floor(R() * set.cols.length)]).multiplyScalar(0.55 + R() * 0.3));
    }
    mesh.frustumCulled = false; group.add(mesh);
  });
}

/* ---- the reef wall: a shallow shelf that drops off into deep water ---- */
function buildReef() {
  const G = wg(0), R = seeded(2);
  const prof = [[110, -9], [48, -9], [32, -9.4], [28, -11], [26.4, -16], [26, -28], [26.5, -45], [27.5, -62], [29.5, -90], [33, -130], [38, -190]];
  const pts = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const [x0, y0] = prof[i], [x1, y1] = prof[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (y0 > -70 ? 0.9 : 2.5)));
    for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  pts.push(prof[prof.length - 1]);
  const NZ = 130, ZR = 65, pos = [], colr = [], idx = [], cand = [], sizes = [];
  const wallMax = new Float32Array(100 * 66).fill(-1e9), shelfTop = new Float32Array(60 * 66).fill(-1e9);   // where the rock is, so the diver cannot swim into it
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = ty, ny = -tx;
    for (let k = 0; k <= NZ; k++) {
      const z = -ZR + (2 * ZR) * k / NZ, [x, y] = pts[i];
      let d;
      if (ny > 0.7) d = (fbm2(x * 0.09 + 5, z * 0.09) - 0.45) * 2.4 + (fbm2(x * 0.6, z * 0.6) - 0.5) * 0.5 + Math.max(0, fbm2(z * 0.05 + 3, x * 0.05) - 0.56) * 22;   // shelf with coral heads
      else d = (fbm2(z * 0.11, y * 0.11) - 0.5) * 4 + Math.sin(z * 0.09 + y * 0.04) * 1.6 + (fbm2(z * 0.5 + 3, y * 0.5) - 0.5) * 2.2 + Math.max(0, Math.sin(y * 0.9 + fbm2(z * 0.2, y * 0.1) * 6)) * 0.5;                                    // rugged wall
      pos.push(-(x + nx * d), y + ny * d, z);
      { const X = -(x + nx * d), Y = y + ny * d, iz = Math.min(65, Math.max(0, Math.floor((z + 65) / 2)));
        if (ny > 0.7) { const bx = Math.floor(-X / 2); if (bx >= 0 && bx < 60) shelfTop[bx * 66 + iz] = Math.max(shelfTop[bx * 66 + iz], Y); }
        else { const by = Math.floor(-Y / 2); if (by >= 0 && by < 100) wallMax[by * 66 + iz] = Math.max(wallMax[by * 66 + iz], X); } }
      const crev = clamp(0.5 + d * 0.22), sand = ny > 0.7 ? 1 : 0, alg = fbm2(x * 0.3 + z * 0.2, y * 0.3 + z * 0.1);
      let c;
      if (sand) c = mixc('#d5c8a4', '#b9aa86', fbm2(x * 0.4, z * 0.4));
      else {
        c = mixc('#4a4036', alg > 0.5 ? '#3f4f2c' : '#6a5a48', clamp(alg));
        const b = fbm2(z * 0.22 + 7, y * 0.22 + 3);
        if (b > 0.52) c = c.clone().lerp(col(['#c9578c', '#d9a03a', '#7d5ba6', '#4fae9e', '#c46a3a', '#8fa85a'][Math.floor(fbm2(z * 0.05, y * 0.05 + 9) * 6) % 6]), clamp((b - 0.52) * 7) * 0.75);
      }
      c = c.clone().multiplyScalar(0.5 + 0.7 * crev);
      if (y < -60) c = c.clone().lerp(col('#26231f'), clamp((-y - 60) / 90));
      colr.push(c.r, c.g, c.b);
      if ((y > -58 && y < -8.5 && Math.abs(z) < 60) || (sand && x > 26 && x < 75 && Math.abs(z) < 60)) { cand.push(i * (NZ + 1) + k); }
      sizes.push(fbm2(x * 0.2, z * 0.2 + y * 0.2));
    }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < NZ; k++) {
    const a = i * (NZ + 1) + k, b = a + NZ + 1; idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true }));
  G.add(terrain);
  G.userData.bins = { wallMax, shelfTop };
  scatterCorals(G, { pos: g.attributes.position.array, nor: g.attributes.normal.array, candidates: cand, size: sizes });
  return G;
}


/* ---- a dive boat, seen from below at the start ---- */
function buildBoat() {
  const G = new THREE.Group(), O = STAGE_ORIGIN(0);
  const hull = loft(9, [[0, 0.002, 0.002, 0.03, 0], [0.08, 0.07, 0.002, 0.055, 0], [0.25, 0.15, 0.002, 0.085, 0], [0.7, 0.16, 0.002, 0.09, 0], [0.95, 0.11, 0.002, 0.06, 0], [1, 0.09, 0.002, 0.05, 0]], 30, 20);
  paintGeo(hull, p => (p.y < -0.28 ? '#1d3a63' : '#e9eef0'));
  const motor = new THREE.BoxGeometry(0.4, 0.9, 0.3); motor.translate(-4.6, -0.5, 0); paintGeo(motor, () => '#2a2d31');
  const prop = new THREE.CylinderGeometry(0.22, 0.22, 0.06, 12); prop.rotateZ(Math.PI / 2); prop.translate(-4.85, -0.95, 0); paintGeo(prop, () => '#8b939a');
  const mesh = new THREE.Mesh(mergeGeo([hull, motor, prop]), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }), { caust: false }));
  mesh.rotation.y = Math.PI; G.add(mesh);
  const a = new THREE.Vector3(-4.5, -0.3, 0), b = new THREE.Vector3(-30, -9, 2), len = a.distanceTo(b);
  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, len, 6), wet(new THREE.MeshStandardMaterial({ color: col('#8a7f68'), roughness: 0.9 }), {}));
  rope.position.copy(a).add(b).multiplyScalar(0.5); rope.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize()); G.add(rope);
  const anchor = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.5), wet(new THREE.MeshStandardMaterial({ color: col('#3a3d40'), roughness: 0.6 }), {})); anchor.position.copy(b).add(new THREE.Vector3(0, 0.1, 0)); G.add(anchor);
  G.position.set(O.x - 14, 0, O.z - 6.5); scene.add(G); return G;
}

/* ---- a simple rocky floor, used for the vents, the wreck and the trench ---- */
function makeFloor(size, seg, heightFn, colorFn) {
  const g = new THREE.PlaneGeometry(size, size, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), h = heightFn(x, z); p.setY(i, h);
    const k = colorFn(x, z, h); c[i * 3] = k.r; c[i * 3 + 1] = k.g; c[i * 3 + 2] = k.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3)); g.computeVertexNormals();
  return new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), { detail: true, caust: false }));
}
function scatterRocks(group, n, area, hFn, tone) {
  const R = seeded(19), geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.8 + hash2(p.getX(i) * 9, p.getY(i) * 9 + p.getZ(i) * 5) * 0.45; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geo, wet(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), { detail: true, caust: false }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const x = (R() - 0.5) * area, z = (R() - 0.5) * area, sc = 0.3 + Math.pow(R(), 3) * 3.2;
    pp.set(x, hFn(x, z) + sc * 0.2, z); q.setFromEuler(new THREE.Euler(R() * 3, R() * 3, R() * 3)); s.set(sc * (0.8 + R() * 0.6), sc * 0.7, sc * (0.8 + R() * 0.6));
    m.compose(pp, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col(tone).multiplyScalar(0.7 + R() * 0.6));
  }
  mesh.frustumCulled = false; group.add(mesh);
}

/* ---- smoke rising from a hot vent ---- */
function makeSmoke(x, y, z) {
  const n = 40, pos = new Float32Array(n * 3), sd = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos.set([x, y, z], i * 3); sd[i] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uAbs: U.absorb, uPix: { value: pixelRatio } }, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute float aSeed; uniform float uTime; uniform float uPix; varying float vA; varying float vD;
      void main(){ float k = fract(uTime * 0.07 + aSeed); vec3 p = position + vec3(sin(k * 6.0 + aSeed * 20.0) * 1.2 * k, k * 22.0, cos(k * 5.0 + aSeed * 30.0) * 1.2 * k);
        vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.0); vA = (1.0 - k) * smoothstep(0.0, 0.08, k); vD = -mv.z; gl_Position = projectionMatrix * mv; gl_PointSize = (30.0 + k * 150.0) * uPix * (12.0 / max(-mv.z, 2.0)); }`,
    fragmentShader: `uniform vec3 uAbs; varying float vA; varying float vD; void main(){ vec2 c = gl_PointCoord - 0.5; float r = length(c); if (r > 0.5) discard;
        gl_FragColor = vec4(vec3(0.05, 0.05, 0.06), smoothstep(0.5, 0.1, r) * vA * 0.5 * exp(-uAbs.b * vD * 0.5));
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 6; return p;
}
function glowSprite(size, color) {
  const tex = canvasTexture(64, 64, (c) => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: color, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true }));
  s.scale.set(size, size, 1); return s;
}

/* ---- hydrothermal vents ---- */
const VENT_FLOOR_Y = -400;
function buildVents() {
  const G = wg(3), floorH = (x, z) => VENT_FLOOR_Y + (fbm2(x * 0.03, z * 0.03) - 0.4) * 9 + fbm2(x * 0.2, z * 0.2) * 0.7;
  const vents = [[18, -9], [32, 12], [8, 14], [44, -14], [-6, -12]];
  const floorC = (x, z, h) => {
    let near = 0; vents.forEach(v => { near = Math.max(near, clamp(1 - Math.hypot(x - v[0], z - v[1]) / 14)); });
    return mixc('#2b2723', '#463526', fbm2(x * 0.1, z * 0.1)).lerp(col('#b8a48a'), near * near * 0.6);
  };
  G.add(makeFloor(320, 150, floorH, floorC));
  scatterRocks(G, 260, 260, floorH, '#3a342e');
  vents.forEach((v, i) => {
    const h = 5 + (i % 3) * 3, prof = [];
    for (let k = 0; k <= 14; k++) { const u = k / 14; prof.push(new THREE.Vector2((lerp(2.2, 0.55, Math.pow(u, 0.7)) + (hash2(k, i) - 0.5) * 0.5) , u * h)); }
    const g = new THREE.LatheGeometry(prof, 18), p = g.attributes.position;
    for (let j = 0; j < p.count; j++) { const n = (fbm2(p.getX(j) * 1.3 + i * 5, p.getY(j) * 1.1 + p.getZ(j) * 1.3) - 0.5) * 0.9; p.setX(j, p.getX(j) + n); p.setZ(j, p.getZ(j) + n * 0.7); }
    g.computeVertexNormals(); paintGeo(g, (q) => mixc('#1c1815', '#5a3d2a', fbm2(q.x * 2 + i, q.y * 2)));
    const ch = new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), { detail: true, caust: false }));
    const fy = floorH(v[0], v[1]); ch.position.set(v[0], fy - 0.3, v[1]); G.add(ch);
    const gl = glowSprite(9, 0xff7a2a); gl.position.set(v[0], fy + h + 0.5, v[1]); G.add(gl);
    const gl2 = glowSprite(24, 0xff5a10); gl2.material.opacity = 0.35; gl2.position.copy(gl.position); G.add(gl2);
    G.add(makeSmoke(v[0], fy + h, v[1]));
  });
  // tube worms
  const tube = new THREE.CylinderGeometry(0.05, 0.065, 1.5, 8, 1, true); tube.translate(0, 0.75, 0);
  const plume = new THREE.ConeGeometry(0.11, 0.42, 10); plume.translate(0, 1.7, 0);
  paintGeo(tube, () => '#efeadf'); paintGeo(plume, (p) => mixc('#9c1420', '#f0404f', clamp((p.y - 1.5) / 0.4)));
  const tg = mergeGeo([tube, plume]);
  const N = Math.round(150 * DETAIL) + 20, tm = new THREE.InstancedMesh(tg, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: new THREE.Color(0.24, 0.17, 0.15), side: THREE.DoubleSide }), { caust: false, bend: { mode: 4, amp: 0.05, speed: 1.2, wave: 0, len: 1.6 } }), N);
  const R = seeded(11), m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3(), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const v = vents[Math.floor(R() * vents.length)], a = R() * TAU, r = 1.2 + R() * 4.5, x = v[0] + Math.cos(a) * r, z = v[1] + Math.sin(a) * r;
    pp.set(x, floorH(x, z) - 0.05, z); q.setFromEuler(new THREE.Euler((R() - 0.5) * 0.35, R() * TAU, (R() - 0.5) * 0.35)); s.setScalar(0.6 + R() * 1.0);
    m.compose(pp, q, s); tm.setMatrixAt(i, m); ph[i] = R() * TAU;
  }
  tg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1)); tm.frustumCulled = false; G.add(tm);
  G.userData.floorH = floorH; G.userData.vents = vents; G.userData.ventH = vents.map((v, i) => 5 + (i % 3) * 3);
  return G;
}

/* ---- the shipwreck (an imagined ship) ---- */
const WRECK_FLOOR_Y = -560;
function buildWreck() {
  const G = wg(4), floorH = (x, z) => WRECK_FLOOR_Y + (fbm2(x * 0.02, z * 0.02) - 0.4) * 6 + fbm2(x * 0.15, z * 0.15) * 0.4;
  G.add(makeFloor(320, 130, floorH, (x, z) => mixc('#3a3d40', '#2a2a2b', fbm2(x * 0.1, z * 0.1))));
  scatterRocks(G, 120, 220, floorH, '#3d3f42');
  const ship = new THREE.Group();
  const rows = [[0, 0.002, 0.02, 0.02, 0], [0.04, 0.06, 0.05, 0.11, 0], [0.15, 0.11, 0.05, 0.14, 0], [0.5, 0.13, 0.05, 0.15, 0], [0.85, 0.11, 0.05, 0.13, 0], [1, 0.07, 0.05, 0.08, 0]];
  const hull = loft(44, rows, 60, 24); hull.computeVertexNormals();
  paintGeo(hull, p => mixc('#3b2a20', '#8a552e', fbm2(p.x * 0.35, p.y * 0.35 + p.z * 0.3)).lerp(col('#2a3a32'), clamp(fbm2(p.z * 0.4, p.x * 0.2) - 0.55) * 1.6));
  const parts = [hull];
  const box = (w, h, d, x, y, z, c) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); g.computeVertexNormals(); return paintGeo(g, () => c); };
  parts.push(box(9, 3.2, 8, -4, 5.2, 0, '#5a4636'), box(6, 2.4, 6, -5, 7.8, 0, '#4d3d30'));
  const fun = new THREE.CylinderGeometry(1.1, 1.4, 6.5, 16); fun.translate(-11, 8, 0); fun.rotateZ(0.0); paintGeo(fun, () => '#4a3b30'); parts.push(fun);
  const mast = new THREE.CylinderGeometry(0.22, 0.32, 15, 8); mast.translate(9, 11, 0); mast.rotateZ(0.25); paintGeo(mast, () => '#3d3128'); parts.push(mast);
  const mast2 = new THREE.CylinderGeometry(0.16, 0.24, 9, 8); mast2.translate(-18, 9, 0); mast2.rotateZ(-0.5); paintGeo(mast2, () => '#3d3128'); parts.push(mast2);
  for (let k = 0; k < 9; k++) { const g = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 12); g.rotateX(Math.PI / 2); g.translate(-14 + k * 3.2, 1.4, 6.9 + 0.001); paintGeo(g, () => '#0a0d0f'); parts.push(g); }
  const shipMesh = new THREE.Mesh(mergeGeo(parts), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, side: THREE.DoubleSide }), { detail: true, caust: false }));
  ship.add(shipMesh); ship.position.set(0, floorH(0, 0) + 4.5, 0); ship.rotation.set(0.42, 0.5, 0.06); G.add(ship); G.userData.ship = ship;

  // a whale skeleton on the sea floor (a "whale fall")
  {
    const parts = [];
    for (let i = 0; i < 30; i++) { const r = 0.26 * (1 - i / 60) + 0.06, g = new THREE.CylinderGeometry(r, r * 1.05, 0.55, 10); g.rotateZ(Math.PI / 2); g.translate(i * 0.7, 0.5, Math.sin(i * 0.18) * 0.5); parts.push(g); }
    for (let i = 3; i < 19; i++) { const rr = 0.5 + 1.4 * Math.sin((i - 3) / 16 * Math.PI) + 0.2, g = new THREE.TorusGeometry(rr, 0.075, 6, 16, Math.PI); g.rotateY(Math.PI / 2); g.scale(1, 0.8, 1); g.translate(i * 0.7, 0.5, Math.sin(i * 0.18) * 0.5); parts.push(g); }
    const skull = new THREE.SphereGeometry(1, 16, 12); skull.scale(2.6, 0.9, 1.1); skull.translate(-2.6, 0.6, 0); parts.push(skull);
    const jaw = new THREE.BoxGeometry(4.2, 0.2, 0.35); jaw.translate(-4.2, 0.1, 0.5); parts.push(jaw);
    const bg = mergeGeo(parts); paintGeo(bg, p => mixc('#b3ab95', '#e6dfcc', fbm2(p.x * 2, p.z * 2)));
    const bones = new THREE.Mesh(bg, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }), { detail: true, caust: false }));
    const bx = Math.cos(-0.8) * 31, bz = Math.sin(-0.8) * 31;
    bones.position.set(bx - 8, floorH(bx, bz) + 0.2, bz + 6); bones.rotation.y = 0.55; G.add(bones); G.userData.bones = bones;
  }
  G.userData.floorH = floorH; return G;
}

/* ---- the deep trench: two rock walls and a floor ---- */
const TRENCH_TOP_Y = -1200;
function buildTrench() {
  const G = wg(5), R = seeded(8);
  const wallGeo = (side) => {
    const NY = 80, NZ = 100, pos = [], colr = [], idx = [];
    for (let i = 0; i <= NY; i++) for (let k = 0; k <= NZ; k++) {
      const y = TRENCH_TOP_Y - 150 + i * 4.2, z = -150 + k * 3, d = (fbm2(z * 0.07 + side * 9, y * 0.07) - 0.5) * 11 + Math.sin(y * 0.05 + z * 0.06) * 3;
      pos.push(side * (15 + d * 0.7 + (i < 6 ? (6 - i) * 2 : 0)), y, z);
      const c = mixc('#2a2622', '#4a4038', fbm2(z * 0.2, y * 0.2)); colr.push(c.r, c.g, c.b);
    }
    for (let i = 0; i < NY; i++) for (let k = 0; k < NZ; k++) { const a = i * (NZ + 1) + k, b = a + NZ + 1; if (side > 0) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true, caust: false }));
  };
  G.add(wallGeo(1), wallGeo(-1));
  const floorY = TRENCH_TOP_Y - 150 + 0;
  const floorH = (x, z) => floorY + (fbm2(x * 0.05, z * 0.05) - 0.4) * 5;
  const fl = makeFloor(300, 110, floorH, (x, z) => mixc('#3a342c', '#28241f', fbm2(x * 0.15, z * 0.15))); G.add(fl);
  scatterRocks(G, 80, 60, floorH, '#2f2b27');
  G.userData.floorY = floorY; return G;
}
