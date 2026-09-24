/* The trench: two steep walls of layered rock running along z, from the edge of the abyssal plain (about 6,000 m)
   down to the floor of the Challenger Deep (10,935 m). The tops of the walls meet the sea floor exactly. */
import * as THREE from '../lib/three.js';
import { SMALL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { worldY, DEEPEST } from '../dive/depth.js';
import { col, mixc } from '../util/color.js';
import { loft, mergeGeo, paintGeo, place } from '../util/geometry.js';
import { TAU, clamp, lerp, seeded, smooth } from '../util/math.js';
import { fbm2 } from '../util/noise.js';
import { scatterRocks } from './floor.js';
import { TRENCH } from './sites.js';
import { seafloorY } from './terrain.js';

const FLOOR_Y = worldY(DEEPEST);   // about -1177 in the world
function trenchFloorY(x, z) { return FLOOR_Y + (fbm2(x * 0.05, z * 0.05) - 0.4) * 3; }

// How far the wall stands out: big buttresses, layered ledges (tilted a little) and lumpy rock.
function wallBumps(side, y, z) {
  const yy = y + z * 0.06 + fbm2(z * 0.02 + side, y * 0.01) * 8, per = 7, s = ((yy / per) % 1 + 1) % 1;
  const ledge = smooth(clamp((fbm2(z * 0.04 + side * 5, Math.floor(yy / per) * 2.3) - 0.4) / 0.2)) * 2.2 * smooth(clamp((s - 0.45) / 0.5));
  return (fbm2(z * 0.07 + side * 9, y * 0.07) - 0.5) * 9 + Math.sin(y * 0.05 + z * 0.06) * 2.5 + ledge + (fbm2(z * 0.4 + side * 3, y * 0.4) - 0.5) * 1.4;
}
// s = 0 at the top edge, 1 at the floor. The bumps fade out at the top so the wall meets the plain exactly.
function wallX(side, s, y, z) {
  const top = side < 0 ? TRENCH.landTop : TRENCH.farTop, foot = side < 0 ? TRENCH.landFoot : TRENCH.farFoot;
  return lerp(top, foot, Math.pow(s, 0.85)) - side * wallBumps(side, y, z) * 0.7 * smooth(clamp(s / 0.08));
}
const topY = (side, z) => seafloorY(side < 0 ? TRENCH.landTop : TRENCH.farTop, z);
const sAt = (side, y, z) => { const t = topY(side, z); return clamp((t - y) / (t - FLOOR_Y)); };
// Where each wall is at height y (used to keep the diver off the rock)
const landWallX = (y, z) => wallX(-1, sAt(-1, y, z), y, z);
const farWallX = (y, z) => wallX(1, sAt(1, y, z), y, z);

function wallMesh(side) {
  const NY = SMALL ? 90 : 160, NZ = SMALL ? 100 : 160, pos = [], idx = [];
  for (let i = 0; i <= NY; i++) for (let k = 0; k <= NZ; k++) {
    const s = i / NY, z = lerp(TRENCH.zMin, TRENCH.zMax, k / NZ), y = lerp(topY(side, z), FLOOR_Y - 4, s);
    pos.push(wallX(side, s, y, z), y, z);
  }
  for (let i = 0; i < NY; i++) for (let k = 0; k < NZ; k++) { const a = i * (NZ + 1) + k, b = a + NZ + 1; if (side > 0) idx.push(a, a + 1, b, b, a + 1, b + 1); else idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // dark rock in layers of different tone; pale sediment settles on anything facing up
  paintGeo(g, (p, n) => mixc('#3e3833', '#6a5e50', fbm2(p.z * 0.2, p.y * 0.2)).lerp(col('#8a806e'), smooth(clamp((n.y - 0.25) / 0.4)) * 0.8));
  return new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: THREE.DoubleSide }), { detail: true, strata: true, bump: 1.8, caust: false }));
}

