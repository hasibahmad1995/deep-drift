/* Scattered rocks on any floor. */
import * as THREE from '../lib/three.js';
import { wet } from '../engine/wet.js';
import { col } from '../util/color.js';
import { seeded } from '../util/math.js';
import { fbm2 } from '../util/noise.js';

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

export { scatterRocks };
