
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
    parts.push(sphereAt(0.05 + R() * 0.05, Math.cos(a) * rr, 0.1 + h, Math.sin(a) * rr, 5));   // small, so a simple ball is enough
  }
  const g = mergeGeo(parts); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#a0a0a0', '#ffffff', clamp(p.y)));
}
// Tube sponges: a clump of lumpy tubes with open, darker mouths.
function spongeGeo() {
  const parts = [], R = seeded(31);
  for (let i = 0; i < 4; i++) {
    const h = 0.45 + R() * 0.75, r = 0.09 + R() * 0.05, prof = [];
    for (let k = 0; k <= 5; k++) { const u = k / 5; prof.push(new THREE.Vector2(r * (1.25 - 0.3 * u) + 0.012 * Math.sin(u * 11 + i), u * h)); }
    prof.push(new THREE.Vector2(r * 1.02, h + 0.02));                                   // the lip
    for (let k = 5; k >= 3; k--) { const u = k / 5; prof.push(new THREE.Vector2(r * (0.8 - 0.25 * u), u * h)); }   // inside the tube
    const g = new THREE.LatheGeometry(prof, 9), lean = (R() - 0.5) * 0.5;
    g.computeVertexNormals();
    paintGeo(g, p => mixc('#6a6a6a', '#ffffff', clamp(0.35 + p.y * 0.5)).multiplyScalar(Math.hypot(p.x, p.z) < r * 0.9 ? 0.35 : 1));   // dark inside
    g.rotateZ(lean); g.translate((R() - 0.5) * 0.45, 0, (R() - 0.5) * 0.45); parts.push(g);
  }
  return mergeGeo(parts);   // keeps the smooth normals of each tube
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

// A vase (barrel) sponge: a thick open cup, common on reef walls.
function vaseGeo() {
  const prof = [];
  for (let k = 0; k <= 7; k++) { const u = k / 7; prof.push(new THREE.Vector2(0.18 + 0.32 * Math.pow(u, 0.8) + 0.02 * Math.sin(u * 20), u * 1.1)); }
  for (let k = 7; k >= 3; k--) { const u = k / 7; prof.push(new THREE.Vector2(0.1 + 0.3 * Math.pow(u, 0.8), u * 1.1 - 0.02)); }   // inside wall of the cup
  const g = new THREE.LatheGeometry(prof, 16), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), y = p.getY(i), k = 1 + 0.06 * Math.sin(Math.atan2(z, x) * 8) * clamp(y); p.setX(i, x * k); p.setZ(i, z * k); }
  g.computeVertexNormals();
  return paintGeo(g, (q, n) => mixc('#7a7a7a', '#ffffff', clamp(0.35 + q.y * 0.5 + (Math.hypot(q.x, q.z) < 0.1 + 0.3 * q.y ? -0.3 : 0))));
}
// Sea whips: a few long thin bendy rods.
function whipGeo() {
  const R = seeded(55), parts = [];
  for (let i = 0; i < 5; i++) {
    const a = R() * TAU, lean = 0.15 + R() * 0.3, h = 1.2 + R() * 1.2, pts = [];
    for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push(new THREE.Vector3(Math.cos(a) * lean * u * u * h + (R() - 0.5) * 0.04, u * h, Math.sin(a) * lean * u * u * h)); }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.018, 5));
  }
  const g = mergeGeo(parts); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#9a9a9a', '#ffffff', clamp(p.y / 2)));
}

// Corals and sponges that grow out from the steep wall (up = how much they turn to grow upward).
const WALL_SETS = [
  { geo: () => vaseGeo(), n: 90, cols: ['#b0527a', '#8a5bb0', '#c9862e', '#a8523a', '#7a6a9a'], s: [0.7, 1.8], rough: 0.8, up: 0.55 },
  { geo: () => spongeGeo(), n: 220, cols: ['#e0b13a', '#c9862e', '#a8523a', '#8a63b4', '#d2587a'], s: [0.6, 1.4], rough: 0.7, up: 0.5 },
  { geo: () => fanGeo(), n: 170, cols: ['#c23b57', '#b84fa0', '#e07a30', '#8a4fc2', '#d9d4c0'], s: [1.0, 2.4], rough: 0.8, fan: true, up: 0.2 },
  { geo: () => softGeo(), n: 150, cols: ['#e0507a', '#f07a5a', '#d84a4a', '#b05ac8', '#f0a04a'], s: [0.5, 1.3], rough: 0.5, up: 0.4 },
  { geo: () => tableGeo(), n: 70, cols: ['#c9b28a', '#a9b88a', '#8fa0c0'], s: [0.6, 1.4], rough: 0.7, up: 0.8 },
  { geo: () => branchGeo(13, 2), n: 380, cols: ['#d0668f', '#e9a23b', '#8a63b4', '#e88a55', '#7fb59a'], s: [0.35, 0.8], rough: 0.7, up: 0.45 },
  { geo: () => brainGeo(), n: 80, cols: ['#a7b06a', '#c9a86b', '#8fa8a0', '#c98a6a', '#b07a9a'], s: [0.3, 0.8], rough: 0.6, up: 0.0 },
  { geo: () => whipGeo(), n: 110, cols: ['#d9a03a', '#c2553a', '#e0d0b0'], s: [0.7, 1.3], rough: 0.6, up: 0.6 },
  { geo: () => anemoneGeo(), n: 90, cols: ['#e28fb0', '#f0a86a', '#d8d6a0'], s: [0.6, 1.2], rough: 0.5, up: 0.3 }
];

