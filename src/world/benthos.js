/* Life that sits on the deep sea floor, each kind where it really lives:
   - volcano slope (about 1,700 to 4,500 m): bamboo corals, glass sponges, sea lilies (stalked crinoids), brittle stars
   - abyssal plain (about 4,500 to 6,000 m): sea pigs, xenophyophores (giant single cells), brittle stars
   - trench floor (10,900 m): xenophyophores (sea cucumbers and amphipods are added in trench.js and extras.js) */
import * as THREE from '../lib/three.js';
import { DETAIL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { loft, mergeGeo, paintGeo, place } from '../util/geometry.js';
import { TAU, clamp, lerp, seeded } from '../util/math.js';
import { branchGeo, vaseGeo } from './corals.js';
import { TRENCH } from './sites.js';
import { addSolidsFor } from './solids.js';
import { addTiled } from './tiles.js';
import { seafloorY } from './terrain.js';
import { trenchFloorY } from './trench.js';

// ---- shapes ----
// Sea lily: a thin stalk with a small cup and ten feathery arms opening like a flower.
function seaLilyGeo() {
  const parts = [], R = seeded(61), h = 0.7;
  const stalk = new THREE.CylinderGeometry(0.008, 0.012, h, 5); stalk.translate(0, h / 2, 0); parts.push(stalk);
  parts.push(place(new THREE.SphereGeometry(0.025, 8, 6), 0, h, 0));
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * TAU, out = 0.12 + R() * 0.05, pts = [];
    for (let i = 0; i <= 4; i++) { const u = i / 4; pts.push(new THREE.Vector3(Math.cos(a) * out * u, h + 0.02 + Math.sin(u * 2.2) * 0.12, Math.sin(a) * out * u)); }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.005, 3));
  }
  return paintGeo(mergeGeo(parts), p => mixc('#b88a5a', '#f0d0a0', clamp((p.y - h * 0.8) / 0.2)));
}
// Brittle star: a small disc and five thin arms that curve over the floor.
function brittleStarGeo() {
  const parts = [place(new THREE.SphereGeometry(0.035, 10, 6), 0, 0.01, 0)];
  parts[0].scale(1, 0.35, 1);
  for (let k = 0; k < 5; k++) {
    const a = k / 5 * TAU, pts = [];
    for (let i = 0; i <= 5; i++) { const u = i / 5, b = a + Math.sin(u * 3 + k) * 0.5; pts.push(new THREE.Vector3(Math.cos(b) * (0.03 + u * 0.18), 0.008 + Math.sin(u * Math.PI) * 0.015, Math.sin(b) * (0.03 + u * 0.18))); }
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.006, 3));
  }
  return paintGeo(mergeGeo(parts), () => '#ffffff');
}
// Sea pig (Scotoplanes): a plump, see-through pink sea cucumber that walks on tube feet, with feelers on its back.
function seaPigGeo() {
  const L = 0.16, parts = [loft(L, [[0, 0.004, 0.004, 0.004, 0], [0.08, 0.2, 0.2, 0.14, 0], [0.4, 0.26, 0.26, 0.16, 0], [0.8, 0.22, 0.2, 0.14, 0], [1, 0.03, 0.03, 0.03, 0]], 16, 12)];
  for (let k = 0; k < 6; k++) [-1, 1].forEach(s => parts.push(place(new THREE.ConeGeometry(0.008, 0.035, 5), (0.3 - k * 0.12) * L, -0.03, s * 0.035, Math.PI, 0, s * 0.3)));   // tube-feet legs
  [-1, 1].forEach(s => parts.push(place(new THREE.ConeGeometry(0.006, 0.05, 5), 0.3 * L, 0.05, s * 0.015, s * -0.4, 0, -0.3)));                      // feelers on the back
  return paintGeo(mergeGeo(parts), (p, n) => mixc('#d88a98', '#f4c8cc', clamp(n.y * 0.5 + 0.5)));
}
// Xenophyophore: a fragile, lumpy mound made by one single cell, from a few cm up to about 20 cm.
function xenoGeo() {
  const g = new THREE.IcosahedronGeometry(1, 2), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 0.75 + 0.35 * Math.abs(Math.sin(x * 7 + z * 5) * Math.cos(y * 6 + x * 3)); p.setXYZ(i, x * k, Math.max(y, -0.2) * k * 0.55, z * k); }
  g.computeVertexNormals(); return paintGeo(g, (q, n) => mixc('#a89a80', '#e0d6c0', clamp(n.y * 0.5 + 0.5)));
}
// Glass sponge: a tall, pale, lacy vase (like the Venus flower basket)
function glassSpongeGeo() { const g = vaseGeo(); g.scale(0.45, 1.7, 0.45); return g; }

