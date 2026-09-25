/* Coral and sponge shapes, and scattering many copies of them on the reef. */
import * as THREE from '../lib/three.js';
import { DETAIL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { mergeGeo, paintGeo, place, sphereAt } from '../util/geometry.js';
import { TAU, clamp, lerp, seeded } from '../util/math.js';
import { canvasTexture } from '../util/textures.js';
import { UP } from './layout.js';
import { addTiled } from './tiles.js';

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
  const g = new THREE.SphereGeometry(1, 26, 12, 0, TAU, 0, Math.PI / 2), p = g.attributes.position;
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
  for (let i = 0; i < 34; i++) {
    const a = R() * TAU, h = R() * 0.85, rr = Math.sqrt(R()) * 0.32 * (0.4 + h);
    parts.push(sphereAt(0.05 + R() * 0.05, Math.cos(a) * rr, 0.1 + h, Math.sin(a) * rr, 4));   // small, so a very simple ball (8 faces) is enough
  }
  const g = mergeGeo(parts);   // keeps each ball's round normals, so the few faces still shade smoothly
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
  for (let i = 0; i < 44; i++) {
    const g = new THREE.CylinderGeometry(0.004, 0.022, 0.5, 4, 1, true); g.translate(0, 0.25, 0);
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

// The deep reef (60 to 190 m, the 'mesophotic' zone): big sea fans, dark black corals and sponges replace the corals that need bright light.
const DEEP_REEF_SETS = [
  { geo: () => fanGeo(), n: 300, cols: ['#e8c040', '#e07a30', '#d84a4a', '#efe2c8', '#b84fa0'], s: [1.4, 3.2], rough: 0.8, fan: true, up: 0.15 },
  { geo: () => whipGeo(), n: 260, cols: ['#2a1c14', '#3a2a1c', '#5a3a24'], s: [1.1, 2.2], rough: 0.7, up: 0.55 },   // black corals (their skeleton is black; the living tissue is brown)
  { geo: () => vaseGeo(), n: 160, cols: ['#c98a3a', '#b0527a', '#d8c070', '#8a6a9a'], s: [0.8, 2.0], rough: 0.8, up: 0.55 },
  { geo: () => spongeGeo(), n: 200, cols: ['#e0b13a', '#c9862e', '#d2587a'], s: [0.8, 1.6], rough: 0.7, up: 0.5 },
  { geo: () => tableGeo(), n: 50, cols: ['#9a8a6a', '#8a9a6a', '#a08060'], s: [0.8, 1.8], rough: 0.7, up: 0.8 },   // plate corals, near the top of the deep reef
  { geo: () => softGeo(), n: 80, cols: ['#e0507a', '#f07a5a', '#d84a4a', '#f0a04a'], s: [0.5, 1.2], rough: 0.5, up: 0.35 }
];

// Puts many copies of each coral on the reef surface. up = how much a coral turns to grow upward (default 0.35).
function scatterCorals(group, surf, sets = CORAL_SETS, upDefault = 0.35, seed = 123) {
  const R = seeded(seed), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), m = new THREE.Matrix4(), p = new THREE.Vector3(), s = new THREE.Vector3(), nrm = new THREE.Vector3();
  sets.forEach(set => {
    if (!surf.candidates.length) return;
    const n = Math.max(6, Math.round(set.n * DETAIL));
    const geo = set.geo(); geo.computeBoundingSphere();
    // small corals shrink away where they would be only a few dots across (about 8 pixels), bigger ones stay out to where the water hides them
    const far = clamp(geo.boundingSphere.radius * 2 * set.s[1] * 66, 40, 260);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: !set.fan, roughness: set.rough, side: THREE.DoubleSide, map: set.fan ? fanTexture : null, alphaTest: set.fan ? 0.5 : 0 });
    wet(mat, { detail: false, shrink: [far * 0.7, far] });
    const mesh = new THREE.InstancedMesh(geo, mat, n);
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
    addTiled(group, mesh, 32, far);   // drawn in tiles, so corals behind you or far away are skipped
  });
}

export { branchGeo, brainGeo, tableGeo, fanGeo, softGeo, spongeGeo, anemoneGeo, fanTexture, CORAL_SETS, vaseGeo, whipGeo, WALL_SETS, DEEP_REEF_SETS, scatterCorals };