// Puts many copies of each coral on the reef surface. up = how much a coral turns to grow upward (default 0.35).
function scatterCorals(group, surf, sets = CORAL_SETS, upDefault = 0.35, seed = 123) {
  const R = seeded(seed), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), nrm = new THREE.Vector3();
  sets.forEach(set => {
    const n = Math.max(6, Math.round(set.n * DETAIL));
    const mat = new THREE.MeshStandardMaterial({ vertexColors: !set.fan, roughness: set.rough, side: THREE.DoubleSide, map: set.fan ? fanTexture : null, alphaTest: set.fan ? 0.5 : 0 });
    wet(mat, { detail: false });
    const mesh = new THREE.InstancedMesh(set.geo(), mat, n);
    for (let i = 0; i < n; i++) {
      const v = surf.candidates[Math.floor(R() * surf.candidates.length)];
      p.set(surf.pos[v * 3], surf.pos[v * 3 + 1], surf.pos[v * 3 + 2]);
      nrm.set(surf.nor[v * 3], surf.nor[v * 3 + 1], surf.nor[v * 3 + 2]).lerp(UP, set.up == null ? upDefault : set.up).normalize();
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
  const pts = [], step = SMALL ? 0.9 : 0.55;
  for (let i = 0; i < prof.length - 1; i++) {
    const [x0, y0] = prof[i], [x1, y1] = prof[i + 1], n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (y0 > -70 ? step : 2.5)));
    for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
  }
  pts.push(prof[prof.length - 1]);
  const NZ = SMALL ? 130 : 220, ZR = 65, pos = [], colr = [], idx = [], cand = [], wallCand = [], sizes = [];
  const ridged = (x, y) => 1 - Math.abs(fbm2(x, y, 3) * 2 - 1);   // sharp creases, for cracks in the rock
  const wallMax = new Float32Array(100 * 66).fill(-1e9), shelfTop = new Float32Array(60 * 66).fill(-1e9);   // where the rock is, so the diver cannot swim into it
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    const nx = ty, ny = -tx;
    for (let k = 0; k <= NZ; k++) {
      const z = -ZR + (2 * ZR) * k / NZ, [x, y] = pts[i];
      let d;
      if (ny > 0.7) d = (fbm2(x * 0.09 + 5, z * 0.09) - 0.45) * 2.4 + (fbm2(x * 0.6, z * 0.6) - 0.5) * 0.5 + Math.max(0, fbm2(z * 0.05 + 3, x * 0.05) - 0.56) * 22;   // shelf with coral heads
      else {   // rugged wall: bays and buttresses, ledges that come and go, vertical cracks, lumpy rock
        const yy = y + fbm2(z * 0.03, y * 0.02) * 6, per = 5.5, s = ((yy / per) % 1 + 1) % 1;
        const ledge = smooth(clamp((fbm2(z * 0.05 + 3, Math.floor(yy / per) * 1.7) - 0.45) / 0.17)) * 1.7 * smooth(clamp((s - 0.5) / 0.45));
        d = (fbm2(z * 0.11, y * 0.11) - 0.5) * 3.4 + Math.sin(z * 0.09 + y * 0.04) * 1.3 + ledge - 0.5
          - Math.pow(ridged(z * 0.18 + 7, y * 0.06), 6) * 1.8
          + (fbm2(z * 0.35 + 3, y * 0.35) - 0.5) * 2.0 + (fbm2(z * 1.1, y * 1.1) - 0.5) * 0.7;
      }
      pos.push(-(x + nx * d), y + ny * d, z);
      { const X = -(x + nx * d), Y = y + ny * d, iz = Math.min(65, Math.max(0, Math.floor((z + 65) / 2)));
        if (ny > 0.7) { const bx = Math.floor(-X / 2); if (bx >= 0 && bx < 60) shelfTop[bx * 66 + iz] = Math.max(shelfTop[bx * 66 + iz], Y); }
        else { const by = Math.floor(-Y / 2); if (by >= 0 && by < 100) wallMax[by * 66 + iz] = Math.max(wallMax[by * 66 + iz], X); } }
      const crev = clamp(0.5 + d * 0.22), sand = ny > 0.7 ? 1 : 0, alg = fbm2(x * 0.3 + z * 0.2, y * 0.3 + z * 0.1);
      let c;
      if (sand) c = mixc('#d5c8a4', '#b9aa86', fbm2(x * 0.4, z * 0.4));
      else {
        c = mixc('#4a4036', alg > 0.5 ? '#3f4f2c' : '#6a5a48', clamp(alg));
        // encrusting sponges, coralline algae and small corals cover much of a real reef wall
        const b = fbm2(z * 0.22 + 7, y * 0.22 + 3), pal = ['#c9578c', '#d9a03a', '#7d5ba6', '#4fae9e', '#c46a3a', '#8fa85a', '#b0678e', '#e07a5f', '#9a4f86'];
        if (b > 0.46) c = c.clone().lerp(col(pal[Math.floor(fbm2(z * 0.05, y * 0.05 + 9) * 9) % 9]), clamp((b - 0.46) * 6) * 0.85);
        const b2 = fbm2(z * 0.8 + 5, y * 0.8 + 1);
        if (b2 > 0.6) c = c.clone().lerp(col(['#b87aa0', '#d88a6a', '#c7b25a'][Math.floor(b * 30) % 3]), clamp((b2 - 0.6) * 8) * 0.7);
      }
      c = c.clone().multiplyScalar(0.5 + 0.7 * crev);
      if (y < -60) c = c.clone().lerp(col('#26231f'), clamp((-y - 60) / 90));
      colr.push(c.r, c.g, c.b);
      if ((y > -58 && y < -8.5 && Math.abs(z) < 60) || (sand && x > 26 && x < 75 && Math.abs(z) < 60)) { cand.push(i * (NZ + 1) + k); }
      if (!sand && y > -56 && y < -10 && Math.abs(z) < 55) wallCand.push(i * (NZ + 1) + k);
      sizes.push(fbm2(x * 0.2, z * 0.2 + y * 0.2));
    }
  }
  for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < NZ; k++) {
    const a = i * (NZ + 1) + k, b = a + NZ + 1; idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colr, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true, bump: 2.2 }));
  G.add(terrain);
  G.userData.bins = { wallMax, shelfTop };
  scatterCorals(G, { pos: g.attributes.position.array, nor: g.attributes.normal.array, candidates: cand, size: sizes });
  scatterCorals(G, { pos: g.attributes.position.array, nor: g.attributes.normal.array, candidates: wallCand, size: sizes }, WALL_SETS, 0.12, 321);
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
// Rocks on a floor. where(R) can return [x, z] to choose each spot; otherwise they spread over a square of size area.
function scatterRocks(group, n, area, hFn, tone, where) {
  const R = seeded(19 + n), geo = new THREE.IcosahedronGeometry(1, 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.78 + fbm2(p.getX(i) * 1.7 + p.getZ(i), p.getY(i) * 1.7 + 3, 3) * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geo, wet(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }), { detail: true, bump: 1.5, caust: false }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const [x, z] = where ? where(R) : [(R() - 0.5) * area, (R() - 0.5) * area], sc = 0.3 + Math.pow(R(), 3) * 3.2;
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
  // giant tube worms: white tubes up to 2 m long, packed in dense clumps, each with a feathery blood-red plume
  const tube = new THREE.CylinderGeometry(0.075, 0.095, 1.8, 10, 6, true), tp = tube.attributes.position;
  for (let i = 0; i < tp.count; i++) { const y = tp.getY(i), k = 1 + 0.08 * Math.sin(y * 9) + 0.04 * Math.sin(Math.atan2(tp.getZ(i), tp.getX(i)) * 3 + y * 4); tp.setX(i, tp.getX(i) * k); tp.setZ(i, tp.getZ(i) * k); }
  tube.translate(0, 0.9, 0); tube.computeVertexNormals();
  const prof = []; for (let k = 0; k <= 10; k++) { const u = k / 10; prof.push(new THREE.Vector2(0.075 + 0.05 * Math.sin(u * Math.PI * 0.9) + 0.012 * (k % 2), u * 0.6)); }
  const plume = new THREE.LatheGeometry(prof, 14), pl = plume.attributes.position;
  for (let i = 0; i < pl.count; i++) { const a = Math.atan2(pl.getZ(i), pl.getX(i)), k = 1 + 0.3 * Math.pow(Math.abs(Math.sin(a * 9)), 3); pl.setX(i, pl.getX(i) * k); pl.setZ(i, pl.getZ(i) * k); }   // feathery gill ridges
  plume.translate(0, 1.75, 0); plume.computeVertexNormals();
  paintGeo(tube, p => mixc('#cfc6b4', '#f4f0e6', clamp(p.y / 1.6))); paintGeo(plume, (p) => mixc('#8a0c16', '#ff3040', clamp((p.y - 1.75) / 0.5)));
  const tg = mergeGeo([tube, plume]);
  const clumps = [], R = seeded(11);
  vents.forEach(v => { const nc = 4 + Math.floor(R() * 3); for (let c = 0; c < nc; c++) { const a = R() * TAU, r = 2.2 + R() * 3.2; clumps.push([v[0] + Math.cos(a) * r, v[1] + Math.sin(a) * r]); } });
  const N = Math.round(clumps.length * 26 * Math.max(DETAIL, 0.5));
  const tm = new THREE.InstancedMesh(tg, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: new THREE.Color(0.1, 0.03, 0.03), side: THREE.DoubleSide }), { caust: false, bend: { mode: 4, amp: 0.05, speed: 1.2, wave: 0, len: 2.0 } }), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3(), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const c = clumps[i % clumps.length], a = R() * TAU, r = Math.sqrt(R()) * 0.75, x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r;
    // worms at the edge of a clump lean outward
    pp.set(x, floorH(x, z) - 0.08, z); q.setFromEuler(new THREE.Euler(Math.sin(a) * r * 0.35 + (R() - 0.5) * 0.15, R() * TAU, -Math.cos(a) * r * 0.35 + (R() - 0.5) * 0.15)); s.setScalar(0.6 + R() * 0.8);
    m.compose(pp, q, s); tm.setMatrixAt(i, m); ph[i] = R() * TAU;
  }
  tg.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1)); tm.frustumCulled = false; G.add(tm);
  G.userData.floorH = floorH; G.userData.vents = vents; G.userData.ventH = vents.map((v, i) => 5 + (i % 3) * 3);
  return G;
}

