/* Hydrothermal vents: chimneys, smoke, glow and tube worms. */
import * as THREE from '../lib/three.js';
import { DETAIL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { mergeGeo, paintGeo } from '../util/geometry.js';
import { TAU, clamp, lerp, seeded } from '../util/math.js';
import { fbm2, hash2 } from '../util/noise.js';
import { glowSprite, makeSmoke } from './effects.js';
import { makeFloor, scatterRocks } from './floor.js';
import { wg } from './layout.js';

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

export { VENT_FLOOR_Y, buildVents };