// ---- placing many copies on the floor ----
// area = { where(R) -> [x, z], ground(x, z) -> floor height }; size(R) -> scale; cols = colours to pick from.
function plant(G, geo, mat, n, area, size, cols, seed, lean = 0.15) {
  const { where, ground } = area;
  const mesh = new THREE.InstancedMesh(geo, mat, n), R = seeded(seed), m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const [x, z] = where(R), sc = size(R);
    p.set(x, ground(x, z) - 0.02, z); q.setFromEuler(new THREE.Euler((R() - 0.5) * lean, R() * TAU, (R() - 0.5) * lean)); s.setScalar(sc);
    m.compose(p, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col(cols[Math.floor(R() * cols.length)]).multiplyScalar(0.8 + R() * 0.3));
  }
  addSolidsFor(mesh, geo.userData.thick ?? 0.5, 0.8);   // the taller ones are solid (low ones sit below the diver anyway)
  return addTiled(G, mesh);   // small tiles, so only the ones near you are drawn
}
const matte = (opts = {}) => wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide, ...opts }), { caust: false });
const n = k => Math.max(8, Math.round(k * Math.max(DETAIL, 0.5)));

function buildBenthos() {
  const G = new THREE.Group(); G.name = 'benthos';
  // near the route across the slope and plain (the route wanders between z = -12 and z = 6)
  const area = (x0, x1, z0, z1, ground) => ({ where: R => [lerp(x0, x1, R()), lerp(z0, z1, R())], ground });
  const slope = area(215, 345, -16, 14, seafloorY), plain = area(345, 552, -30, 30, seafloorY);   // close to the route (which runs near z = 0)
  const deep = area(TRENCH.landFoot + 3, TRENCH.farFoot - 3, -20, 70, trenchFloorY);
  // volcano slope
  const bamboo = branchGeo(23, 3); bamboo.scale(0.6, 1.6, 0.6);   // tall and airy, white or gold, with dark joints
  paintGeo(bamboo, p => (Math.floor(p.y * 9) % 2 ? col('#2a2420') : mixc('#e8e0c8', '#ffffff', clamp(p.y))));
  plant(G, bamboo, matte(), n(220), slope, R => 0.8 + R() * 1.4, ['#f0e8d0', '#e0c078', '#ffffff'], 301, 0.3);
  plant(G, glassSpongeGeo(), matte({ transparent: true, opacity: 0.8 }), n(180), slope, R => 0.4 + R() * 0.6, ['#f0ece0', '#e0dccc'], 302);
  plant(G, seaLilyGeo(), matte(), n(240), slope, R => 0.7 + R() * 0.8, ['#ffffff', '#f0d8b0', '#e8b890'], 303, 0.25);
  plant(G, brittleStarGeo(), matte(), n(300), slope, R => 0.6 + R() * 0.8, ['#e8a070', '#d8d0c0', '#e89aa8'], 304, 0.05);
  // abyssal plain
  plant(G, seaPigGeo(), matte({ transparent: true, opacity: 0.9 }), n(90), plain, R => 0.8 + R() * 0.6, ['#ffffff', '#ffe0e8'], 305, 0.05);
  plant(G, xenoGeo(), matte(), n(260), plain, R => 0.04 + Math.pow(R(), 2) * 0.1, ['#ffffff', '#e8dcc8'], 306, 0.1);
  plant(G, brittleStarGeo(), matte(), n(260), plain, R => 0.6 + R() * 0.8, ['#d8d0c0', '#e89aa8', '#c8b8a0'], 307, 0.05);
  // floor of the Challenger Deep
  plant(G, xenoGeo(), matte(), n(160), deep, R => 0.05 + Math.pow(R(), 2) * 0.12, ['#ffffff', '#e8dcc8'], 308, 0.1);
  return G;
}

export { buildBenthos, seaLilyGeo, brittleStarGeo, seaPigGeo, xenoGeo };