/* ---- the shipwreck: an imagined steel steamship, about 47 m long ----
   Built in ship space: x runs from the stern (-) to the bow (+), y is up, z is across (starboard is +). */
const SHIP_L2 = 23.5, SHIP_KEEL = -5.2;
const shipDeckY = x => 2.6 + 1.5 * Math.pow(clamp((x - 4) / 19.5), 2) + 0.6 * Math.pow(clamp((-x - 8) / 15.5), 2);   // the deck rises toward bow and stern
const shipBeam = x => 4.9 * (x > 6 ? Math.pow(Math.max(0, 1 - smooth(clamp((x - 6) / (SHIP_L2 - 6)))), 0.7) : 1 - 0.4 * smooth(clamp((-x - 10) / (SHIP_L2 - 10))));
const shipKeelY = x => x > 11 ? lerp(SHIP_KEEL, shipDeckY(SHIP_L2) - 0.4, Math.pow(clamp((x - 11) / (SHIP_L2 - 11)), 2.2))   // the raked bow
  : x < -15 ? lerp(SHIP_KEEL, -2.2, smooth(clamp((-x - 15) / (SHIP_L2 - 15)))) : SHIP_KEEL;
const shipFull = x => x > 6 ? lerp(4, 2.2, clamp((x - 6) / 14)) : x < -12 ? lerp(4, 2.8, clamp((-x - 12) / 11)) : 4;   // 4 = boxy middle, 2 = round ends
// A point on the hull. phi runs from -PI/2 (port deck edge) through 0 (keel) to PI/2 (starboard deck edge).
function hullPoint(x, phi) {
  const e = 2 / shipFull(x), s = Math.sin(phi), c = Math.cos(phi), B = shipBeam(x), k = shipKeelY(x), d = shipDeckY(x);
  return [x, k + (d - k) * (1 - Math.pow(Math.abs(c), e)), B * Math.sign(s) * Math.pow(Math.abs(s), e)];
}
const SHIP_HOLE = { x: -3, y: -0.5, rx: 2.9, ry: 1.8 };   // torn open on the port side
const inShipHole = (x, y, z) => z < -0.5 && Math.pow((x - SHIP_HOLE.x) / SHIP_HOLE.rx, 2) + Math.pow((y - SHIP_HOLE.y) / SHIP_HOLE.ry, 2) < 1 + 0.5 * (hash2(Math.round(x * 2.5), Math.round(y * 2.5)) - 0.5);
const DECKHOUSE = { x0: -6, x1: 5, hw: 3.3, h: 2.6 };

