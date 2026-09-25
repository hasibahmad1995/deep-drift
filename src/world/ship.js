/* The shipwreck itself: hull, deck, deckhouse, masts, rusticles and anchor chain. */
import * as THREE from '../lib/three.js';
import { DETAIL, SMALL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { mergeGeo, paintGeo } from '../util/geometry.js';
import { TAU, clamp, lerp, seeded, smooth } from '../util/math.js';
import { fbm2, hash2 } from '../util/noise.js';
import { anemoneGeo, vaseGeo } from './corals.js';
import { UP } from './layout.js';

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
  // the solid parts, in ship space, for the diver (the hull itself is checked with its own shape in collision.js)
  const pills = ship.userData.pills = [], boxes = ship.userData.boxes = [];
  const solidBox = (w, h, d, x, y, z) => boxes.push([new THREE.Vector3(x - w / 2, y - h / 2, z - d / 2), new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2)]);
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
      for (let k = 1; k < top.length; k++) pills.push([top[k - 1].clone().setY(top[k - 1].y - 0.5), top[k], 0.06]);
    }
  });

  // the deckhouse, once painted white, with rows of windows; the bridge sits on top
  {
    const D = DECKHOUSE, cx = (D.x0 + D.x1) / 2, L = D.x1 - D.x0, y0 = shipDeckY(cx) + 0.2;
    const house = box(L, D.h, D.hw * 2, cx, y0 + D.h / 2, 0), bridge = box(6, 2.2, 5.6, 1, y0 + D.h + 1.1, 0);
    [house, bridge].forEach(g => paintGeo(g, p => mixc('#6f6a60', '#3e3028', clamp(fbm2(p.x * 0.5, p.y * 0.9 + p.z * 0.3) * 1.6 - 0.3))));
    parts.push(house, bridge);
    solidBox(L, D.h, D.hw * 2, cx, y0 + D.h / 2, 0); solidBox(6, 2.2, 5.6, 1, y0 + D.h + 1.1, 0);
    for (let x = D.x0 + 0.7; x < D.x1 - 0.4; x += 1.2) [-1, 1].forEach(sd => dark.push(box(0.55, 0.75, 0.08, x, y0 + 1.5, sd * (D.hw + 0.03))));
    for (let z = -2.3; z <= 2.31; z += 0.92) dark.push(box(0.08, 0.8, 0.62, 4.03, y0 + D.h + 1.3, z));
    // davits: curved arms that once held the lifeboats
    [-1, 1].forEach(sd => [-5, -2, 1, 4].forEach(x => {
      const g = new THREE.TorusGeometry(0.9, 0.07, 6, 10, Math.PI / 2); g.rotateY(sd * Math.PI / 2);
      g.translate(x, shipDeckY(x) + 0.05, sd * shipBeam(x));   // foot on deck, arm reaching out over the side
      paintGeo(g, () => '#3a2a20'); parts.push(g);
      pills.push([V(x, shipDeckY(x), sd * shipBeam(x)), V(x, shipDeckY(x) + 0.9, sd * (shipBeam(x) + 0.9)), 0.1]);
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
    const topAxis = V(-0.85, 0.08, 0.52).normalize().multiplyScalar(6), topMid = V(9.5, shipDeckY(9) + 1.1, 3.2), mainFoot = V(-15, shipDeckY(-15), 0);
    pills.push([V(13, shipDeckY(13), 0), V(13, shipDeckY(13) + 3.4, 0), 0.3], [topMid.clone().sub(topAxis), topMid.clone().add(topAxis), 0.24],
      [mainFoot, V(-15 - 11 * Math.sin(0.12), shipDeckY(-15) + 11 * Math.cos(0.12), 0), 0.28], [V(-15.95, shipDeckY(-15) + 8, -2.5), V(-15.95, shipDeckY(-15) + 8, 2.5), 0.1]);
    pills.push([V(-9, fy, 0), V(-9, fy + 0.6, 0), 1.3]);   // funnel collar
    [[15.5, 3.0, 2.6], [-12.5, 3.4, 3.0]].forEach(([x, lx, lz]) => {   // cargo hatches: a raised frame around a dark opening
      const y = shipDeckY(x) + 0.2, t = 0.15, h = 0.7;
      const ring = [box(lx, h, t, x, y + h / 2, lz / 2), box(lx, h, t, x, y + h / 2, -lz / 2), box(t, h, lz, x + lx / 2, y + h / 2, 0), box(t, h, lz, x - lx / 2, y + h / 2, 0)];
      ring.forEach(g => { paintGeo(g, () => '#3a2e26'); parts.push(g); });
      solidBox(lx, h, lz, x, y + h / 2, 0);
      dark.push(box(lx - 0.2, 0.05, lz - 0.2, x, y + 0.05, 0));
    });
    [19, 17.6, -19, -20.4].forEach(x => [-1, 1].forEach(sd => [0, 0.5].forEach(o => {
      const g = new THREE.CylinderGeometry(0.17, 0.2, 0.5, 10); g.translate(x + o, shipDeckY(x) + 0.45, sd * (shipBeam(x) - 0.7)); paintGeo(g, () => '#2c2622'); parts.push(g);
    })));
    [12, -17.2].forEach(x => { const g = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 12); g.rotateX(Math.PI / 2); g.translate(x, shipDeckY(x) + 0.65, 0); paintGeo(g, () => '#3a2c24'); parts.push(g);
      pills.push([V(x, shipDeckY(x) + 0.65, -0.75), V(x, shipDeckY(x) + 0.65, 0.75), 0.35]); });
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

export { SHIP_L2, SHIP_KEEL, shipDeckY, shipBeam, shipKeelY, shipFull, hullPoint, SHIP_HOLE, inShipHole, DECKHOUSE, buildShip, addRusticles };