function floorMesh() {
  const x0 = TRENCH.landFoot - 8, x1 = TRENCH.farFoot + 8, nx = SMALL ? 40 : 70, nz = SMALL ? 120 : 200, pos = [], idx = [];
  for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) { const x = lerp(x0, x1, i / nx), z = lerp(TRENCH.zMin, TRENCH.zMax, k / nz); pos.push(x, trenchFloorY(x, z), z); }
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) { const a = i * (nz + 1) + k, b = a + nz + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  paintGeo(g, p => mixc('#6a6254', '#4e483e', fbm2(p.x * 0.15, p.z * 0.15)));
  return new THREE.Mesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), { detail: true, caust: false }));
}

// Sea cucumbers: the most common large animals on the deepest sea floors.
function seaCucumbers(n) {
  const L = 0.32, body = loft(L, [[0, 0.004, 0.004, 0.004, 0], [0.06, 0.1, 0.1, 0.07, 0], [0.3, 0.15, 0.15, 0.1, 0], [0.75, 0.14, 0.14, 0.1, 0], [0.95, 0.08, 0.08, 0.06, 0], [1, 0.02, 0.02, 0.02, 0]], 20, 12);
  const parts = [body], Rc = seeded(71);
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; parts.push(place(new THREE.ConeGeometry(0.012, 0.09, 5), 0.5 * L, Math.sin(a) * 0.035, Math.cos(a) * 0.035, 0, 0, -Math.PI / 2 + Math.sin(a) * 0.6)); }   // mouth tentacles
  for (let k = 0; k < 8; k++) parts.push(place(new THREE.ConeGeometry(0.01, 0.07 + Rc() * 0.04, 5), (0.3 - k * 0.07) * L, 0.045, (k % 2 ? 1 : -1) * 0.02, (k % 2 ? 1 : -1) * 0.4, 0, 0));   // soft spikes on the back
  const g = mergeGeo(parts); paintGeo(g, (p, nn) => mixc('#c98a98', '#f2c8cc', clamp(nn.y * 0.5 + 0.5)));
  const mesh = new THREE.InstancedMesh(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, transparent: true, opacity: 0.88, emissive: new THREE.Color(0.05, 0.02, 0.03) }), { caust: false }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), s = new THREE.Vector3(), Rs = seeded(72);
  for (let i = 0; i < n; i++) {
    const x = lerp(TRENCH.landFoot + 3, TRENCH.farFoot - 3, Rs()), z = -40 + Rs() * 100;
    pp.set(x, trenchFloorY(x, z) + 0.03, z); q.setFromEuler(new THREE.Euler(0, Rs() * TAU, 0)); s.setScalar(0.7 + Rs() * 0.9);
    m.compose(pp, q, s); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col(['#ffffff', '#f0d8e8', '#ffd8d0'][i % 3]));
  }
  mesh.frustumCulled = false; return mesh;
}

function buildTrench() {
  const G = new THREE.Group(); G.name = 'trench';
  G.add(wallMesh(-1), wallMesh(1), floorMesh());
  const mid = (TRENCH.landFoot + TRENCH.farFoot) / 2;
  scatterRocks(G, 80, 0, trenchFloorY, '#2f2b27', R => [lerp(TRENCH.landFoot, TRENCH.farFoot, R()), -60 + R() * 140]);
  // fallen boulders piled at the foot of each wall
  scatterRocks(G, SMALL ? 90 : 180, 0, trenchFloorY, '#3a342e', R => { const side = R() < 0.5 ? -1 : 1; return [mid + side * ((TRENCH.farFoot - TRENCH.landFoot) / 2 - Math.pow(R(), 0.6) * 12), -70 + R() * 170]; });
  G.add(seaCucumbers(SMALL ? 40 : 90));
  G.userData.cull = { center: new THREE.Vector3(mid, (FLOOR_Y + topY(-1, 0)) / 2, 0), radius: 220 };
  return G;
}

export { FLOOR_Y, trenchFloorY, landWallX, farWallX, buildTrench };