function buildShip() {
  const ship = new THREE.Group(), parts = [], dark = [], R = seeded(47);
  const NX = SMALL ? 70 : 120, NP = SMALL ? 28 : 44;
  const fromArrays = (pos, idx) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  const seam = (v, step, w) => { const f = ((v / step) % 1 + 1) % 1; return Math.min(f, 1 - f) * step < w; };
  const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };
  const rod = (a, b, r) => { const g = new THREE.CylinderGeometry(r, r, a.distanceTo(b), 6, 1, true); g.translate(0, a.distanceTo(b) / 2, 0);
    g.applyMatrix4(new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize()), new THREE.Vector3(1, 1, 1))); return g; };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // hull plating: black above the old waterline, faded red below, with plate seams
  {
    const pos = [], idx = [];
    for (let i = 0; i <= NX; i++) { const x = -SHIP_L2 + 2 * SHIP_L2 * i / NX; for (let j = 0; j <= NP; j++) pos.push(...hullPoint(x, -Math.PI / 2 + Math.PI * j / NP)); }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NP; j++) {
      const a = i * (NP + 1) + j, b = a + NP + 1;
      if (inShipHole((pos[a * 3] + pos[b * 3]) / 2, (pos[a * 3 + 1] + pos[a * 3 + 4]) / 2, (pos[a * 3 + 2] + pos[a * 3 + 5]) / 2)) continue;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const c0 = pos.length / 3; pos.push(-SHIP_L2, (shipKeelY(-SHIP_L2) + shipDeckY(-SHIP_L2)) / 2, 0);   // the flat stern
    for (let j = 0; j < NP; j++) idx.push(c0, j + 1, j);
    const g = fromArrays(pos, idx);
    paintGeo(g, p => {
      let c = p.y < -0.4 ? mixc('#4e2016', '#7a3a24', fbm2(p.x * 0.3, p.y * 0.6)) : mixc('#1e1c1b', '#3a302a', fbm2(p.x * 0.4, p.y * 0.5 + p.z));
      if (seam(p.x, 3.2, 0.05) || seam(p.y + 10, 1.6, 0.04)) c.multiplyScalar(0.55);
      const hd = Math.hypot((p.x - SHIP_HOLE.x) / SHIP_HOLE.rx, (p.y - SHIP_HOLE.y) / SHIP_HOLE.ry);
      if (p.z < 0 && hd < 1.5) c.lerp(col('#5a2a12'), clamp((1.5 - hd) * 1.6));   // torn, rusty rim
      return c;
    });
    parts.push(g);
    dark.push(box(6.8, 4.4, 8.2, SHIP_HOLE.x, -1.3, 0));   // the dark inside, seen through the hole
  }

  // the wooden deck: rotted planks, some missing, and two places where it has fallen in
  {
    const NZ = 18, pos = [], idx = [];
    const fallen = (x, z) => (x > 7 && x < 10.5 && z > -2.4 && z < 1.3) || (x > -18.2 && x < -15.6 && z > -0.6 && z < 2.6);
    for (let i = 0; i <= NX; i++) {
      const x = -SHIP_L2 + 2 * SHIP_L2 * i / NX, B = shipBeam(x), d = shipDeckY(x);
      for (let j = 0; j <= NZ; j++) { const z = -B + 2 * B * j / NZ; pos.push(x, d + 0.22 * (1 - Math.pow(z / Math.max(B, 0.01), 2)), z); }
    }
    for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
      const a = i * (NZ + 1) + j, b = a + NZ + 1;
      if (fallen((pos[a * 3] + pos[b * 3]) / 2, (pos[a * 3 + 2] + pos[a * 3 + 5]) / 2)) continue;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const g = fromArrays(pos, idx);
    paintGeo(g, p => {
      const plank = Math.floor((p.z + 10) / 0.3), piece = Math.floor((p.x + 30) / 2.6 + hash2(plank, 3) * 3), h = hash2(plank, piece);
      if (h < 0.12) return col('#12100e');                                             // missing plank
      return mixc('#3e342a', '#6a5a46', hash2(piece, plank * 1.7)).multiplyScalar(seam(p.z + 10, 0.3, 0.025) ? 0.6 : 1);
    });
    parts.push(g);
  }

  // a steel wall along the deck edge at the bow, and railings elsewhere (some bent or gone)
  [-1, 1].forEach(side => {
    const pos = [], idx = [], N = 36;
    for (let i = 0; i <= N; i++) { const x = lerp(10, SHIP_L2 - 0.4, i / N), y = shipDeckY(x), z = side * shipBeam(x); pos.push(x, y, z, x, y + 1.1, z * 0.985); }
    for (let i = 0; i < N; i++) { if (hash2(i, side) < 0.08) continue; const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = fromArrays(pos, idx); paintGeo(g, p => mixc('#2a2420', '#4a3426', fbm2(p.x, p.y))); parts.push(g);
    for (let s0 = -20; s0 < 9; s0 += 4.5) {
      if (R() < 0.3) continue;                                                     // this stretch of railing is gone
      const top = [], mid = [];
      for (let x = s0; x <= s0 + 4.5 + 0.01; x += 1.5) {
        const y = shipDeckY(x), z = side * (shipBeam(x) - 0.08), bend = R() < 0.2 ? (R() - 0.5) * 0.6 : 0;
        parts.push(rod(V(x, y, z), V(x + bend * 0.3, y + 1.0, z + side * bend), 0.035));
        top.push(V(x + bend * 0.3, y + 1.0, z + side * bend)); mid.push(V(x, y + 0.55, z));
      }
      [top, mid].forEach(pts => { if (pts.length > 1) parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, 0.03, 5)); });
    }
  });

  // the deckhouse, once painted white, with rows of windows; the bridge sits on top
  {
    const D = DECKHOUSE, cx = (D.x0 + D.x1) / 2, L = D.x1 - D.x0, y0 = shipDeckY(cx) + 0.2;
    const house = box(L, D.h, D.hw * 2, cx, y0 + D.h / 2, 0), bridge = box(6, 2.2, 5.6, 1, y0 + D.h + 1.1, 0);
    [house, bridge].forEach(g => paintGeo(g, p => mixc('#6f6a60', '#3e3028', clamp(fbm2(p.x * 0.5, p.y * 0.9 + p.z * 0.3) * 1.6 - 0.3))));
    parts.push(house, bridge);
    for (let x = D.x0 + 0.7; x < D.x1 - 0.4; x += 1.2) [-1, 1].forEach(sd => dark.push(box(0.55, 0.75, 0.08, x, y0 + 1.5, sd * (D.hw + 0.03))));
    for (let z = -2.3; z <= 2.31; z += 0.92) dark.push(box(0.08, 0.8, 0.62, 4.03, y0 + D.h + 1.3, z));
    // davits: curved arms that once held the lifeboats
    [-1, 1].forEach(sd => [-5, -2, 1, 4].forEach(x => {
      const g = new THREE.TorusGeometry(0.9, 0.07, 6, 10, Math.PI / 2); g.rotateY(sd * Math.PI / 2);
      g.translate(x, shipDeckY(x) + 0.05, sd * shipBeam(x));   // foot on deck, arm reaching out over the side paintGeo(g, () => '#3a2a20'); parts.push(g);
    }));
  }

  // funnel base (the funnel itself lies on the sea floor), masts, hatches, bollards and winches
  {
    const fy = shipDeckY(-9) + 0.22;
    const collar = new THREE.CylinderGeometry(1.3, 1.35, 0.6, 20, 1, true); collar.scale(1, 1, 0.8); collar.translate(-9, fy + 0.3, 0); paintGeo(collar, () => '#3a2c22'); parts.push(collar);
    const hole = new THREE.CircleGeometry(1.25, 20); hole.rotateX(-Math.PI / 2); hole.scale(1, 1, 0.8); hole.translate(-9, fy + 0.05, 0); dark.push(hole);
    const stub = new THREE.CylinderGeometry(0.24, 0.3, 3.4, 10); stub.translate(13, shipDeckY(13) + 1.7, 0); parts.push(stub);           // the foremast snapped off...
    const top = new THREE.CylinderGeometry(0.16, 0.24, 12, 10); top.rotateZ(Math.PI / 2 - 0.08); top.rotateY(0.55); top.translate(9.5, shipDeckY(9) + 1.1, 3.2); parts.push(top);   // ...and lies across the deck
    const main = new THREE.CylinderGeometry(0.2, 0.28, 11, 10); main.translate(0, 5.5, 0); main.rotateZ(0.12); main.translate(-15, shipDeckY(-15), 0); parts.push(main);
    const yard = new THREE.CylinderGeometry(0.09, 0.09, 5, 8); yard.rotateX(Math.PI / 2); yard.translate(-15 - 0.95, shipDeckY(-15) + 8, 0); parts.push(yard);
    [stub, top, main, yard].forEach(g => paintGeo(g, p => mixc('#2e2620', '#5a3a26', fbm2(p.x * 2, p.y * 2))));
    [[15.5, 3.0, 2.6], [-12.5, 3.4, 3.0]].forEach(([x, lx, lz]) => {   // cargo hatches: a raised frame around a dark opening
      const y = shipDeckY(x) + 0.2, t = 0.15, h = 0.7;
      const ring = [box(lx, h, t, x, y + h / 2, lz / 2), box(lx, h, t, x, y + h / 2, -lz / 2), box(t, h, lz, x + lx / 2, y + h / 2, 0), box(t, h, lz, x - lx / 2, y + h / 2, 0)];
      ring.forEach(g => { paintGeo(g, () => '#3a2e26'); parts.push(g); });
      dark.push(box(lx - 0.2, 0.05, lz - 0.2, x, y + 0.05, 0));
    });
    [19, 17.6, -19, -20.4].forEach(x => [-1, 1].forEach(sd => [0, 0.5].forEach(o => {
      const g = new THREE.CylinderGeometry(0.17, 0.2, 0.5, 10); g.translate(x + o, shipDeckY(x) + 0.45, sd * (shipBeam(x) - 0.7)); paintGeo(g, () => '#2c2622'); parts.push(g);
    })));
    [12, -17.2].forEach(x => { const g = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 12); g.rotateX(Math.PI / 2); g.translate(x, shipDeckY(x) + 0.65, 0); paintGeo(g, () => '#3a2c24'); parts.push(g); });
  }

  parts.forEach(g => { if (!g.attributes.color) paintGeo(g, () => '#3a2c22'); });   // railings and rods
  const steel = new THREE.Mesh(mergeGeo(parts), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.15, side: THREE.DoubleSide }), { detail: true, rust: true, bump: 1.6, caust: false }));
  dark.forEach(g => paintGeo(g, () => '#070606'));
  const holes = new THREE.Mesh(mergeGeo(dark), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }), { caust: false }));
  ship.add(steel, holes);

  // life on the wreck: pale glass sponges and anemones
  {
    const put = (geo, n, cols, s0, s1, seed) => {
      const Rg = seeded(seed), mesh = new THREE.InstancedMesh(geo, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), { caust: false }), n);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const x = lerp(-20, 21, Rg()), B = shipBeam(x), z = (Rg() * 2 - 1) * B * 0.85;
        p.set(x, shipDeckY(x) + 0.22 * (1 - Math.pow(z / Math.max(B, 0.01), 2)) - 0.03, z);
        q.setFromEuler(new THREE.Euler((Rg() - 0.5) * 0.3, Rg() * TAU, (Rg() - 0.5) * 0.3)); s.setScalar(lerp(s0, s1, Rg()));
        m.compose(p, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col(cols[Math.floor(Rg() * cols.length)]));
      }
      mesh.frustumCulled = false; ship.add(mesh);
    };
    put(vaseGeo(), Math.round(40 * DETAIL) + 8, ['#d8d4c8', '#e6e0d2', '#c9c0b0'], 0.3, 0.7, 5);
    put(anemoneGeo(), Math.round(60 * DETAIL) + 10, ['#f0e8dc', '#e8b0a0', '#f4d8c8'], 0.4, 0.9, 6);
  }
  return ship;
}

