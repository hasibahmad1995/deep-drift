/* The deep trench: layered rock walls, boulders, a floor and sea cucumbers. */
import * as THREE from '../lib/three.js';
import { SMALL } from '../engine/device.js';
import { wet } from '../engine/wet.js';
import { col, mixc } from '../util/color.js';
import { loft, mergeGeo, paintGeo, place } from '../util/geometry.js';
import { TAU, clamp, seeded, smooth } from '../util/math.js';
import { fbm2 } from '../util/noise.js';
import { makeFloor, scatterRocks } from './floor.js';
import { wg } from './layout.js';

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

export { TRENCH_TOP_Y, buildTrench };