// Rusticles: icicle-like rust that hangs straight down from the wreck (as on the Titanic, at the same depth),
// plus the anchor chain hanging from the bow. Needs the ship's final position, because both hang with gravity.
function addRusticles(ship) {
  const R = seeded(88), inv = ship.getWorldQuaternion(new THREE.Quaternion()).invert(), down = new THREE.Vector3(0, -1, 0).applyQuaternion(inv);
  const pts = [], D = DECKHOUSE;
  for (let i = 0; i < 170; i++) { const x = lerp(-21, 21, R()); pts.push([x, shipDeckY(x) - 0.05, shipBeam(x) * 1.004]); }   // the low starboard deck edge (the ship leans that way, so rust hangs clear of the hull)
  for (let i = 0; i < 90; i++) { const x = lerp(-19, 20, R()), p = hullPoint(x, -0.25 - R() * 0.9); pts.push(p); }                      // the port bilge, which now leans out
  for (let i = 0; i < 70; i++) { const a = R() * TAU, x = SHIP_HOLE.x + Math.cos(a) * SHIP_HOLE.rx * 1.02, y = SHIP_HOLE.y + Math.sin(a) * SHIP_HOLE.ry * 1.02; pts.push([x, y, -shipBeam(x) * 0.99]); }   // the torn hole
  for (let i = 0; i < 60; i++) { const x = lerp(D.x0, D.x1, R()), sd = R() < 0.5 ? -1 : 1; pts.push([x, shipDeckY((D.x0 + D.x1) / 2) + 0.2 + D.h, sd * (D.hw + 0.02)]); }   // deckhouse roof edge
  const n = Math.round(pts.length * Math.max(DETAIL, 0.5)), geo = new THREE.ConeGeometry(1, 1, 6, 1); geo.rotateX(Math.PI); geo.translate(0, -0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, wet(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), { caust: false }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), down), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const [x, y, z] = pts[Math.floor(i * pts.length / n)], len = 0.2 + Math.pow(R(), 2) * 1.3;
    p.set(x, y, z); s.set(0.04 + len * 0.07, len, 0.04 + len * 0.07); m.compose(p, q, s); mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, col(['#7a3416', '#9a4a1e', '#b0602a', '#6a2c14'][Math.floor(R() * 4)]));
  }
  mesh.frustumCulled = false; ship.add(mesh);
  // the anchor chain: from the hawse hole at the bow, down to the sea floor
  const fwd = new THREE.Vector3(1, 0, 0), start = new THREE.Vector3(19.6, shipDeckY(19.6) - 0.7, shipBeam(19.6) * 0.96), cp = [];
  for (let k = 0; k <= 8; k++) { const u = k / 8; cp.push(start.clone().addScaledVector(down, u * 7.5).addScaledVector(fwd, Math.sin(u * Math.PI * 0.7) * 1.6)); }
  const chain = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cp), 60, 0.09, 6);
  paintGeo(chain, (pt) => (Math.floor(pt.distanceTo(start) / 0.22) % 2 ? col('#5a2a14') : col('#3a1c10')));
  const cm = new THREE.Mesh(chain, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), { caust: false })); ship.add(cm);
}

const WRECK_FLOOR_Y = -560;
function buildWreck() {
  const G = wg(4), floorH = (x, z) => WRECK_FLOOR_Y + (fbm2(x * 0.02, z * 0.02) - 0.4) * 6 + fbm2(x * 0.15, z * 0.15) * 0.4;
  // the ship lies on its keel with a list to starboard; sediment is heaped up against the buried hull
  const YAW = 0.5, cyw = Math.cos(YAW), syw = Math.sin(YAW);
  const toShip = (x, z) => [x * cyw - z * syw, x * syw + z * cyw];   // sea floor position to ship position (length, beam)
  const berm = (x, z) => { const [lx, lz] = toShip(x, z); return 1.7 * Math.exp(-Math.pow(Math.max(0, Math.abs(lx) - 19) / 6, 2)) * Math.exp(-Math.pow(Math.max(0, Math.abs(lz) - 4.2) / 4, 2)); };
  G.add(makeFloor(320, 150, (x, z) => floorH(x, z) + berm(x, z), (x, z) => mixc('#3a3d40', '#2a2a2b', fbm2(x * 0.1, z * 0.1)).lerp(col('#4a3a2e'), clamp(berm(x, z) * 0.4))));
  scatterRocks(G, 120, 220, floorH, '#3d3f42');
  const ship = buildShip();
  ship.position.set(0, floorH(0, 0) + 3.0, 0); ship.rotation.order = 'YXZ'; ship.rotation.set(0.27, YAW, 0.035); G.add(ship); G.userData.ship = ship;
  ship.updateMatrixWorld(true);
  addRusticles(ship);
  // the debris field: a funnel that fell off, torn plates and a boiler
  {
    const parts = [], R = seeded(66), base = floorH(0, 0), onFloor = (x, z) => floorH(x, z) - base;
    const fun = new THREE.CylinderGeometry(1.25, 1.35, 6.5, 20, 1, true); fun.scale(1, 1, 0.8); fun.computeVertexNormals();
    paintGeo(fun, p => mixc('#2a211c', '#5a3d28', fbm2(p.y * 0.8, Math.atan2(p.z, p.x))).multiplyScalar(p.y > 2.3 ? 0.55 : 1));
    fun.rotateZ(Math.PI / 2 - 0.12); fun.rotateY(1.1); fun.translate(-14, onFloor(-14, 16) + 0.9, 16); parts.push(fun);
    const boiler = new THREE.CylinderGeometry(1.4, 1.4, 3.2, 18); boiler.rotateZ(Math.PI / 2); boiler.rotateY(-0.4); boiler.translate(13, onFloor(13, -15) + 0.9, -15);
    boiler.computeVertexNormals(); paintGeo(boiler, p => mixc('#3a2418', '#6a3a1e', fbm2(p.x, p.z))); parts.push(boiler);
    for (let i = 0; i < 26; i++) {
      const w = 0.8 + R() * 2.6, g = new THREE.BoxGeometry(w, 0.08, 0.6 + R() * 1.6, 3, 1, 2), p = g.attributes.position;
      for (let k = 0; k < p.count; k++) p.setY(k, p.getY(k) + Math.sin(p.getX(k) * 2.1 + i) * 0.12);   // bent plates
      g.computeVertexNormals(); paintGeo(g, () => ['#4a2e1e', '#3a2a22', '#5a3a24'][i % 3]);
      const a = R() * TAU, r = 12 + R() * 22, x = Math.cos(a) * r, z = Math.sin(a) * r;
      g.rotateX((R() - 0.5) * 0.5); g.rotateY(R() * TAU); g.translate(x, onFloor(x, z) + 0.15, z); parts.push(g);
    }
    const dm = new THREE.Mesh(mergeGeo(parts), wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide }), { detail: true, rust: true, caust: false }));
    dm.position.y = base - 0.25; G.add(dm);   // pieces were placed relative to the floor height at the ship
  }

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
  const G = wg(5);
  // How far the wall stands out at height y along z: big buttresses, layered ledges (tilted a little), and lumpy rock.
  const wallD = (side, y, z) => {
    const yy = y + z * 0.06 + fbm2(z * 0.02 + side, y * 0.01) * 8, per = 7, s = ((yy / per) % 1 + 1) % 1;
    const ledge = smooth(clamp((fbm2(z * 0.04 + side * 5, Math.floor(yy / per) * 2.3) - 0.4) / 0.2)) * 2.2 * smooth(clamp((s - 0.45) / 0.5));
    return (fbm2(z * 0.07 + side * 9, y * 0.07) - 0.5) * 9 + Math.sin(y * 0.05 + z * 0.06) * 2.5 + ledge + (fbm2(z * 0.4 + side * 3, y * 0.4) - 0.5) * 1.4;
  };
  const wallGeo = (side) => {
    const NY = SMALL ? 90 : 170, NZ = SMALL ? 100 : 160, pos = [], idx = [];
    for (let i = 0; i <= NY; i++) for (let k = 0; k <= NZ; k++) {
      const y = TRENCH_TOP_Y - 150 + i * 336 / NY, z = -150 + k * 300 / NZ;
      pos.push(side * (15 + wallD(side, y, z) * 0.7 + Math.max(0, 25 - (y - TRENCH_TOP_Y + 150)) * 0.5), y, z);
    }
    for (let i = 0; i < NY; i++) for (let k = 0; k < NZ; k++) { const a = i * (NZ + 1) + k, b = a + NZ + 1; if (side > 0) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // dark rock in layers of different tone; pale sediment settles on anything facing up
    paintGeo(g, (p, n) => mixc('#2a2622', '#50463c', fbm2(p.z * 0.2, p.y * 0.2)).lerp(col('#6e665a'), smooth(clamp((n.y - 0.25) / 0.4)) * 0.8));
    return new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true, strata: true, bump: 1.8, caust: false }));
  };
  G.add(wallGeo(1), wallGeo(-1));
  const floorY = TRENCH_TOP_Y - 150 + 0;
  const floorH = (x, z) => floorY + (fbm2(x * 0.05, z * 0.05) - 0.4) * 5;
  const fl = makeFloor(300, 130, floorH, (x, z) => mixc('#4a443a', '#2e2a24', fbm2(x * 0.15, z * 0.15))); G.add(fl);
  scatterRocks(G, 80, 60, floorH, '#2f2b27');
  // fallen boulders piled at the foot of each wall
  scatterRocks(G, SMALL ? 90 : 180, 0, floorH, '#3a342e', (Rr) => { const side = Rr() < 0.5 ? -1 : 1; return [side * (10 + Math.pow(Rr(), 0.6) * 12), -70 + Rr() * 170]; });
  // sea cucumbers: the most common large animals on the deepest sea floors
  {
    const L = 0.32, body = loft(L, [[0, 0.004, 0.004, 0.004, 0], [0.06, 0.1, 0.1, 0.07, 0], [0.3, 0.15, 0.15, 0.1, 0], [0.75, 0.14, 0.14, 0.1, 0], [0.95, 0.08, 0.08, 0.06, 0], [1, 0.02, 0.02, 0.02, 0]], 20, 12);
    const parts = [body], Rc = seeded(71);
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; parts.push(place(new THREE.ConeGeometry(0.012, 0.09, 5), 0.5 * L, Math.sin(a) * 0.035, Math.cos(a) * 0.035, 0, 0, -Math.PI / 2 + Math.sin(a) * 0.6)); }   // mouth tentacles
    for (let k = 0; k < 8; k++) parts.push(place(new THREE.ConeGeometry(0.01, 0.07 + Rc() * 0.04, 5), (0.3 - k * 0.07) * L, 0.045, (k % 2 ? 1 : -1) * 0.02, (k % 2 ? 1 : -1) * 0.4, 0, 0));   // soft spikes on the back
    const g = mergeGeo(parts); paintGeo(g, (p, n) => mixc('#c98a98', '#f2c8cc', clamp(n.y * 0.5 + 0.5)));
    const n = SMALL ? 40 : 90, mesh = new THREE.InstancedMesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, transparent: true, opacity: 0.88, emissive: new THREE.Color(0.05, 0.02, 0.03) }), { caust: false }), n);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3(), Rs = seeded(72);
    for (let i = 0; i < n; i++) {
      const x = (Rs() - 0.5) * 17, z = -20 + Rs() * 110;
      pp.set(x, floorH(x, z) + 0.03, z); q.setFromEuler(new THREE.Euler(0, Rs() * TAU, 0)); s.setScalar(0.7 + Rs() * 0.9);
      m.compose(pp, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col(['#ffffff', '#f0d8e8', '#ffd8d0'][i % 3]));
    }
    mesh.frustumCulled = false; G.add(mesh);
  }
  G.userData.floorY = floorY; G.userData.floorH = floorH; return G;
}
